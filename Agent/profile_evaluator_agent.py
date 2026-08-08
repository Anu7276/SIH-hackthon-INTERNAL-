"""
profile_evaluator_agent.py

Profile Evaluator Agent — Startup-AYUSH Portal (SIH 2026)
-----------------------------------------------------------
This agent scores the FOUNDER/TEAM portion of a live startup pitch interview.
It does NOT evaluate the startup idea itself — that is handled by a separate
Pitch Evaluator Agent elsewhere in the pipeline.

Inputs:
    1. intake_json  -> only the "team" field is used (founder/team background
                        as originally described in the pitch deck)
    2. interview_transcript -> text transcript of the "tell me about yourself
                        and your team" portion of the live interview

Outputs:
    A single JSON-serializable dict containing:
        - scores (4 parameters, 1-10 each)
        - score_justifications (one sentence per parameter)
        - profile_subtotal (sum of the 4 scores, out of 40)
        - consistency_notes (deck vs. live-interview contradictions/new info)
        - team_gaps (missing skills/roles on the team)

Uses the Gemini API (model: gemini-2.0-flash) for all scoring/reasoning.
Requires GEMINI_API_KEY to be set in the environment (loaded from .env).
"""

import os
import json
import logging
import pathlib
from typing import Dict, List, Any

from dotenv import load_dotenv

try:
    from google import genai
    from google.genai import types as genai_types
except ImportError as e:
    raise ImportError(
        "google-genai package not found. "
        "Install it with: pip install google-genai"
    ) from e

try:
    import requests
except ImportError as e:
    raise ImportError(
        "requests package not found. "
        "Install it with: pip install requests"
    ) from e

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

# MODIFIED (pipeline integration fix): load .env relative to THIS file's
# directory (not the process's current working directory), with override=True,
# matching idea_intake_agent.py's loading pattern.
load_dotenv(dotenv_path=pathlib.Path(__file__).parent / ".env", override=True)

MODEL_NAME = "gemini-2.0-flash"
GROQ_MODEL = "llama-3.3-70b-versatile"

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
)
logger = logging.getLogger("ProfileEvaluatorAgent")


def _get_gemini_client() -> genai.Client:
    """Return an authenticated Gemini client using GEMINI_API_KEY env var."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError("GEMINI_API_KEY environment variable is not set.")
    return genai.Client(api_key=api_key)


def _call_groq_json(prompt: str) -> str:
    """Fallback LLM call using Groq API if Gemini fails."""
    groq_key = os.environ.get("GROQ_API_KEY")
    if not groq_key:
        raise EnvironmentError("GROQ_API_KEY environment variable is not set.")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {groq_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
    }
    resp = requests.post(url, headers=headers, json=payload, timeout=30)
    resp.raise_for_status()
    data = resp.json()
    return data["choices"][0]["message"]["content"]


def _call_gemini_json(prompt: str) -> Any:
    """
    Sends a prompt to Gemini and parses the response as JSON.
    If Gemini fails, falls back to Groq API.

    All prompts used by this agent explicitly instruct Gemini/Groq to return
    ONLY valid JSON (no markdown fences, no preamble). This helper still
    defensively strips common wrapping artifacts (like ```json fences)
    in case the model doesn't perfectly comply, then parses the result.

    Raises:
        ValueError: if the response cannot be parsed as JSON.
        RuntimeError: if both Gemini and Groq API calls fail.
    """
    raw_text = ""
    try:
        client = _get_gemini_client()
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.1,
            ),
        )
        raw_text = (response.text or "").strip()
    except Exception as exc:
        logger.warning("Gemini API call failed (%s). Falling back to Groq API...", exc)
        try:
            raw_text = _call_groq_json(prompt)
        except Exception as groq_exc:
            raise RuntimeError(
                f"Both Gemini and Groq API calls failed. Gemini error: {exc}, Groq error: {groq_exc}"
            ) from groq_exc

    # Defensive cleanup in case the model wraps the JSON in markdown fences
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        cleaned = "\n".join(
            line for line in lines
            if not line.strip().startswith("```")
        ).strip()
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:].strip()

    if cleaned.startswith("{") and cleaned.endswith("]"):
        cleaned = cleaned[:-1] + "}"

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        if cleaned.startswith("{") and "]" in cleaned[-5:]:
            idx = cleaned.rfind("]")
            cleaned = cleaned[:idx] + "}" + cleaned[idx + 1:]
            try:
                return json.loads(cleaned)
            except Exception:
                pass
        raise ValueError(
            f"Model response was not valid JSON. Raw response: {raw_text!r}"
        ) from e




# ---------------------------------------------------------------------------
# Step 1: Score the founder's live self-introduction answers
# ---------------------------------------------------------------------------

def score_profile_answers(transcript: str, team_field_from_intake: str) -> Dict[str, Dict[str, Any]]:
    """
    Scores the founder's live interview answers across 4 parameters
    (each 1-10, with a one-sentence justification):

        - relevant_experience
        - commitment_motivation
        - team_completeness
        - communication_credibility

    Args:
        transcript: Text transcript of the "tell me about yourself and your
                    team" portion of the live interview.
        team_field_from_intake: The "team" field from the Idea Intake Agent's
                                 output, describing the team as stated in the
                                 deck (used as supporting context, not the
                                 primary subject of scoring here).

    Returns:
        A dict of the form:
        {
            "relevant_experience": {"score": 7, "justification": "..."},
            "commitment_motivation": {"score": 8, "justification": "..."},
            "team_completeness": {"score": 6, "justification": "..."},
            "communication_credibility": {"score": 8, "justification": "..."}
        }
    """
    prompt = f"""
You are an expert startup evaluator assessing a founder's LIVE interview
self-introduction (not the startup idea itself). You are evaluating a
startup that may be part of the AYUSH / health-tech sector, but score
relevance against whatever the startup's actual sector appears to be from
context.

DECK TEAM DESCRIPTION (as originally written in the pitch deck):
\"\"\"{team_field_from_intake}\"\"\"

LIVE INTERVIEW TRANSCRIPT (founder/team introduction portion only):
\"\"\"{transcript}\"\"\"

Score the founder's LIVE answers on these 4 parameters, each on a 1-10
integer scale, with exactly ONE sentence of justification per parameter:

1. relevant_experience: How relevant is the founder's/team's background and
   experience to this specific problem/domain?
2. commitment_motivation: How genuine and well-articulated is their reason
   for pursuing this venture, and how committed do they sound (full-time
   vs. side project, how long they've worked on it)?
3. team_completeness: Does the team have the right skill coverage for what
   the startup needs (technical, domain expertise, business)? Consider
   clear gaps if any.
4. communication_credibility: How clearly and credibly did the founder
   present themselves — confidence, clarity, and coherence of their answers?

Return ONLY valid JSON, with no markdown fences and no preamble text, in
exactly this structure:

{{
  "relevant_experience": {{"score": <1-10 integer>, "justification": "<one sentence>"}},
  "commitment_motivation": {{"score": <1-10 integer>, "justification": "<one sentence>"}},
  "team_completeness": {{"score": <1-10 integer>, "justification": "<one sentence>"}},
  "communication_credibility": {{"score": <1-10 integer>, "justification": "<one sentence>"}}
}}
"""
    logger.info("Step 1: Scoring founder profile answers via Gemini...")
    result = _call_gemini_json(prompt)
    logger.info("Step 1: Scoring complete.")
    return result


# ---------------------------------------------------------------------------
# Step 2: Check deck vs. live interview consistency
# ---------------------------------------------------------------------------

def check_team_deck_consistency(transcript: str, team_field_from_intake: str) -> List[str]:
    """
    Compares what was said live about the team/founder background against
    what was written in the deck's team field, flagging contradictions or
    notable new information.

    Args:
        transcript: Live interview transcript (team/profile portion).
        team_field_from_intake: The "team" field from the deck/intake.

    Returns:
        A list of one-sentence consistency_notes strings. Empty list if
        nothing notable is found.
    """
    prompt = f"""
You are comparing a startup founder's LIVE interview statements about their
team against what was written in the pitch deck's team description.

DECK TEAM DESCRIPTION:
\"\"\"{team_field_from_intake}\"\"\"

LIVE INTERVIEW TRANSCRIPT (team/profile portion):
\"\"\"{transcript}\"\"\"

Identify:
- Any contradictions between the deck and what was said live (e.g. the deck
  claims a co-founder with a medical background, but the founder doesn't
  mention them at all live).
- Any notable NEW information mentioned live that wasn't in the deck.

If there is nothing notable, return an empty list.

Return ONLY valid JSON, no markdown fences, no preamble text, in exactly
this structure:

{{
  "consistency_notes": ["<one sentence note>", "..."]
}}
"""
    logger.info("Step 2: Checking deck vs. interview consistency via Gemini...")
    result = _call_gemini_json(prompt)
    notes = result.get("consistency_notes", [])
    logger.info(f"Step 2: Found {len(notes)} consistency note(s).")
    return notes


# ---------------------------------------------------------------------------
# Step 3: Identify team gaps
# ---------------------------------------------------------------------------

def identify_team_gaps(transcript: str, team_field_from_intake: str) -> List[str]:
    """
    Identifies clear skill/role gaps in the team based on what the startup
    needs versus who is actually on the team.

    Args:
        transcript: Live interview transcript (team/profile portion).
        team_field_from_intake: The "team" field from the deck/intake.

    Returns:
        A list of gap description strings (can be empty if the team looks
        well-rounded).
    """
    prompt = f"""
You are assessing whether a startup team has any clear skill or role gaps,
based on the deck's team description and the founder's live interview
answers.

DECK TEAM DESCRIPTION:
\"\"\"{team_field_from_intake}\"\"\"

LIVE INTERVIEW TRANSCRIPT (team/profile portion):
\"\"\"{transcript}\"\"\"

Identify any clear gaps in the team's skill/role coverage relative to what
the startup appears to need (e.g. no technical co-founder for an AI
product, no domain expert for a medical/health product, no business/GTM
person, etc.). If the team looks well-rounded, return an empty list.

Return ONLY valid JSON, no markdown fences, no preamble text, in exactly
this structure:

{{
  "team_gaps": ["<gap description>", "..."]
}}
"""
    logger.info("Step 3: Identifying team gaps via Gemini...")
    result = _call_gemini_json(prompt)
    gaps = result.get("team_gaps", [])
    logger.info(f"Step 3: Found {len(gaps)} team gap(s).")
    return gaps


# ---------------------------------------------------------------------------
# Step 4: Combine everything into the final profile score JSON
# ---------------------------------------------------------------------------

def build_profile_score_json(
    scores: Dict[str, Dict[str, Any]],
    consistency_notes: List[str],
    team_gaps: List[str],
) -> Dict[str, Any]:
    """
    Combines the scoring, consistency, and gap-analysis results into a
    single final JSON-serializable dict.

    Args:
        scores: Output of score_profile_answers().
        consistency_notes: Output of check_team_deck_consistency().
        team_gaps: Output of identify_team_gaps().

    Returns:
        {
            "scores": {"relevant_experience": 7, ...},
            "score_justifications": {"relevant_experience": "...", ...},
            "profile_subtotal": 29,
            "consistency_notes": [...],
            "team_gaps": [...]
        }
    """
    logger.info("Step 4: Building final profile score JSON...")

    parameter_names = [
        "relevant_experience",
        "commitment_motivation",
        "team_completeness",
        "communication_credibility",
    ]

    numeric_scores = {}
    justifications = {}

    for param in parameter_names:
        entry = scores.get(param, {})
        numeric_scores[param] = int(entry.get("score", 0))
        justifications[param] = entry.get("justification", "")

    profile_subtotal = sum(numeric_scores.values())  # out of a possible 40

    final_json = {
        "scores": numeric_scores,
        "score_justifications": justifications,
        "profile_subtotal": profile_subtotal,
        "consistency_notes": consistency_notes,
        "team_gaps": team_gaps,
    }

    logger.info(f"Step 4: Final profile_subtotal = {profile_subtotal}/40.")
    return final_json


# ---------------------------------------------------------------------------
# Step 5: Main orchestrator
# ---------------------------------------------------------------------------

def run_profile_evaluator_agent(transcript: str, intake_json: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main orchestrator for the Profile Evaluator Agent.

    Runs, in sequence:
        1. score_profile_answers   (CRITICAL - failure aborts with error dict)
        2. check_team_deck_consistency (non-critical - skips gracefully)
        3. identify_team_gaps      (non-critical - skips gracefully)
        4. build_profile_score_json (combines results)

    Args:
        transcript: Live interview transcript (team/profile portion only).
        intake_json: Full output of the Idea Intake Agent; only the "team"
                     field is used here.

    Returns:
        The final JSON object from build_profile_score_json(), or an error
        dict if the critical scoring step fails.
    """
    team_field_from_intake = intake_json.get("team", "")

    # --- Step 1: Scoring (CRITICAL) ---
    try:
        scores = score_profile_answers(transcript, team_field_from_intake)
    except Exception as e:
        logger.error(f"CRITICAL FAILURE in score_profile_answers: {e}")
        return {
            "error": "Profile Evaluator Agent failed at the scoring step.",
            "details": str(e),
        }

    # --- Step 2: Consistency check (non-critical) ---
    try:
        consistency_notes = check_team_deck_consistency(transcript, team_field_from_intake)
    except Exception as e:
        logger.error(f"Non-critical failure in check_team_deck_consistency: {e}")
        logger.error("Skipping consistency check; defaulting to empty list.")
        consistency_notes = []

    # --- Step 3: Team gap identification (non-critical) ---
    try:
        team_gaps = identify_team_gaps(transcript, team_field_from_intake)
    except Exception as e:
        logger.error(f"Non-critical failure in identify_team_gaps: {e}")
        logger.error("Skipping team gap identification; defaulting to empty list.")
        team_gaps = []

    # --- Step 4: Combine into final output ---
    try:
        final_result = build_profile_score_json(scores, consistency_notes, team_gaps)
    except Exception as e:
        logger.error(f"CRITICAL FAILURE in build_profile_score_json: {e}")
        return {
            "error": "Profile Evaluator Agent failed while building the final output.",
            "details": str(e),
        }

    logger.info("Profile Evaluator Agent run complete.")
    return final_result


# ---------------------------------------------------------------------------
# Standalone test entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Mock intake_json — as would come from the Idea Intake Agent, only the
    # "team" field is relevant to this agent.
    MOCK_INTAKE_JSON = {
        "team": (
            "Founding team of 2: Ananya Rao (CEO), a final-year B.Tech CSE "
            "student with prior experience building a college health-tracking "
            "app, and Dr. Vikram Singh (Co-founder, Medical Advisor), a BAMS "
            "graduate currently practicing at a government Ayurvedic "
            "dispensary, who consults part-time on product design."
        )
    }

    # Mock interview transcript — realistic 4-5 exchange "tell me about
    # yourself and your team" segment.
    MOCK_TRANSCRIPT = """
Interviewer: Let's start with you — tell me a bit about yourself and what
led you to build this.

Founder (Ananya): Sure! I'm Ananya, final-year Computer Science student.
I built a small health-tracking app for my college health center in my
second year, and that's really where I got interested in health-tech. My
grandmother relies a lot on Ayurvedic remedies, and I noticed how hard it
was for her to find verified information or trustworthy practitioners
online, so that personal experience is really what pushed me to start
this.

Interviewer: And how long have you been working on this, is it full-time?

Founder (Ananya): I've been working on it full-time for about the last
five months, since I graduated early from my final semester requirements.
Before that it was a side project for about two months while I was still
in classes.

Interviewer: Tell me about your team — who else is working with you?

Founder (Ananya): Right now it's mainly me on the product and tech side.
I do have a doctor friend, Dr. Singh, who's been giving me feedback on the
medical accuracy of the content, but he's quite busy with his clinic so
it's more of an informal advisory role right now rather than a full-time
commitment.

Interviewer: The deck mentioned him as a co-founder — is that not
accurate anymore?

Founder (Ananya): Ah, I think that's a bit outdated from an earlier draft.
He's supportive and reviews things when he can, but he hasn't formally
committed as a co-founder yet — we're still figuring that out.

Interviewer: Got it, thanks for clarifying. Anything else on the team side
— any plans to bring on technical or business co-founders?

Founder (Ananya): Yes, I'm actively looking for a technical co-founder
since I'll need to focus more on partnerships and business development as
we grow. I don't have anyone on the business/GTM side yet either — that's
probably our biggest gap right now.
""".strip()

    print("=" * 70)
    print("Running Profile Evaluator Agent (standalone test)")
    print("=" * 70)

    output = run_profile_evaluator_agent(MOCK_TRANSCRIPT, MOCK_INTAKE_JSON)

    print("\nFINAL OUTPUT:")
    print(json.dumps(output, indent=2))
