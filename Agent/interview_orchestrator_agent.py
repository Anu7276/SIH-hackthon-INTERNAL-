"""
interview_orchestrator_agent.py
--------------------------------
Stage 2: Live Interview Session — INTERVIEW ORCHESTRATOR AGENT (Groq)

SIH 2026 | SIH1345 | Startup-AYUSH Portal — AI Pitch Evaluation System

WHAT CHANGED FROM THE FIRST DRAFT (debug pass against your real agents):

  1. STATEFUL / SESSION-BASED instead of one blocking function.
     Your other 4 agents (idea_intake_agent, pitch_evaluator_agent,
     profile_evaluator_agent, scoring_feedback_agent) are all plain
     call-and-return functions -- fine for a script. A dashboard, though,
     talks to the backend one HTTP request per turn ("here's the founder's
     answer, give me the next question"), so a single blocking
     conduct_interview() loop can't work behind a web API. This version
     is a session object you can `.start()` then repeatedly `.submit_answer()`
     -- see InterviewSession below. The original callback-based loop is
     kept too, as conduct_interview_blocking(), for CLI/plain-script use.

  2. TRANSCRIPT FORMAT now matches your real pipeline exactly.
     pitch_evaluator_agent.py, profile_evaluator_agent.py, and the mock
     transcripts inside pipeline_orchestrator.py all use the literal
     labels "Interviewer:" / "Founder:". My first draft used "AGENT:" /
     "FOUNDER:" -- fixed to match exactly what your evaluators were
     tested against.

  3. TWO TRANSCRIPTS OUT, not one.
     pipeline_orchestrator.run_full_pipeline() takes
     `mock_transcript_idea_qa` and `mock_transcript_profile_qa` as two
     SEPARATE strings -- pitch_evaluator_agent only ever sees the idea
     portion, profile_evaluator_agent only ever sees the team portion.
     This agent now tags every question by category and splits the
     transcript accordingly: category "team" -> profile transcript,
     everything else -> idea transcript. get_result() returns both,
     named to drop straight into run_full_pipeline()'s two mock_transcript_*
     parameters.

INTEGRATION CONTRACT:

    from interview_orchestrator_agent import InterviewSession

    session = InterviewSession(idea_context=intake_json)   # intake_json
                                                             # = output of
                                                             # idea_intake_agent
    q = session.start()                     # -> first question (str)
    ...
    result = session.submit_answer(founder_answer_text)
    # result = {
    #   "question": str | None,       # next question, or None if finished
    #   "finished": bool,
    #   "progress": {"current": int, "total": int},
    # }
    ...
    final = session.get_result()
    # final = {
    #   "startup_name": str,
    #   "transcript": str,                    # full transcript, all turns
    #   "transcript_idea_qa": str,             # -> pitch_evaluator_agent
    #   "transcript_profile_qa": str,          # -> profile_evaluator_agent
    #   "qa_pairs": [ {question, answer, category, is_followup}, ... ],
    #   "founder_questions": [ {question, answer}, ... ],
    #   "duration_estimate_min": float,
    # }

    # Then, unchanged from your existing pipeline:
    pitch_score_json   = pitch_evaluator_agent.run_pitch_evaluator_agent(
        transcript=final["transcript_idea_qa"], intake_json=intake_json)
    profile_score_json = profile_evaluator_agent.run_profile_evaluator_agent(
        transcript=final["transcript_profile_qa"], intake_json=intake_json)

Requires: `pip install groq` (added to requirements.txt)
Env var:  GROQ_API_KEY
"""

import os
import pathlib
import time
import json
import uuid
from typing import Callable, List, Dict, Optional

# ── Load .env (same pattern as the other agents) ────────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=pathlib.Path(__file__).parent / ".env", override=True)
except ImportError:
    pass  # dotenv not installed — keys must be set in the environment manually

from groq import Groq

DEFAULT_MODEL = "llama-3.3-70b-versatile"  # matches GROQ_MODEL used elsewhere in your pipeline


# ---------------------------------------------------------------------------
# CORE QUESTION BANK -- 20 fixed questions across 8 categories.
# category "team" -> routed to transcript_profile_qa (Profile Evaluator Agent)
# every other category -> routed to transcript_idea_qa (Pitch Evaluator Agent)
# ---------------------------------------------------------------------------

CORE_QUESTIONS: List[Dict[str, str]] = [
    {"id": "Q1", "category": "problem_solution",
     "question": "In one or two sentences, what is the core problem your startup is solving, and who feels this problem most acutely?"},
    {"id": "Q2", "category": "problem_solution",
     "question": "Walk me through your solution — what does the product or service actually do, end to end?"},
    {"id": "Q3", "category": "problem_solution",
     "question": "Why is this the right time for this solution? What has changed recently that makes it possible or necessary now?"},

    {"id": "Q4", "category": "domain_ayush",
     "question": "How does your solution integrate or align with AYUSH systems (Ayurveda, Yoga, Unani, Siddha, or Homeopathy) specifically?"},
    {"id": "Q5", "category": "domain_ayush",
     "question": "Is your product or formulation backed by any clinical validation, traditional-knowledge documentation, or practitioner endorsement?"},
    {"id": "Q6", "category": "domain_ayush",
     "question": "What regulatory approvals or certifications (e.g. AYUSH Ministry, GMP, licensing) does your startup currently have or plan to pursue?"},

    {"id": "Q7", "category": "market",
     "question": "How large is your target market, and how did you arrive at that estimate?"},
    {"id": "Q8", "category": "market",
     "question": "Who are your top two or three competitors or alternatives, and what do you do differently or better?"},
    {"id": "Q9", "category": "market",
     "question": "Who is your primary customer — B2C, B2B, government/institutional — and why did you choose that segment first?"},

    {"id": "Q10", "category": "product_tech",
     "question": "What is the current stage of your product — idea, prototype, MVP, or already live with users?"},
    {"id": "Q11", "category": "product_tech",
     "question": "What technology or process gives you a defensible edge that competitors can't easily copy?"},

    {"id": "Q12", "category": "business_model",
     "question": "How does your startup make money? Walk me through your revenue model."},
    {"id": "Q13", "category": "business_model",
     "question": "What are your unit economics — roughly what does it cost to acquire and serve a customer, versus what they pay you?"},

    {"id": "Q14", "category": "traction",
     "question": "What traction do you have so far — users, revenue, pilots, partnerships, or letters of intent?"},
    {"id": "Q15", "category": "traction",
     "question": "What's the strongest piece of evidence you have that customers actually want this?"},

    {"id": "Q16", "category": "team",
     "question": "Tell me about your founding team — what relevant background or expertise does each person bring?"},
    {"id": "Q17", "category": "team",
     "question": "What's the biggest challenge your team has faced so far, and how did you handle it?"},
    {"id": "Q18", "category": "team",
     "question": "Why are you personally the right person/team to build this, specifically in the AYUSH/wellness space?"},

    {"id": "Q19", "category": "vision",
     "question": "Where do you see this startup in three years if everything goes right?"},
    {"id": "Q20", "category": "vision",
     "question": "What do you need most right now — funding, mentorship, distribution partners, regulatory support — and how would you use it?"},
]

PROFILE_CATEGORIES = {"team"}  # routed to transcript_profile_qa; everything else -> idea


def _get_groq_client(api_key: Optional[str] = None) -> Groq:
    key = api_key or os.environ.get("GROQ_API_KEY")
    if not key:
        raise EnvironmentError(
            "GROQ_API_KEY environment variable is not set. "
            "Export it before running: export GROQ_API_KEY='your-key'"
        )
    return Groq(api_key=key)


def _looks_like_question(text: str) -> bool:
    if not text:
        return False
    stripped = text.strip()
    starters = ("what", "why", "how", "when", "where", "who", "can i",
                "could you", "do you", "does this", "is it", "will i", "will this")
    return stripped.endswith("?") or stripped.lower().startswith(starters)


class InterviewSession:
    """
    One live interview, driven turn-by-turn (start -> submit_answer* -> get_result).
    Safe to hold multiple InterviewSession instances concurrently (e.g. keyed
    by session_id in a FastAPI in-memory dict) -- no shared/global state.
    """

    def __init__(
        self,
        idea_context: Optional[Dict] = None,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        allow_followups: bool = True,
    ):
        self.session_id = str(uuid.uuid4())
        self.idea_context = idea_context or {}
        self.model = model
        self.allow_followups = allow_followups
        try:
            self.client = _get_groq_client(api_key)
        except EnvironmentError:
            # The core interview remains usable in hosted demos without a Groq key.
            # In that mode it asks the curated question set and skips AI follow-ups.
            self.client = None
            self.allow_followups = False

        self.transcript_lines: List[str] = []
        self.qa_pairs: List[Dict] = []
        self.founder_questions: List[Dict] = []

        self._queue: List[Dict] = list(CORE_QUESTIONS)  # remaining core questions
        self._current: Optional[Dict] = None             # current question dict being answered
        self._finished = False
        self._start_time: Optional[float] = None

    # -----------------------------------------------------------------
    # Public: session lifecycle
    # -----------------------------------------------------------------
    def start(self) -> str:
        self._start_time = time.time()
        name = self.idea_context.get("startup_name") or (self.idea_context.get("solution", "")[:40]) or "your startup"
        opening = (
            f"Hi, thanks for joining. I'll be interviewing you about {name} today. "
            f"This will take about twenty minutes — I'll ask you some core questions, "
            f"and feel free to ask me anything at any point. Let's start with the first question."
        )
        self.transcript_lines.append(f"Interviewer: {opening}")
        self._advance_to_next_question()
        self.transcript_lines.append(f"Interviewer: {self._current['question']}")
        return self._current["question"]

    def current_question(self) -> Optional[str]:
        return self._current["question"] if self._current else None

    def progress(self) -> Dict[str, int]:
        asked = len(self.qa_pairs)
        current_index = asked + (1 if self._current and not self._finished else 0)
        return {"current": min(current_index, len(CORE_QUESTIONS)), "total": len(CORE_QUESTIONS)}

    def is_finished(self) -> bool:
        return self._finished

    def submit_answer(self, answer: str) -> Dict:
        """
        Feed the founder's answer for the current question. Returns:
          {"question": str|None, "finished": bool, "progress": {...},
           "founder_question_handled": str|None}
        """
        if self._finished:
            return {"question": None, "finished": True, "progress": self.progress(),
                     "founder_question_handled": None}

        self.transcript_lines.append(f"Founder: {answer}")

        # If the founder answered with a question instead of / alongside an answer,
        # handle it inline and re-ask the same question next turn.
        if _looks_like_question(answer):
            founder_q_answer = self._handle_founder_question(answer)
            self.transcript_lines.append(f"Interviewer: Going back to my question — {self._current['question']}")
            return {
                "question": self._current["question"],
                "finished": False,
                "progress": self.progress(),
                "founder_question_handled": founder_q_answer,
            }

        # Log the completed Q&A pair
        cur = self._current
        self.qa_pairs.append({
            "question": cur["question"],
            "answer": answer,
            "category": cur["category"],
            "is_followup": cur.get("is_followup", False),
        })

        # Decide whether a follow-up is warranted (only off of core questions)
        if self.allow_followups and not cur.get("is_followup", False):
            followup_q = self._maybe_generate_followup(cur["question"], answer, cur["category"])
            if followup_q:
                self._current = {"question": followup_q, "category": cur["category"], "is_followup": True}
                self.transcript_lines.append(f"Interviewer: {followup_q}")
                return {
                    "question": followup_q,
                    "finished": False,
                    "progress": self.progress(),
                    "founder_question_handled": None,
                }

        self._advance_to_next_question()

        if self._finished:
            closing = "That covers everything I wanted to ask — thank you for your time. This concludes the interview."
            self.transcript_lines.append(f"Interviewer: {closing}")
            return {
                "question": None,
                "finished": True,
                "progress": self.progress(),
                "founder_question_handled": None,
            }

        self.transcript_lines.append(f"Interviewer: {self._current['question']}")
        return {
            "question": self._current["question"],
            "finished": False,
            "progress": self.progress(),
            "founder_question_handled": None,
        }

    def get_result(self) -> Dict:
        name = self.idea_context.get("startup_name") or "the startup"
        idea_lines, profile_lines = [], []
        # Rebuild per-category transcripts from qa_pairs (clean, evaluator-facing --
        # excludes greeting/closing/founder-question tangents).
        for qa in self.qa_pairs:
            block = [f"Interviewer: {qa['question']}", f"Founder: {qa['answer']}"]
            if qa["category"] in PROFILE_CATEGORIES:
                profile_lines.extend(block)
            else:
                idea_lines.extend(block)

        duration_min = round((time.time() - self._start_time) / 60, 2) if self._start_time else 0.0

        return {
            "startup_name": name,
            "transcript": "\n".join(self.transcript_lines),
            "transcript_idea_qa": "\n".join(idea_lines),
            "transcript_profile_qa": "\n".join(profile_lines),
            "qa_pairs": self.qa_pairs,
            "founder_questions": self.founder_questions,
            "duration_estimate_min": duration_min,
        }

    # -----------------------------------------------------------------
    # Internal
    # -----------------------------------------------------------------
    def _advance_to_next_question(self):
        if not self._queue:
            self._current = None
            self._finished = True
            return
        nxt = self._queue.pop(0)
        self._current = {"question": nxt["question"], "category": nxt["category"], "is_followup": False}

    def _maybe_generate_followup(self, question: str, answer: str, category: str) -> Optional[str]:
        if self.client is None:
            return None
        system_prompt = (
            "You are an interview orchestrator for a startup pitch evaluation. "
            "Given a question and the founder's answer, decide if a SHORT, sharp "
            "follow-up question would meaningfully improve evaluation quality "
            "(e.g. the answer was vague, generic, lacked numbers, or dodged the question). "
            "If a follow-up is NOT needed, respond with exactly: NONE. "
            "If needed, respond with ONLY the follow-up question text, no preamble, "
            "under 25 words, conversational tone."
        )
        user_prompt = (
            f"Category: {category}\nQuestion: {question}\nFounder's answer: {answer}\n\n"
            f"Idea context: {json.dumps(self.idea_context, default=str)[:800]}"
        )
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=80,
            )
            text = resp.choices[0].message.content.strip()
            if text.upper().startswith("NONE"):
                return None
            return text
        except Exception as e:
            print(f"[InterviewSession] follow-up generation failed: {e}")
            return None

    def _handle_founder_question(self, founder_question: str) -> str:
        if self.client is None:
            answer = "Thanks for asking. We will cover that during the interview or follow up with you after the session."
            self.transcript_lines.append(f"Founder (question): {founder_question}")
            self.transcript_lines.append(f"Interviewer: {answer}")
            self.founder_questions.append({"question": founder_question, "answer": answer})
            return answer
        system_prompt = (
            "You are a helpful interview host for a startup pitch evaluation platform "
            "(Startup-AYUSH Portal). The founder just asked you a question mid-interview. "
            "Answer briefly and helpfully (2-3 sentences), then naturally transition back "
            "to the interview. Do not reveal scoring criteria or internal evaluation logic."
        )
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": founder_question},
                ],
                temperature=0.4,
                max_tokens=150,
            )
            answer = resp.choices[0].message.content.strip()
        except Exception as e:
            answer = "That's a great question — our team will follow up with you on that after the session."
            print(f"[InterviewSession] founder-question answer failed: {e}")

        self.transcript_lines.append(f"Founder (question): {founder_question}")
        self.transcript_lines.append(f"Interviewer: {answer}")
        self.founder_questions.append({"question": founder_question, "answer": answer})
        return answer


# ---------------------------------------------------------------------------
# Legacy callback-based entry point -- kept for CLI / plain-script use where a
# single blocking loop is fine (not used by the web dashboard, which drives
# InterviewSession directly turn-by-turn instead).
# ---------------------------------------------------------------------------

def conduct_interview_blocking(
    idea_context: Dict,
    speak: Callable[[str], None],
    listen: Callable[[], str],
    api_key: Optional[str] = None,
) -> Dict:
    session = InterviewSession(idea_context=idea_context, api_key=api_key)
    question = session.start()
    speak(question)
    while not session.is_finished():
        answer = listen()
        result = session.submit_answer(answer)
        if result["question"]:
            speak(result["question"])
    return session.get_result()


# ---------------------------------------------------------------------------
# Standalone demo / smoke test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    def mock_speak(text: str):
        print(f"\n🎙️  INTERVIEWER: {text}")

    def mock_listen() -> str:
        return input("👤  FOUNDER: ")

    sample_idea_context = {
        "startup_name": "AyurCare AI",
        "problem": "Patients struggle to find verified Ayurvedic doctors.",
        "solution": "AI Prakriti assessment signed by AYUSH practitioners.",
        "target_market": "Urban Indian wellness consumers.",
        "revenue_model": "INR 299/mo subscription and INR 4999/mo clinic SaaS.",
        "team": "Ananya Rao (Tech) and Dr. Vikram Singh (BAMS).",
    }

    result = conduct_interview_blocking(sample_idea_context, mock_speak, mock_listen)

    print("\n\n===== FINAL OUTPUT (pass to Stage 3 evaluators) =====")
    print(json.dumps(result, indent=2))
