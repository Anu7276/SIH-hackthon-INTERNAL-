"""
pipeline_orchestrator.py
=========================
Startup-AYUSH Portal (SIH 2026) — End-to-End Pitch Evaluation Pipeline

Chains the 4 existing agents together in order:

    idea_intake_agent.run_idea_intake_agent
        -> intake_json
    pitch_evaluator_agent.run_pitch_evaluator_agent   (intake_json + idea Q&A transcript)
        -> pitch_score_json
    profile_evaluator_agent.run_profile_evaluator_agent  (intake_json + profile Q&A transcript)
        -> profile_score_json
    scoring_feedback_agent.run_scoring_feedback_agent  (pitch_score_json + profile_score_json)
        -> final combined output

SCHEMA CHECK (done before writing this file):
    All 4 agents' existing input/output schemas were reviewed field-by-field.
    No mismatches were found — each agent's real output already matches
    exactly what the next agent's run_* function expects:

      idea_intake_agent output keys:
        problem, solution, target_market, revenue_model, traction, team,
        differentiation, ask, missing_or_vague_fields, raw_summary,
        similar_existing_products, market_check_status
      -> pitch_evaluator_agent.run_pitch_evaluator_agent(transcript, intake_json)
         reads: problem, solution, target_market, revenue_model, traction, ask,
                missing_or_vague_fields, similar_existing_products  [all present]
      -> profile_evaluator_agent.run_profile_evaluator_agent(transcript, intake_json)
         reads: team  [present]

      pitch_evaluator_agent output keys:
        scores, score_justifications, pitch_subtotal, consistency_flags,
        gap_coverage_notes, competitor_awareness_note
      -> scoring_feedback_agent.normalize_scores() reads: pitch_subtotal [present]
      -> scoring_feedback_agent._fallback_feedback_report()/generate_feedback_report()
         read: score_justifications, consistency_flags, gap_coverage_notes,
               competitor_awareness_note, scores  [all present]

      profile_evaluator_agent output keys:
        scores, score_justifications, profile_subtotal, consistency_notes,
        team_gaps
      -> scoring_feedback_agent reads: profile_subtotal, score_justifications,
               consistency_notes, team_gaps, scores  [all present]

    So NO business logic in any of the 4 agents was changed. The only edits
    made anywhere were to pitch_evaluator_agent.py, profile_evaluator_agent.py,
    and scoring_feedback_agent.py's .env loading (see "CHANGES MADE" below) —
    a robustness fix required for the agents to work correctly when imported
    as modules rather than run standalone.

CHANGES MADE TO EXISTING FILES:
    1. pitch_evaluator_agent.py, profile_evaluator_agent.py,
       scoring_feedback_agent.py:
         BEFORE:  load_dotenv()
         AFTER:   load_dotenv(dotenv_path=pathlib.Path(__file__).parent / ".env",
                               override=True)
         WHY: A bare load_dotenv() only searches the *current working
         directory* upward for a .env file. That's fine when each agent is
         run standalone from its own folder, but breaks (silently loads no
         keys) once these modules are imported together by an orchestrator
         that may be launched from a different working directory. Anchoring
         the path to each file's own directory (matching the pattern
         idea_intake_agent.py already used) makes all 4 agents load the same
         shared .env reliably regardless of where python is invoked from.
         No scoring, prompts, or business logic were touched.
    2. idea_intake_agent.py, profile_evaluator_agent.py,
       scoring_feedback_agent.py: UNCHANGED apart from the above.
    3. No file's public function signatures, return shapes, or prompts were
       modified.

NOTE ON SDKs: idea_intake_agent.py uses the newer `google-genai` package
(`from google import genai`), while the other three agents use the older,
now end-of-life `google-generativeai` package (`import google.generativeai`).
Both packages install and import side-by-side without conflict (verified),
so this does not block the pipeline. It's worth migrating the other three
agents to `google-genai` at some point since Google has stopped updating
`google-generativeai`, but that's a separate, optional cleanup — not a
pipeline-breaking issue, so it was left alone here per your instructions.

Usage:
    python pipeline_orchestrator.py
"""

import json
import logging
import pathlib
import sys
import traceback
from typing import Any, Dict, Optional

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("PipelineOrchestrator")

# ── Import all 4 agent modules ───────────────────────────────────────────────
# (Each of these triggers that module's own load_dotenv() call as a side
#  effect of import — see CHANGES MADE above for why that's now safe.)
import idea_intake_agent
import pitch_evaluator_agent
import profile_evaluator_agent
import scoring_feedback_agent


# ═══════════════════════════════════════════════════════════════════════════
# Main pipeline function
# ═══════════════════════════════════════════════════════════════════════════

def run_full_pipeline(
    pitch_file_path: str,
    mock_transcript_idea_qa: str,
    mock_transcript_profile_qa: str,
    faiss_index_path: str = "knowledge_base.faiss",
) -> Dict[str, Any]:
    """
    Runs the full 4-agent pitch evaluation pipeline end-to-end.

    Args:
        pitch_file_path: Path to the founder's pitch deck (.pdf/.ppt/.pptx).
        mock_transcript_idea_qa: Transcript text of the idea/pitch portion
            of the (mock, for now) live interview.
        mock_transcript_profile_qa: Transcript text of the founder/team
            portion of the (mock, for now) live interview.
        faiss_index_path: Optional path to a pre-built FAISS knowledge base
            for the Idea Intake Agent's competitor RAG check.

    Returns:
        A single JSON-serializable dict:
        {
            "pipeline_status": "complete" | "failed_at_<stage>",
            "failed_stage": None | "<stage name>",
            "error": None | "<error message>" (only set if a stage failed),
            "intake_json": {...} | None,
            "pitch_score_json": {...} | None,
            "profile_score_json": {...} | None,
            "final_output": {...} | None,   # scoring_feedback_agent's output
        }

        If a stage fails, every stage's result produced *before* the failure
        is still included, so partial output is always returned and never
        silently dropped.
    """
    result: Dict[str, Any] = {
        "pipeline_status": "complete",
        "failed_stage": None,
        "error": None,
        "intake_json": None,
        "pitch_score_json": None,
        "profile_score_json": None,
        "final_output": None,
    }

    # ── Stage 1: Idea Intake Agent ───────────────────────────────────────────
    log.info("=" * 70)
    log.info("STAGE 1/4 — Idea Intake Agent")
    log.info("=" * 70)
    try:
        intake_json = idea_intake_agent.run_idea_intake_agent(
            file_path=pitch_file_path,
            faiss_index_path=faiss_index_path,
        )
        result["intake_json"] = intake_json
        log.info("STAGE 1/4 complete.")
    except Exception as exc:
        log.error("STAGE 1/4 FAILED (idea_intake_agent): %s", exc)
        log.debug(traceback.format_exc())
        result["pipeline_status"] = "failed_at_idea_intake"
        result["failed_stage"] = "idea_intake_agent"
        result["error"] = str(exc)
        return result

    # ── Stage 2: Pitch Evaluator Agent ───────────────────────────────────────
    log.info("=" * 70)
    log.info("STAGE 2/4 — Pitch Evaluator Agent")
    log.info("=" * 70)
    try:
        pitch_score_json = pitch_evaluator_agent.run_pitch_evaluator_agent(
            transcript=mock_transcript_idea_qa,
            intake_json=intake_json,
        )
        if isinstance(pitch_score_json, dict) and "error" in pitch_score_json:
            raise RuntimeError(pitch_score_json["error"])
        result["pitch_score_json"] = pitch_score_json
        log.info("STAGE 2/4 complete.")
    except Exception as exc:
        log.error("STAGE 2/4 FAILED (pitch_evaluator_agent): %s", exc)
        log.debug(traceback.format_exc())
        result["pipeline_status"] = "failed_at_pitch_evaluator"
        result["failed_stage"] = "pitch_evaluator_agent"
        result["error"] = str(exc)
        return result

    # ── Stage 3: Profile Evaluator Agent ─────────────────────────────────────
    log.info("=" * 70)
    log.info("STAGE 3/4 — Profile Evaluator Agent")
    log.info("=" * 70)
    try:
        profile_score_json = profile_evaluator_agent.run_profile_evaluator_agent(
            transcript=mock_transcript_profile_qa,
            intake_json=intake_json,
        )
        if isinstance(profile_score_json, dict) and "error" in profile_score_json:
            raise RuntimeError(profile_score_json["error"])
        result["profile_score_json"] = profile_score_json
        log.info("STAGE 3/4 complete.")
    except Exception as exc:
        log.error("STAGE 3/4 FAILED (profile_evaluator_agent): %s", exc)
        log.debug(traceback.format_exc())
        result["pipeline_status"] = "failed_at_profile_evaluator"
        result["failed_stage"] = "profile_evaluator_agent"
        result["error"] = str(exc)
        return result

    # ── Stage 4: Scoring & Feedback Agent ────────────────────────────────────
    log.info("=" * 70)
    log.info("STAGE 4/4 — Scoring & Feedback Agent")
    log.info("=" * 70)
    try:
        final_output = scoring_feedback_agent.run_scoring_feedback_agent(
            pitch_score_json=pitch_score_json,
            profile_score_json=profile_score_json,
        )
        if isinstance(final_output, dict) and "error" in final_output:
            raise RuntimeError(final_output["error"])
        result["final_output"] = final_output
        log.info("STAGE 4/4 complete.")
    except Exception as exc:
        log.error("STAGE 4/4 FAILED (scoring_feedback_agent): %s", exc)
        log.debug(traceback.format_exc())
        result["pipeline_status"] = "failed_at_scoring_feedback"
        result["failed_stage"] = "scoring_feedback_agent"
        result["error"] = str(exc)
        return result

    log.info("=" * 70)
    log.info("PIPELINE COMPLETE — all 4 stages ran successfully.")
    log.info("=" * 70)
    return result


# ═══════════════════════════════════════════════════════════════════════════
# Pretty-print helper for the final summary
# ═══════════════════════════════════════════════════════════════════════════

def print_summary(result: Dict[str, Any]) -> None:
    """Prints a clean, human-readable summary instead of a raw JSON dump."""
    print("\n" + "=" * 70)
    print("  PIPELINE RUN SUMMARY")
    print("=" * 70)

    print(f"\nPipeline status : {result['pipeline_status']}")
    if result["failed_stage"]:
        print(f"Failed stage    : {result['failed_stage']}")
        print(f"Error           : {result['error']}")

    final = result.get("final_output")
    if not final:
        print("\nNo final scored output available (pipeline did not complete).")
        print("=" * 70 + "\n")
        return

    print(f"\nFinal Score     : {final['total_score']} / {final['max_score']}")
    breakdown = final.get("score_breakdown", {})
    print(
        f"  Pitch component   : {breakdown.get('pitch_component')} / 19.5"
    )
    print(
        f"  Profile component : {breakdown.get('profile_component')} / 10.5"
    )
    print(f"\nRouting decision : {final['routing']}")

    feedback = final.get("feedback", {})
    print("\n--- Strengths ---")
    for item in feedback.get("strengths", []):
        print(f"  • {item}")

    print("\n--- Areas to Improve ---")
    for item in feedback.get("areas_to_improve", []):
        print(f"  • {item}")

    print("\n--- Summary ---")
    print(f"  {feedback.get('summary_paragraph', '')}")

    print("\n" + "=" * 70 + "\n")


# ═══════════════════════════════════════════════════════════════════════════
# __main__ — end-to-end demo run
# ═══════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":

    HERE = pathlib.Path(__file__).parent
    SAMPLE_PITCH_FILE = str(HERE / "sample_pitch.pdf")
    FAISS_INDEX_PATH = str(HERE / "knowledge_base.faiss")

    # ── Startup checks for required and optional files ────────────────────────
    pitch_path = pathlib.Path(SAMPLE_PITCH_FILE)
    if not pitch_path.exists():
        alt_pitch_path = HERE / "sample_pitch.pptx"
        if alt_pitch_path.exists():
            SAMPLE_PITCH_FILE = str(alt_pitch_path)
            log.info("Found alternative pitch file: %s", SAMPLE_PITCH_FILE)
        else:
            print("\n" + "=" * 70)
            print("  ERROR: Pitch deck file not found!")
            print("=" * 70)
            print(
                f"  Could not find '{SAMPLE_PITCH_FILE}' or 'sample_pitch.pptx' in project folder:\n"
                f"  {HERE}\n\n"
                "  Please place a sample pitch deck file (sample_pitch.pdf or sample_pitch.pptx)\n"
                "  in this directory before running pipeline_orchestrator.py."
            )
            print("=" * 70 + "\n")
            sys.exit(1)

    faiss_path = pathlib.Path(FAISS_INDEX_PATH)
    if not faiss_path.exists():
        log.warning(
            "FAISS index file not found at '%s'. "
            "RAG vector check will be skipped; live web search fallback will be used instead.",
            FAISS_INDEX_PATH,
        )


    # Realistic mock transcript for the IDEA/PITCH portion of the interview.
    # Written in the same style as the mock transcripts already used inside
    # pitch_evaluator_agent.py's own __main__ block, but tailored to the
    # AyurCare AI pitch described in sample_pitch.pdf / sample_pitch_result.json.
    MOCK_TRANSCRIPT_IDEA_QA = """
Interviewer: Walk me through the core problem AyurCare AI is solving.
Founder: Most people who want real Ayurvedic guidance either read generic
blog posts or try random home remedies they saw online — there's no easy
way to get a personalized, credible recommendation without booking an
in-person visit. On the other side, small Ayurvedic clinics don't have any
digital tools to manage patients at scale, so a lot of good practitioners
are basically invisible online.

Interviewer: And what exactly does AyurCare AI do about that?
Founder: We built a mobile app that runs a guided questionnaire to assess a
user's Prakriti, their body constitution in Ayurvedic terms, and then
generates a personalized daily wellness plan — diet, routine, herbal
suggestions. Every plan is reviewed and signed off by a certified AYUSH
practitioner before it reaches the user, and practitioners get a dashboard
to manage their patients remotely.

Interviewer: Who is your target user, specifically? Do you have a sense of
market size?
Founder: Honestly, right now our early focus is just "people in India who
are already interested in Ayurveda and wellness" — we haven't broken that
down into a specific TAM/SAM/SOM yet. We know Ayurveda is a multi-billion
dollar industry in India but we haven't sized our specific addressable
segment precisely.

Interviewer: Tell me about traction — do you have real numbers?
Founder: We ran a closed beta with about 40 users over three weeks and got
positive verbal feedback, but I don't have hard retention or usage numbers
to share yet — we were mostly validating that people would actually follow
through a Prakriti assessment and read the generated plan.

Interviewer: How do you make money?
Founder: Freemium — the basic wellness plan is free, and INR 299/month
unlocks practitioner-reviewed premium plans and consultations. We also plan
a B2B side, licensing the practitioner dashboard to AYUSH clinics for
roughly INR 4,999/month per clinic, though that side hasn't launched yet.

Interviewer: There are already apps like The Ayurveda Experience and
platforms like NirogStreet in this space — how are you different?
Founder: Most of those are either e-commerce for Ayurvedic products or a
practitioner directory. We're not selling products and we're not just a
directory — the AI does a structured Prakriti assessment and generates an
actual personalized plan, but a licensed AYUSH practitioner has to approve
it before the user sees it, so it's not just an AI chatbot giving medical
advice unsupervised.

Interviewer: What are you asking for, and what would you use it for?
Founder: We're looking for early support to grow the platform — mainly to
fund practitioner onboarding and some marketing spend, but I don't have an
exact number locked in yet.

Interviewer: How feasible is this for your team to build and scale?
Founder: I handle the tech side — I've built full-stack products and AI
agents before. My co-founder is BAMS-qualified with three years of clinical
Ayurveda practice, so she reviews the medical logic and helps recruit
practitioners. We also have an informal advisor who's a senior AYUSH
Ministry consultant.
""".strip()

    # Realistic mock transcript for the FOUNDER/TEAM portion of the interview.
    MOCK_TRANSCRIPT_PROFILE_QA = """
Interviewer: Tell me a bit about yourself and what led you to start
AyurCare AI.
Founder: I'm a final-year B.Tech Computer Science student. I've built a
couple of AI-agent side projects and one full-stack product before this.
My co-founder grew up around Ayurvedic medicine — her mother runs a small
clinic — and she kept telling me how much time practitioners waste on
manual patient follow-ups, plus how hard it is for good practitioners to
get discovered online. That's really where the idea came from.

Interviewer: Is this full-time for both of you right now?
Founder: It's full-time for me — I've been on this for about four months
since I wrapped up my coursework. My co-founder is still finishing her BAMS
practical rotations, so she's part-time for another two months, then she's
moving to full-time as well.

Interviewer: Tell me about the rest of the team.
Founder: Right now it's the two of us as co-founders. We also have an
informal advisor, a senior AYUSH Ministry consultant, who reviews our
practitioner-vetting criteria roughly once a month, but that's not a formal
or paid role.

Interviewer: Any gaps you're aware of on the team?
Founder: Definitely — we don't have anyone with dedicated growth or
business development experience yet, which matters a lot for the B2B
clinic-licensing side. We're also a two-person tech team, so as usage
grows, we'll need another engineer.

Interviewer: What makes you personally credible to lead the tech side of a
health-adjacent product like this?
Founder: I've shipped two prior products end-to-end, including handling
their backend and deployment myself, and I've spent the last two months
specifically studying how AYUSH regulations affect what an app like this
can and can't claim, so I'm not building this blind to the compliance
side.
""".strip()

    print("\n" + "=" * 70)
    print("  STARTUP-AYUSH PORTAL — FULL PIPELINE RUN")
    print("=" * 70)
    print(f"\nPitch file       : {SAMPLE_PITCH_FILE}")
    print(f"FAISS index path : {FAISS_INDEX_PATH}")

    run_result = run_full_pipeline(
        pitch_file_path=SAMPLE_PITCH_FILE,
        mock_transcript_idea_qa=MOCK_TRANSCRIPT_IDEA_QA,
        mock_transcript_profile_qa=MOCK_TRANSCRIPT_PROFILE_QA,
        faiss_index_path=FAISS_INDEX_PATH,
    )

    # Full raw JSON (useful for debugging / feeding into the next system)
    print("\n" + "=" * 70)
    print("  FULL RAW JSON OUTPUT")
    print("=" * 70)
    print(json.dumps(run_result, indent=2, ensure_ascii=False))

    # Clean human-readable summary
    print_summary(run_result)
