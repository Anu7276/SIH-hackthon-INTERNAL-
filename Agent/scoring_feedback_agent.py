"""
scoring_feedback_agent.py

Scoring & Feedback Agent — Startup-AYUSH Portal (SIH 2026)
-------------------------------------------------------------
This is the FINAL agent in the pitch evaluation pipeline. It:

    1. Aggregates the outputs of the Pitch Evaluator Agent and the
       Profile Evaluator Agent into a single normalized score out of 30.
    2. Decides routing (investor_visible vs. mentor_routed) based on that
       score.
    3. Generates a founder-facing feedback report (via Gemini) that
       synthesizes strengths, areas to improve, and a summary narrative,
       grounded strictly in the evaluation data.
    4. Combines everything into one final JSON object, preserving the raw
       upstream outputs for full traceability.

Scoring math (normalization + routing) is plain Python — NOT LLM-based —
for consistency and speed. Gemini is used ONLY for the natural-language
feedback report.

Requires GEMINI_API_KEY to be set in the environment (loaded from the same
shared .env used by the other agents in the pipeline).
"""

import os
import json
import logging
import pathlib
from typing import Dict, Any

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
logger = logging.getLogger("ScoringFeedbackAgent")


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

    The prompt used by this agent explicitly instructs Gemini/Groq to return
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
# Weighting constants — adjust here if the rubric weighting changes
# ---------------------------------------------------------------------------

WEIGHT_PITCH = 0.65    # Pitch Evaluator Agent contributes 65% of the 30 marks (19.5 max)
WEIGHT_PROFILE = 0.35  # Profile Evaluator Agent contributes 35% of the 30 marks (10.5 max)

TOTAL_MARKS = 30
PITCH_MAX_RAW = 50     # pitch_subtotal is out of a possible 50
PROFILE_MAX_RAW = 40   # profile_subtotal is out of a possible 40

ROUTING_THRESHOLD = 20  # total_score > 20 -> investor_visible, else mentor_routed


# ---------------------------------------------------------------------------
# Step 1: Normalize pitch + profile subtotals into a weighted /30 score
# ---------------------------------------------------------------------------

def normalize_scores(pitch_score_json: Dict[str, Any], profile_score_json: Dict[str, Any]) -> Dict[str, float]:
    """
    Normalizes the raw pitch_subtotal (out of 50) and profile_subtotal
    (out of 40) into a weighted total out of 30, using a 65/35 weighting
    between pitch and profile respectively.

    Formula:
        pitch_component   = (pitch_subtotal / 50) * 19.5
        profile_component = (profile_subtotal / 40) * 10.5
        total_score        = round(pitch_component + profile_component, 1)

    Args:
        pitch_score_json: Output of the Pitch Evaluator Agent, must contain
                           "pitch_subtotal".
        profile_score_json: Output of the Profile Evaluator Agent, must
                             contain "profile_subtotal".

    Returns:
        {"pitch_component": float, "profile_component": float, "total_score": float}
    """
    pitch_subtotal = pitch_score_json.get("pitch_subtotal", 0)
    profile_subtotal = profile_score_json.get("profile_subtotal", 0)

    pitch_max_component = TOTAL_MARKS * WEIGHT_PITCH      # 19.5
    profile_max_component = TOTAL_MARKS * WEIGHT_PROFILE  # 10.5

    pitch_component = (pitch_subtotal / PITCH_MAX_RAW) * pitch_max_component
    profile_component = (profile_subtotal / PROFILE_MAX_RAW) * profile_max_component

    total_score = round(pitch_component + profile_component, 1)

    logger.info(
        f"Step 1: Normalized scores -> pitch_component={round(pitch_component, 2)}, "
        f"profile_component={round(profile_component, 2)}, total_score={total_score}"
    )

    return {
        "pitch_component": round(pitch_component, 1),
        "profile_component": round(profile_component, 1),
        "total_score": total_score,
    }


# ---------------------------------------------------------------------------
# Step 2: Determine routing based on total score
# ---------------------------------------------------------------------------

def determine_routing(total_score: float) -> Dict[str, Any]:
    """
    Determines routing based on the total normalized score.

    Rule:
        total_score > 20  -> "investor_visible"
        total_score <= 20 -> "mentor_routed"

    Args:
        total_score: The normalized total score out of 30.

    Returns:
        {"routing": "investor_visible" | "mentor_routed", "threshold_used": 20}
    """
    routing = "investor_visible" if total_score > ROUTING_THRESHOLD else "mentor_routed"

    logger.info(f"Step 2: Routing decision -> {routing} (total_score={total_score}, threshold={ROUTING_THRESHOLD})")

    return {
        "routing": routing,
        "threshold_used": ROUTING_THRESHOLD,
    }


# ---------------------------------------------------------------------------
# Step 3: Generate founder-facing feedback report (Gemini)
# ---------------------------------------------------------------------------

def generate_feedback_report(
    pitch_score_json: Dict[str, Any],
    profile_score_json: Dict[str, Any],
    total_score: float,
    routing: str,
) -> Dict[str, Any]:
    """
    Uses Gemini to generate a founder-facing feedback report in plain,
    encouraging but honest language, grounded strictly in the evaluation
    data from both upstream agents.

    Args:
        pitch_score_json: Output of the Pitch Evaluator Agent.
        profile_score_json: Output of the Profile Evaluator Agent.
        total_score: The normalized total score out of 30.
        routing: The routing decision string ("investor_visible" or "mentor_routed").

    Returns:
        {
            "strengths": ["...", "...", "..."],
            "areas_to_improve": ["...", "...", "..."],
            "summary_paragraph": "..."
        }
    """
    # Gather all relevant evidence from both upstream agents
    pitch_justifications = pitch_score_json.get("score_justifications", {})
    pitch_consistency_flags = pitch_score_json.get("consistency_flags", [])
    gap_coverage_notes = pitch_score_json.get("gap_coverage_notes", {})
    competitor_awareness_note = pitch_score_json.get("competitor_awareness_note")

    profile_justifications = profile_score_json.get("score_justifications", {})
    profile_consistency_notes = profile_score_json.get("consistency_notes", [])
    team_gaps = profile_score_json.get("team_gaps", [])

    evidence_bundle = {
        "total_score": total_score,
        "max_score": TOTAL_MARKS,
        "routing": routing,
        "pitch_score_justifications": pitch_justifications,
        "pitch_consistency_flags": pitch_consistency_flags,
        "gap_coverage_notes": gap_coverage_notes,
        "competitor_awareness_note": competitor_awareness_note,
        "profile_score_justifications": profile_justifications,
        "profile_consistency_notes": profile_consistency_notes,
        "team_gaps": team_gaps,
    }

    prompt = f"""
You are writing a founder-facing feedback report for a startup pitch
evaluation (Startup-AYUSH Portal, SIH 2026). The founder will read this
directly, so use plain, encouraging but honest language — not just raw
scores.

Base every point strictly on the evaluation data provided below — do not
invent praise or criticism not supported by the scores, flags, or notes
given. Be honest and specific, not generic.

EVALUATION DATA:
{json.dumps(evidence_bundle, indent=2)}

Using ONLY the data above, produce:
- "strengths": 2-3 bullet points, specific and evidence-based (reference
  what actually scored well or was praised in the justifications/notes).
- "areas_to_improve": 2-3 bullet points, specific and evidence-based
  (reference actual low scores, consistency flags/notes, gaps, or
  competitor awareness issues from the data above).
- "summary_paragraph": a 3-4 sentence overall narrative summary tying the
  strengths and areas to improve together, in an encouraging but honest
  tone.

Return ONLY valid JSON, no markdown fences, no preamble text, in exactly
this structure:

{{
  "strengths": ["<point 1>", "<point 2>"],
  "areas_to_improve": ["<point 1>", "<point 2>"],
  "summary_paragraph": "<3-4 sentence paragraph>"
}}
"""
    logger.info("Step 3: Generating feedback report via Gemini...")
    result = _call_gemini_json(prompt)
    logger.info("Step 3: Feedback report generated.")
    return result


def _fallback_feedback_report(
    pitch_score_json: Dict[str, Any],
    profile_score_json: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Builds a simple, non-LLM fallback feedback report directly from the
    justifications and notes already present in the upstream JSON outputs.
    Used when generate_feedback_report() fails, so the pipeline doesn't
    break entirely.

    This is intentionally conservative: it surfaces the highest and lowest
    scoring parameters as strengths/areas to improve, plus any raw
    consistency/gap notes, without any LLM-generated prose beyond simple
    string templates.

    Args:
        pitch_score_json: Output of the Pitch Evaluator Agent.
        profile_score_json: Output of the Profile Evaluator Agent.

    Returns:
        Same shape as generate_feedback_report()'s return value.
    """
    logger.info("Step 3 (fallback): Building feedback report from raw data without Gemini...")

    all_scores = {}
    all_justifications = {}

    for prefix, source in (("Pitch", pitch_score_json), ("Profile", profile_score_json)):
        scores = source.get("scores", {})
        justifications = source.get("score_justifications", {})
        for param, value in scores.items():
            key = f"{prefix}: {param}"
            all_scores[key] = value
            all_justifications[key] = justifications.get(param, "")

    strengths = []
    areas_to_improve = []

    if all_scores:
        sorted_params = sorted(all_scores.items(), key=lambda kv: kv[1], reverse=True)
        top_params = sorted_params[:2]
        bottom_params = sorted_params[-2:]

        for param, score in top_params:
            justification = all_justifications.get(param, "")
            strengths.append(f"{param} scored strongly ({score}/10): {justification}".strip())

        for param, score in bottom_params:
            justification = all_justifications.get(param, "")
            areas_to_improve.append(f"{param} scored lower ({score}/10): {justification}".strip())

    # Fold in raw flags/notes/gaps as additional areas to improve, if any
    for note in pitch_score_json.get("consistency_flags", []):
        areas_to_improve.append(f"Pitch consistency flag: {note}")
    for note in profile_score_json.get("consistency_notes", []):
        areas_to_improve.append(f"Profile consistency note: {note}")
    for gap in profile_score_json.get("team_gaps", []):
        areas_to_improve.append(f"Team gap: {gap}")

    summary_paragraph = (
        "This is an auto-generated summary based on the raw evaluation scores, "
        "since the AI-generated narrative feedback could not be produced. "
        "Please review the strengths and areas to improve above, along with the "
        "full raw evaluator outputs, for complete context on this evaluation."
    )

    return {
        "strengths": strengths,
        "areas_to_improve": areas_to_improve,
        "summary_paragraph": summary_paragraph,
    }


# ---------------------------------------------------------------------------
# Step 4: Build the final combined output JSON
# ---------------------------------------------------------------------------

def build_final_output_json(
    normalized_scores: Dict[str, float],
    routing_info: Dict[str, Any],
    feedback_report: Dict[str, Any],
    pitch_score_json: Dict[str, Any],
    profile_score_json: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Combines the normalized scores, routing decision, feedback report, and
    raw upstream outputs into one final JSON-serializable dict.

    Args:
        normalized_scores: Output of normalize_scores().
        routing_info: Output of determine_routing().
        feedback_report: Output of generate_feedback_report() (or its
                          fallback).
        pitch_score_json: Raw output of the Pitch Evaluator Agent.
        profile_score_json: Raw output of the Profile Evaluator Agent.

    Returns:
        {
            "total_score": 24.3,
            "max_score": 30,
            "score_breakdown": {"pitch_component": 15.2, "profile_component": 9.1},
            "routing": "investor_visible",
            "feedback": {"strengths": [...], "areas_to_improve": [...], "summary_paragraph": "..."},
            "raw_evaluator_outputs": {"pitch": {...}, "profile": {...}}
        }
    """
    logger.info("Step 4: Building final combined output JSON...")

    final_json = {
        "total_score": normalized_scores["total_score"],
        "max_score": TOTAL_MARKS,
        "score_breakdown": {
            "pitch_component": normalized_scores["pitch_component"],
            "profile_component": normalized_scores["profile_component"],
        },
        "routing": routing_info["routing"],
        "feedback": feedback_report,
        "raw_evaluator_outputs": {
            "pitch": pitch_score_json,
            "profile": profile_score_json,
        },
    }

    logger.info("Step 4: Final output JSON built successfully.")
    return final_json


# ---------------------------------------------------------------------------
# Step 5: Main orchestrator
# ---------------------------------------------------------------------------

def run_scoring_feedback_agent(
    pitch_score_json: Dict[str, Any],
    profile_score_json: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Main orchestrator for the Scoring & Feedback Agent.

    Runs, in sequence:
        1. normalize_scores       (critical - pure math)
        2. determine_routing      (critical - pure math)
        3. generate_feedback_report (important - falls back to a simple
           auto-generated report if Gemini fails, rather than failing the
           whole pipeline)
        4. build_final_output_json (combines everything)

    Args:
        pitch_score_json: Output of the Pitch Evaluator Agent.
        profile_score_json: Output of the Profile Evaluator Agent.

    Returns:
        The final JSON object from build_final_output_json(), or an error
        dict if a critical (math) step fails unexpectedly.
    """
    # --- Step 1: Normalize scores (CRITICAL) ---
    try:
        normalized_scores = normalize_scores(pitch_score_json, profile_score_json)
    except Exception as e:
        logger.error(f"CRITICAL FAILURE in normalize_scores: {e}")
        return {
            "error": "Scoring & Feedback Agent failed at the normalization step.",
            "details": str(e),
        }

    # --- Step 2: Determine routing (CRITICAL) ---
    try:
        routing_info = determine_routing(normalized_scores["total_score"])
    except Exception as e:
        logger.error(f"CRITICAL FAILURE in determine_routing: {e}")
        return {
            "error": "Scoring & Feedback Agent failed at the routing step.",
            "details": str(e),
        }

    # --- Step 3: Generate feedback report (important, non-fatal) ---
    try:
        feedback_report = generate_feedback_report(
            pitch_score_json,
            profile_score_json,
            normalized_scores["total_score"],
            routing_info["routing"],
        )
    except Exception as e:
        logger.error(f"Non-critical failure in generate_feedback_report: {e}")
        logger.error("Falling back to auto-generated feedback report without Gemini.")
        feedback_report = _fallback_feedback_report(pitch_score_json, profile_score_json)

    # --- Step 4: Combine into final output (CRITICAL) ---
    try:
        final_result = build_final_output_json(
            normalized_scores,
            routing_info,
            feedback_report,
            pitch_score_json,
            profile_score_json,
        )
    except Exception as e:
        logger.error(f"CRITICAL FAILURE in build_final_output_json: {e}")
        return {
            "error": "Scoring & Feedback Agent failed while building the final output.",
            "details": str(e),
        }

    logger.info("Scoring & Feedback Agent run complete.")
    return final_result


# ---------------------------------------------------------------------------
# Standalone test entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # -----------------------------------------------------------------
    # Mock Run A: lands ABOVE the 20 threshold -> "investor_visible"
    #   pitch_subtotal=40/50, profile_subtotal=30/40
    #   pitch_component = (40/50)*19.5 = 15.6
    #   profile_component = (30/40)*10.5 = 7.875
    #   total_score ~= 23.5 (> 20 -> investor_visible)
    # -----------------------------------------------------------------
    MOCK_PITCH_ABOVE = {
        "scores": {
            "problem_solution_clarity": 9,
            "market_sizing": 7,
            "differentiation": 8,
            "revenue_model": 8,
            "feasibility": 8,
        },
        "score_justifications": {
            "problem_solution_clarity": "The problem and solution were articulated with clear, specific evidence of user pain points.",
            "market_sizing": "Market sizing was reasonably estimated but relied on a broad top-down figure rather than bottom-up validation.",
            "differentiation": "The product's Ayurvedic-verification angle is clearly differentiated from generic health apps.",
            "revenue_model": "The freemium-to-subscription model is realistic and was explained with concrete pricing tiers.",
            "feasibility": "The team demonstrated a credible technical plan and a working prototype was already shown.",
        },
        "pitch_subtotal": 40,
        "consistency_flags": [],
        "gap_coverage_notes": {
            "market_sizing": {
                "was_clarified": True,
                "note": "Founder clarified the target market size with a more specific regional estimate when asked live.",
            }
        },
        "competitor_awareness_note": "Founder was aware of 2 direct competitors and articulated a clear differentiation strategy.",
    }

    MOCK_PROFILE_ABOVE = {
        "scores": {
            "relevant_experience": 8,
            "commitment_motivation": 8,
            "team_completeness": 7,
            "communication_credibility": 7,
        },
        "score_justifications": {
            "relevant_experience": "Founder's prior health-tracking app experience is directly relevant to this domain.",
            "commitment_motivation": "Founder has worked on this full-time for 5 months and gave a clear, personal motivation.",
            "team_completeness": "Team has technical and informal medical advisory coverage, though no dedicated business co-founder yet.",
            "communication_credibility": "Founder communicated clearly and confidently, with coherent and specific answers.",
        },
        "profile_subtotal": 30,
        "consistency_notes": [
            "Deck listed the doctor as a co-founder, but the founder clarified live that he is only an informal advisor.",
        ],
        "team_gaps": [
            "No dedicated technical co-founder as the startup scales.",
            "No business/GTM lead currently on the team.",
        ],
    }

    # -----------------------------------------------------------------
    # Mock Run B: lands BELOW/AT the 20 threshold -> "mentor_routed"
    #   pitch_subtotal=25/50, profile_subtotal=20/40
    #   pitch_component = (25/50)*19.5 = 9.75
    #   profile_component = (20/40)*10.5 = 5.25
    #   total_score = 15.0 (<= 20 -> mentor_routed)
    # -----------------------------------------------------------------
    MOCK_PITCH_BELOW = {
        "scores": {
            "problem_solution_clarity": 5,
            "market_sizing": 4,
            "differentiation": 5,
            "revenue_model": 5,
            "feasibility": 6,
        },
        "score_justifications": {
            "problem_solution_clarity": "The problem was described in general terms without strong evidence of validated user pain points.",
            "market_sizing": "Market sizing figures were vague and not clearly sourced or justified.",
            "differentiation": "Differentiation from existing Ayurvedic content apps was not clearly articulated.",
            "revenue_model": "Revenue model was mentioned only briefly with no concrete pricing details.",
            "feasibility": "The technical plan is plausible but still early-stage with no working prototype yet.",
        },
        "pitch_subtotal": 25,
        "consistency_flags": [
            "Deck claimed partnerships with 3 Ayurvedic clinics, but founder could not name any specific clinic when asked live.",
        ],
        "gap_coverage_notes": {
            "market_sizing": {
                "was_clarified": False,
                "note": "Founder was unable to provide a clearer market sizing estimate when pressed live.",
            }
        },
        "competitor_awareness_note": "Founder was not able to name any direct competitors when asked.",
    }

    MOCK_PROFILE_BELOW = {
        "scores": {
            "relevant_experience": 5,
            "commitment_motivation": 6,
            "team_completeness": 4,
            "communication_credibility": 5,
        },
        "score_justifications": {
            "relevant_experience": "Founder's background is only loosely related to the health-tech domain.",
            "commitment_motivation": "Founder described this as a part-time effort alongside a full-time job, with a somewhat unclear long-term commitment.",
            "team_completeness": "Team currently consists of only the founder, with no technical or domain-expert co-founder.",
            "communication_credibility": "Answers were somewhat unclear and lacked specific detail in several areas.",
        },
        "profile_subtotal": 20,
        "consistency_notes": [],
        "team_gaps": [
            "No technical co-founder.",
            "No domain/medical expert on the team.",
            "No business/GTM lead.",
        ],
    }

    print("=" * 70)
    print("MOCK RUN A: Expected routing = investor_visible (total_score > 20)")
    print("=" * 70)
    result_above = run_scoring_feedback_agent(MOCK_PITCH_ABOVE, MOCK_PROFILE_ABOVE)
    print("\nFINAL OUTPUT (Run A):")
    print(json.dumps(result_above, indent=2))

    print("\n" + "=" * 70)
    print("MOCK RUN B: Expected routing = mentor_routed (total_score <= 20)")
    print("=" * 70)
    result_below = run_scoring_feedback_agent(MOCK_PITCH_BELOW, MOCK_PROFILE_BELOW)
    print("\nFINAL OUTPUT (Run B):")
    print(json.dumps(result_below, indent=2))
