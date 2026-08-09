"""
Pitch Evaluator Agent
======================
Part of the SIH 2026 Startup-AYUSH Portal.

This agent scores the idea/pitch-related portion of a founder's live
interview, cross-checked against their original pitch deck intake data
(produced by the earlier "Idea Intake Agent") and any competitor research
already gathered.

It does NOT score founder/team-profile answers — that is handled by a
separate Profile Evaluator Agent.

Pipeline:
    1. score_idea_answers            -> 5-parameter scoring (1-10 each)
    2. check_consistency             -> deck vs live-answer contradictions
    3. check_gap_coverage            -> were previously vague fields clarified?
    4. check_competitor_awareness    -> did founder handle competitor Qs well?
    5. build_pitch_score_json        -> combine everything into final JSON
    6. run_pitch_evaluator_agent     -> orchestrator, called by other agents

Environment:
    GEMINI_API_KEY must be set (reuses the .env already used by the
    Idea Intake Agent).

Model:
    gemini-2.0-flash
"""

import os
import json
import logging
import pathlib
from typing import Any, Dict, List, Optional

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

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s",
)
logger = logging.getLogger("pitch_evaluator_agent")

MODEL_NAME = "gemini-2.0-flash"
GROQ_MODEL = "llama-3.3-70b-versatile"


def _get_gemini_client() -> genai.Client:
    """Return an authenticated Gemini client using GEMINI_API_KEY env var."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GEMINI_API_KEY environment variable is not set. "
            "Export it before running: export GEMINI_API_KEY='your-key'"
        )
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


# ---------------------------------------------------------------------------
# Low-level Gemini call helper with Groq fallback
# ---------------------------------------------------------------------------

def _call_gemini_json(prompt: str) -> Dict[str, Any]:
    """
    Sends a prompt to Gemini and parses the response as JSON.
    If Gemini fails, falls back to Groq API.

    All prompts used by this agent explicitly instruct Gemini/Groq to return
    ONLY valid JSON (no markdown fences, no preamble). This helper still
    defensively strips common wrapper artifacts (```json fences, stray
    whitespace) before parsing, in case the model doesn't comply perfectly.

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

    # Defensive cleanup in case the model wraps output in markdown fences.
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
    except json.JSONDecodeError as exc:
        if cleaned.startswith("{") and "]" in cleaned[-5:]:
            idx = cleaned.rfind("]")
            cleaned = cleaned[:idx] + "}" + cleaned[idx + 1:]
            try:
                return json.loads(cleaned)
            except Exception:
                pass
        raise ValueError(
            f"Model did not return valid JSON. Raw response:\n{raw_text}"
        ) from exc




# ---------------------------------------------------------------------------
# 1. score_idea_answers
# ---------------------------------------------------------------------------

def score_idea_answers(transcript: str, intake_json: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """
    Scores the founder's live idea-related interview answers across 5
    parameters, each 1-10, each with a one-sentence justification.

    Parameters scored:
        - problem_solution_clarity
        - market_sizing
        - differentiation
        - revenue_model
        - feasibility

    Returns:
        {
          "problem_solution_clarity": {"score": 8, "justification": "..."},
          "market_sizing": {"score": 5, "justification": "..."},
          ...
        }
    """
    prompt = f"""
You are an expert startup pitch evaluator for an AYUSH (Ayurveda, Yoga,
Unani, Siddha, Homeopathy) health-tech startup accelerator.

You are given:
1. The founder's ORIGINAL PITCH DECK DATA (structured intake).
2. A TRANSCRIPT of the founder's LIVE interview answers about their idea.

Score the founder's LIVE ANSWERS (not the deck) on these 5 parameters,
each on a 1-10 integer scale, with exactly one sentence of justification
per parameter:

- problem_solution_clarity: how clearly and convincingly they explained the
  problem and solution live (not just repeating the deck).
- market_sizing: how specific and realistic their market sizing was when
  asked live.
- differentiation: how convincingly they explained what makes them
  different, especially versus any similar existing products listed below.
- revenue_model: how clear and realistic their monetization explanation was.
- feasibility: how executable the idea seems based on their answers (team
  capability, plan, realism).

ORIGINAL PITCH DECK DATA (JSON):
{json.dumps(intake_json, indent=2)}

LIVE INTERVIEW TRANSCRIPT:
{transcript}

Return ONLY valid JSON in exactly this shape, no markdown fences, no
preamble text, no extra keys:
{{
  "problem_solution_clarity": {{"score": <int 1-10>, "justification": "<one sentence>"}},
  "market_sizing": {{"score": <int 1-10>, "justification": "<one sentence>"}},
  "differentiation": {{"score": <int 1-10>, "justification": "<one sentence>"}},
  "revenue_model": {{"score": <int 1-10>, "justification": "<one sentence>"}},
  "feasibility": {{"score": <int 1-10>, "justification": "<one sentence>"}}
}}
"""
    logger.info("Calling Gemini: score_idea_answers")
    result = _call_gemini_json(prompt)
    logger.info("score_idea_answers completed")
    return result


# ---------------------------------------------------------------------------
# 2. check_consistency
# ---------------------------------------------------------------------------

def check_consistency(transcript: str, intake_json: Dict[str, Any]) -> List[str]:
    """
    Compares claims made live against the original intake_json fields
    (problem, solution, target_market, revenue_model, traction, ask) and
    flags contradictions or notable discrepancies.

    Returns:
        A list of one-sentence discrepancy descriptions. Empty list if none.
    """
    fields_to_check = {
        "problem": intake_json.get("problem"),
        "solution": intake_json.get("solution"),
        "target_market": intake_json.get("target_market"),
        "revenue_model": intake_json.get("revenue_model"),
        "traction": intake_json.get("traction"),
        "ask": intake_json.get("ask"),
    }

    prompt = f"""
You are checking a founder's live interview answers for consistency against
their original pitch deck data.

ORIGINAL PITCH DECK FIELDS (JSON):
{json.dumps(fields_to_check, indent=2)}

LIVE INTERVIEW TRANSCRIPT:
{transcript}

Identify any contradictions or notable discrepancies between what the deck
says and what the founder said live (e.g. deck says one target market,
founder describes a different one live; numbers that don't match; claims
that conflict).

Return ONLY valid JSON in exactly this shape, no markdown fences, no
preamble text:
{{
  "consistency_flags": ["<one sentence per discrepancy>", "..."]
}}
If there are no discrepancies, return {{"consistency_flags": []}}.
"""
    logger.info("Calling Gemini: check_consistency")
    result = _call_gemini_json(prompt)
    flags = result.get("consistency_flags", [])
    logger.info(f"check_consistency completed with {len(flags)} flag(s)")
    return flags


# ---------------------------------------------------------------------------
# 3. check_gap_coverage
# ---------------------------------------------------------------------------

def check_gap_coverage(
    transcript: str, missing_or_vague_fields: List[str]
) -> Dict[str, Dict[str, Any]]:
    """
    For each field name previously flagged as missing/vague in the intake
    data, checks whether the founder clarified it with specifics live, or
    left it vague even when asked directly.

    Returns:
        {
          "traction": {"was_clarified": false, "note": "one sentence"},
          ...
        }
        Only includes fields that were present in missing_or_vague_fields.
        Empty dict if missing_or_vague_fields is empty.
    """
    if not missing_or_vague_fields:
        logger.info("check_gap_coverage skipped: no missing_or_vague_fields")
        return {}

    prompt = f"""
You are checking whether a founder clarified previously vague/missing pitch
details during their live interview.

FIELDS THAT WERE MISSING OR VAGUE IN THE ORIGINAL DECK:
{json.dumps(missing_or_vague_fields, indent=2)}

LIVE INTERVIEW TRANSCRIPT:
{transcript}

For each field listed above, determine whether the founder actually
clarified it with specifics during the live interview, or left it still
vague even when asked directly.

Return ONLY valid JSON in exactly this shape, no markdown fences, no
preamble text (include every field from the list above as a key):
{{
  "<field_name>": {{"was_clarified": true/false, "note": "<one sentence>"}},
  ...
}}
"""
    logger.info("Calling Gemini: check_gap_coverage")
    result = _call_gemini_json(prompt)
    logger.info(f"check_gap_coverage completed for {len(result)} field(s)")
    return result


# ---------------------------------------------------------------------------
# 4. check_competitor_awareness
# ---------------------------------------------------------------------------

def check_competitor_awareness(
    transcript: str, similar_existing_products: List[Dict[str, str]]
) -> Optional[Dict[str, Any]]:
    """
    Checks whether the founder acknowledged/addressed known competitors
    when asked, and how convincingly they differentiated themselves.

    Returns:
        {"acknowledged": true/false, "note": "one sentence"}
        or None if similar_existing_products is empty.
    """
    if not similar_existing_products:
        logger.info("check_competitor_awareness skipped: no similar_existing_products")
        return None

    prompt = f"""
You are checking whether a founder handled a competitor question well
during their live pitch interview.

KNOWN SIMILAR/COMPETING PRODUCTS (JSON):
{json.dumps(similar_existing_products, indent=2)}

LIVE INTERVIEW TRANSCRIPT:
{transcript}

Determine whether the founder acknowledged/addressed these competitors when
asked, and how convincingly they differentiated their idea from them.

Return ONLY valid JSON in exactly this shape, no markdown fences, no
preamble text:
{{
  "acknowledged": true/false,
  "note": "<one sentence summary of how well they handled the competitor question>"
}}
"""
    logger.info("Calling Gemini: check_competitor_awareness")
    result = _call_gemini_json(prompt)
    logger.info("check_competitor_awareness completed")
    return result


# ---------------------------------------------------------------------------
# 5. build_pitch_score_json
# ---------------------------------------------------------------------------

def build_pitch_score_json(
    scores: Dict[str, Dict[str, Any]],
    consistency_flags: List[str],
    gap_coverage: Dict[str, Dict[str, Any]],
    competitor_awareness: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Combines the outputs of steps 1-4 into the final pitch evaluation JSON.

    pitch_subtotal is the raw sum of the 5 parameter scores (out of a
    possible 50). It is NOT normalized here — a separate Scoring &
    Feedback Agent later normalizes/weights it into the larger 30-mark
    rubric.

    Returns:
        The final combined JSON object (see module docstring for shape).
    """
    score_values = {k: v.get("score") for k, v in scores.items()}
    justifications = {k: v.get("justification") for k, v in scores.items()}

    # sum only numeric scores that were actually returned
    pitch_subtotal = sum(v for v in score_values.values() if isinstance(v, (int, float)))

    final_json = {
        "scores": score_values,
        "score_justifications": justifications,
        "pitch_subtotal": pitch_subtotal,
        "consistency_flags": consistency_flags,
        "gap_coverage_notes": gap_coverage,
        "competitor_awareness_note": (
            competitor_awareness.get("note") if competitor_awareness else None
        ),
    }

    logger.info("build_pitch_score_json completed")
    return final_json


# ---------------------------------------------------------------------------
# 6. run_pitch_evaluator_agent (main orchestrator)
# ---------------------------------------------------------------------------

def run_pitch_evaluator_agent(
    transcript: str, intake_json: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Main orchestrator for the Pitch Evaluator Agent.

    Calls score_idea_answers -> check_consistency -> check_gap_coverage ->
    check_competitor_awareness -> build_pitch_score_json in sequence.

    - Scoring and consistency checks are CRITICAL: if either fails, this
      function returns an error dict immediately.
    - Gap coverage and competitor awareness are NON-CRITICAL: if they fail
      or have no applicable input, they are skipped gracefully (set to
      null/empty in the final output).

    Returns:
        The final pitch score JSON (see build_pitch_score_json), or an
        error dict of the form {"error": "..."} on critical failure.
    """
    logger.info("=== Starting Pitch Evaluator Agent run ===")

    # --- Step 1: score_idea_answers (CRITICAL) ---
    try:
        scores = score_idea_answers(transcript, intake_json)
    except Exception as exc:
        logger.error(f"CRITICAL FAILURE in score_idea_answers: {exc}")
        return {"error": f"Failed to score idea answers: {exc}"}

    # --- Step 2: check_consistency (CRITICAL) ---
    try:
        consistency_flags = check_consistency(transcript, intake_json)
    except Exception as exc:
        logger.error(f"CRITICAL FAILURE in check_consistency: {exc}")
        return {"error": f"Failed to check consistency: {exc}"}

    # --- Step 3: check_gap_coverage (NON-CRITICAL) ---
    try:
        gap_coverage = check_gap_coverage(
            transcript, intake_json.get("missing_or_vague_fields", [])
        )
    except Exception as exc:
        logger.warning(f"Non-critical failure in check_gap_coverage, skipping: {exc}")
        gap_coverage = {}

    # --- Step 4: check_competitor_awareness (NON-CRITICAL) ---
    try:
        competitor_awareness = check_competitor_awareness(
            transcript, intake_json.get("similar_existing_products", [])
        )
    except Exception as exc:
        logger.warning(
            f"Non-critical failure in check_competitor_awareness, skipping: {exc}"
        )
        competitor_awareness = None

    # --- Step 5: combine everything ---
    final_result = build_pitch_score_json(
        scores, consistency_flags, gap_coverage, competitor_awareness
    )

    logger.info("=== Pitch Evaluator Agent run complete ===")
    return final_result


# ---------------------------------------------------------------------------
# __main__ — standalone test with mock data
# ---------------------------------------------------------------------------

if __name__ == "__main__":

    MOCK_INTAKE_JSON = {
        "problem": (
            "Patients seeking authentic Ayurvedic treatment struggle to find "
            "verified practitioners and often rely on unregulated online "
            "sources for herbal remedies."
        ),
        "solution": (
            "A mobile platform connecting patients with verified AYUSH "
            "practitioners for teleconsultations, plus a curated marketplace "
            "for certified herbal products."
        ),
        "target_market": "Urban Indian consumers aged 25-55 interested in wellness and Ayurveda",
        "revenue_model": "Commission on teleconsultation bookings and marketplace sales",
        "traction": "500 signups in a 2-month beta, no revenue yet",
        "team": "2 co-founders, one with a BAMS degree, one with a tech background",
        "differentiation": "All practitioners are government-license verified before onboarding",
        "ask": "₹50 lakh seed funding for a 15% equity stake",
        "missing_or_vague_fields": ["traction", "revenue_model"],
        "raw_summary": (
            "AYUSH-focused telehealth and marketplace startup aiming to "
            "connect verified practitioners with patients."
        ),
        "similar_existing_products": [
            {
                "name": "PractoAyurveda",
                "description": "A vertical within Practo offering Ayurvedic doctor consultations.",
                "how_it_differs_from_founder_idea": (
                    "PractoAyurveda lacks a curated herbal product marketplace "
                    "and doesn't focus exclusively on AYUSH verification."
                ),
            }
        ],
        "market_check_status": "found_similar",
    }

    MOCK_TRANSCRIPT = """
Interviewer: Walk me through the core problem you're solving.
Founder: Sure. Right now, if someone in a city wants real Ayurvedic care,
they either go to a random clinic with no way to check credentials, or they
buy herbal supplements off Instagram ads that might not even be safe. We
verify every practitioner's AYUSH license before they go live on our
platform, so patients know they're getting someone qualified.

Interviewer: How big do you think this market actually is?
Founder: Honestly, we haven't nailed the exact TAM yet — we've seen reports
suggesting the Ayurveda market in India is worth a few billion dollars, but
I don't have a precise breakdown by our specific segment of urban
teleconsultation users. We're still refining that number.

Interviewer: You mentioned traction earlier — can you give me real numbers?
Founder: Yes — we're at 500 signups from our beta, and about 60% of those
users have booked at least one consultation. We haven't converted that into
paid revenue yet since we were focused on validating demand first, but
we're planning to turn on commission-based billing next month.

Interviewer: How do you actually make money?
Founder: We take a 15% commission on every consultation booking, and we're
also planning a smaller commission, maybe 8-10%, on herbal product sales
through our marketplace once that launches.

Interviewer: There's a service called PractoAyurveda that seems similar.
How are you different?
Founder: We know Practo well — their Ayurveda offering is more of an add-on
to their general doctor booking platform. We're AYUSH-only, so our whole
verification pipeline, practitioner vetting, and product marketplace is
built specifically around Ayurveda, Yoga, Unani, Siddha and Homeopathy,
not bolted onto a generic telehealth app.

Interviewer: How feasible is it for your team to execute this in the next
12 months?
Founder: My co-founder has a BAMS degree and deep connections in the AYUSH
practitioner community, which is how we got our first 500 users so
quickly. I handle the tech side. We think we can scale verified
practitioner onboarding city by city, starting with 3 metros in year one.
""".strip()

    print("\n--- Running Pitch Evaluator Agent (mock data) ---\n")
    result = run_pitch_evaluator_agent(MOCK_TRANSCRIPT, MOCK_INTAKE_JSON)
    print(json.dumps(result, indent=2))
