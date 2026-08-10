"""
interview_api.py
------------------
FastAPI backend for the Startup-AYUSH Portal Live Interview Dashboard.

Wires InterviewSession (interview_orchestrator_agent.py) up to HTTP
endpoints the dashboard (interview_dashboard.html) talks to, and — once
an interview finishes — chains straight into your existing
pitch_evaluator_agent / profile_evaluator_agent / scoring_feedback_agent
to return a final score, exactly matching the contract already proven
out in pipeline_orchestrator.py's run_full_pipeline().

Run:
    pip install -r requirements.txt --break-system-packages
    export GROQ_API_KEY="..."
    export GEMINI_API_KEY="..."
    uvicorn interview_api:app --reload --port 8000

Then open interview_dashboard.html in a browser (or serve it from any
static host / your main dashboard's frontend) and point its API_BASE
constant at http://localhost:8000.

Endpoints:
    POST /api/interview/start
        body: { "idea_context": {...} }   # optional; falls back to a
                                            # demo AyurCare AI context if
                                            # omitted, so the dashboard
                                            # works standalone for a demo
        -> { "session_id": str, "question": str, "progress": {...} }

    POST /api/interview/answer
        body: { "session_id": str, "answer": str }
        -> { "question": str|null, "finished": bool, "progress": {...},
             "founder_question_handled": str|null }

    GET  /api/interview/result/{session_id}
        -> full transcript + qa_pairs + transcript_idea_qa/profile_qa

    POST /api/interview/evaluate/{session_id}
        Runs pitch_evaluator_agent + profile_evaluator_agent +
        scoring_feedback_agent on the finished interview's transcripts.
        -> final scored output (same shape as pipeline_orchestrator's
           run_full_pipeline()["final_output"])

Note: session state is kept in-memory (a plain dict), which is fine for
a hackathon demo / single-process deployment. Swap for Redis or a DB if
you need multi-process / persistence.
"""

import os
import logging
import pathlib
import shutil
import tempfile
import uuid
from typing import Any, Dict, Optional

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from interview_orchestrator_agent import InterviewSession

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s — %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("InterviewAPI")

app = FastAPI(title="Startup-AYUSH Portal — Live Interview API")

# Wide-open CORS for hackathon/demo use — tighten this to your dashboard's
# actual origin before any real deployment.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store: session_id -> InterviewSession
_SESSIONS: Dict[str, InterviewSession] = {}
# Optional cache of intake_json per session, if you pass it in at /start
_INTAKE_CACHE: Dict[str, Dict[str, Any]] = {}

DEMO_IDEA_CONTEXT = {
    "startup_name": "AyurCare AI",
    "problem": "Patients seeking authentic Ayurvedic treatment struggle to find verified practitioners and often rely on unregulated online sources for herbal remedies.",
    "solution": "A mobile platform connecting patients with verified AYUSH practitioners for teleconsultations, plus AI-driven Prakriti assessment signed off by a certified practitioner.",
    "target_market": "Urban Indian wellness consumers aged 25-55.",
    "revenue_model": "INR 299/month subscription for consumers, INR 4,999/month clinic SaaS for practitioners.",
    "traction": "40-user closed beta over 3 weeks.",
    "team": "Ananya Rao (Tech) and Dr. Vikram Singh (BAMS).",
    "differentiation": "AI-assisted but practitioner-reviewed, unlike unverified online remedy content.",
    "ask": "Early funding for practitioner onboarding and marketing.",
    "missing_or_vague_fields": ["traction", "revenue_model"],
    "similar_existing_products": [],
    "market_check_status": "search_incomplete",
}


# ---------------------------------------------------------------------------
# Request/response models
# ---------------------------------------------------------------------------

class StartRequest(BaseModel):
    idea_context: Optional[Dict[str, Any]] = None


class AnswerRequest(BaseModel):
    session_id: str
    answer: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/idea/upload")
async def upload_pitch_deck(file: UploadFile = File(...)):
    """
    Accepts a pitch deck file (.pdf or .ppt/.pptx), saves it temporarily,
    and runs Stage 1 (idea_intake_agent) to extract structured intake_json.
    """
    log.info("[Upload] Received file: %s (content_type=%s)", file.filename, file.content_type)
    
    filename = file.filename or "pitch_deck.pdf"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".ppt", ".pptx"]:
        log.warning("[Upload] Rejected unsupported file type: %s", ext)
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Please upload a PDF or PPT/PPTX file."
        )

    # Save uploaded file temporarily
    try:
        temp_dir = tempfile.gettempdir()
        temp_file_path = os.path.join(temp_dir, f"pitch_{uuid.uuid4().hex}{ext}")
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        log.info("[Upload] Saved temporary file at: %s", temp_file_path)
    except Exception as exc:
        log.error("[Upload] Failed to save uploaded file: %s", exc)
        raise HTTPException(status_code=500, detail=f"Could not save uploaded file: {exc}")

    # Import and run idea_intake_agent
    try:
        import idea_intake_agent
        faiss_path = str(pathlib.Path(__file__).parent / "knowledge_base.faiss")
        log.info("[Upload] Starting Idea Intake Agent on: %s (FAISS path: %s)", temp_file_path, faiss_path)
        
        intake_json = idea_intake_agent.run_idea_intake_agent(
            file_path=temp_file_path,
            faiss_index_path=faiss_path
        )
    except Exception as exc:
        log.error("[Upload] Idea Intake Agent execution failed: %s", exc)
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass
        raise HTTPException(status_code=500, detail=f"Idea Intake Agent error: {exc}")
    finally:
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

    if isinstance(intake_json, dict) and intake_json.get("error"):
        err_msg = intake_json.get("error")
        log.error("[Upload] Idea Intake Agent returned error: %s", err_msg)
        raise HTTPException(status_code=500, detail=f"Idea Intake analysis failed: {err_msg}")

    log.info("[Upload] Idea Intake Agent successfully completed analysis.")
    return {"intake_json": intake_json}


@app.post("/api/interview/start")
def start_interview(req: StartRequest):
    idea_context = req.idea_context or DEMO_IDEA_CONTEXT
    try:
        session = InterviewSession(idea_context=idea_context)
        question = session.start()
    except EnvironmentError as e:
        raise HTTPException(status_code=500, detail=str(e))

    _SESSIONS[session.session_id] = session
    _INTAKE_CACHE[session.session_id] = idea_context

    return {
        "session_id": session.session_id,
        "question": question,
        "progress": session.progress(),
        "startup_name": idea_context.get("startup_name", "the startup"),
    }


@app.post("/api/interview/answer")
def answer_interview(req: AnswerRequest):
    session = _SESSIONS.get(req.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Start a new interview.")

    result = session.submit_answer(req.answer)
    return result


@app.get("/api/interview/result/{session_id}")
def get_result(session_id: str):
    session = _SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if not session.is_finished():
        raise HTTPException(status_code=400, detail="Interview is not finished yet.")
    return session.get_result()


@app.post("/api/interview/evaluate/{session_id}")
def evaluate_interview(session_id: str):
    """
    Runs the finished interview's transcripts through your existing
    pitch_evaluator_agent + profile_evaluator_agent + scoring_feedback_agent,
    exactly as pipeline_orchestrator.run_full_pipeline() does for stages 2-4.
    Requires GEMINI_API_KEY to be set (these 3 agents use Gemini).
    """
    session = _SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    if not session.is_finished():
        raise HTTPException(status_code=400, detail="Interview is not finished yet.")

    intake_json = _INTAKE_CACHE.get(session_id, DEMO_IDEA_CONTEXT)
    final = session.get_result()

    try:
        import pitch_evaluator_agent
        import profile_evaluator_agent
        import scoring_feedback_agent
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not import evaluator agents — make sure this file sits in the same "
                   f"folder as pitch_evaluator_agent.py / profile_evaluator_agent.py / "
                   f"scoring_feedback_agent.py. ({e})",
        )

    try:
        pitch_score_json = pitch_evaluator_agent.run_pitch_evaluator_agent(
            transcript=final["transcript_idea_qa"], intake_json=intake_json,
        )
        if isinstance(pitch_score_json, dict) and "error" in pitch_score_json:
            raise RuntimeError(pitch_score_json["error"])

        profile_score_json = profile_evaluator_agent.run_profile_evaluator_agent(
            transcript=final["transcript_profile_qa"], intake_json=intake_json,
        )
        if isinstance(profile_score_json, dict) and "error" in profile_score_json:
            raise RuntimeError(profile_score_json["error"])

        final_output = scoring_feedback_agent.run_scoring_feedback_agent(
            pitch_score_json=pitch_score_json, profile_score_json=profile_score_json,
        )
        if isinstance(final_output, dict) and "error" in final_output:
            raise RuntimeError(final_output["error"])

    except Exception as exc:
        log.error("Evaluation pipeline failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))

    return {
        "interview": final,
        "pitch_score_json": pitch_score_json,
        "profile_score_json": profile_score_json,
        "final_output": final_output,
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "active_sessions": len(_SESSIONS)}
