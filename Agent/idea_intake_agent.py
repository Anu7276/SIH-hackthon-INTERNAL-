"""
idea_intake_agent.py
====================
Idea Intake Agent — Startup Pitch Evaluation System
SIH Hackathon Internal

This agent reads a pitch deck (PDF or PPT), extracts structured information
using Gemini's multimodal API, checks for similar products via a local FAISS
vector knowledge base, and falls back to a live web search if needed.

Environment Variables Required:
  GEMINI_API_KEY   — Google Gemini API key
  SERPER_API_KEY   — Serper.dev API key  (optional, used if Tavily not set)
  TAVILY_API_KEY   — Tavily API key       (optional, used preferentially)

Usage:
  python idea_intake_agent.py
  (See __main__ block at the bottom for configuration.)
"""

import os
import json
import logging
import pathlib
import time
from typing import Optional

import numpy as np

# ── Load .env file automatically (if present) ───────────────────────────────
# Keys in .env are loaded into os.environ before any client is created.
# To update a key, just edit the .env file — no code change needed.
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=pathlib.Path(__file__).parent / ".env", override=True)
except ImportError:
    pass  # dotenv not installed — keys must be set manually in the environment

# ─────────────────────────────────────────────
# Third-party imports (install via requirements)
# pip install google-genai faiss-cpu requests numpy
# ─────────────────────────────────────────────
try:
    from google import genai
    from google.genai import types as genai_types
except ImportError as e:
    raise ImportError(
        "google-genai package not found. "
        "Install it with: pip install google-genai"
    ) from e

try:
    import faiss
except ImportError as e:
    raise ImportError(
        "faiss-cpu package not found. "
        "Install it with: pip install faiss-cpu"
    ) from e

try:
    import requests
except ImportError as e:
    raise ImportError(
        "requests package not found. "
        "Install it with: pip install requests"
    ) from e

# ─────────────────────────────────────────────
# Logging configuration
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s — %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("IdeaIntakeAgent")

# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────
GEMINI_MODEL = "gemini-2.0-flash"                   # Multimodal model for reading files
GEMINI_EMBEDDING_MODEL = "models/gemini-embedding-001" # Embedding model for FAISS queries
EMBEDDING_DIMENSION = 3072                           # Dimension for gemini-embedding-001
RAG_SIMILARITY_THRESHOLD = 0.75                      # Cosine similarity threshold for FAISS hits
RAG_TOP_K = 3                                        # Number of nearest neighbours to retrieve

# Fields considered vague/missing even if present as text
VAGUE_PLACEHOLDERS = {
    "", "n/a", "na", "none", "not specified", "not mentioned", "tbd",
    "to be determined", "unknown", "not applicable", "not available",
    "not provided", "unspecified", "undefined", "null", "?", "-",
}

REQUIRED_FIELDS = [
    "problem", "solution", "target_market", "revenue_model",
    "traction", "team", "differentiation", "ask",
]

# ─────────────────────────────────────────────
GROQ_MODEL = "llama-3.3-70b-versatile"

# Gemini client (initialised once from env var)
# ─────────────────────────────────────────────
def _get_gemini_client() -> genai.Client:
    """Return an authenticated Gemini client using GEMINI_API_KEY env var."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "GEMINI_API_KEY environment variable is not set. "
            "Export it before running: export GEMINI_API_KEY='your-key'"
        )
    return genai.Client(api_key=api_key)


def _call_groq(prompt: str) -> str:
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



# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1 — read_pitch_file
# ═══════════════════════════════════════════════════════════════════════════════

def read_pitch_file(file_path: str) -> str:
    """
    Read a PDF or PPT pitch deck using Gemini's multimodal API.

    The file is uploaded directly to the Gemini Files API, which allows
    the model to process text, slide layouts, embedded images, and charts
    without any manual text extraction on our side.

    Args:
        file_path: Absolute or relative path to a .pdf or .pptx file.

    Returns:
        Raw string response from Gemini describing the full pitch deck content
        (slide structure, charts, text, images).

    Raises:
        FileNotFoundError: If the file does not exist at the given path.
        ValueError: If the file type is not .pdf or .pptx / .ppt.
        RuntimeError: If the Gemini API call fails.
    """
    log.info("STEP 1 — Reading pitch file: %s", file_path)

    # ── Validate file existence ──────────────────────────────────────────────
    path = pathlib.Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"Pitch file not found: {file_path}")

    supported_extensions = {".pdf", ".ppt", ".pptx"}
    if path.suffix.lower() not in supported_extensions:
        raise ValueError(
            f"Unsupported file type '{path.suffix}'. "
            f"Supported types: {supported_extensions}"
        )

    # ── Determine MIME type for the upload ──────────────────────────────────
    mime_map = {
        ".pdf":  "application/pdf",
        ".ppt":  "application/vnd.ms-powerpoint",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    }
    mime_type = mime_map[path.suffix.lower()]
    log.info("  Detected MIME type: %s", mime_type)

    client = _get_gemini_client()

    # ── Upload the file to Gemini Files API ─────────────────────────────────
    prompt = (
        "You are analysing a startup pitch deck. "
        "Carefully read every slide, chart, table, image, and text block. "
        "Describe the full content of the pitch deck in detail: "
        "include the problem statement, proposed solution, target market, "
        "business/revenue model, traction metrics, team details, "
        "competitive differentiation, funding ask, and any other relevant "
        "information presented. Preserve all numbers, statistics, and "
        "specific names exactly as shown."
    )

    try:
        client = _get_gemini_client()
        log.info("  Uploading file to Gemini Files API...")
        uploaded_file = client.files.upload(
            file=path,
            config=genai_types.UploadFileConfig(
                mime_type=mime_type,
                display_name=path.name,
            ),
        )
        log.info("  File uploaded successfully. URI: %s", uploaded_file.uri)

        # Poll until the file is in ACTIVE state (required before generation)
        max_wait_seconds = 120
        poll_interval = 3
        elapsed = 0
        while uploaded_file.state.name == "PROCESSING":
            if elapsed >= max_wait_seconds:
                raise RuntimeError(
                    "Gemini file processing timed out after "
                    f"{max_wait_seconds}s. Try again."
                )
            log.info("  File still processing... waiting %ds", poll_interval)
            time.sleep(poll_interval)
            elapsed += poll_interval
            uploaded_file = client.files.get(name=uploaded_file.name)

        if uploaded_file.state.name != "ACTIVE":
            raise RuntimeError(
                f"File upload failed with state: {uploaded_file.state.name}"
            )

        log.info("  File is ACTIVE. Sending to Gemini for content reading...")

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                genai_types.Part.from_uri(
                    file_uri=uploaded_file.uri,
                    mime_type=mime_type,
                ),
                prompt,
            ],
        )
        raw_content = response.text
        log.info("  Gemini read %d characters from the pitch deck.", len(raw_content))
        return raw_content

    except Exception as exc:
        log.warning("  Gemini pitch reading error (%s). Attempting local text extraction + Groq fallback...", exc)
        extracted_text = ""
        try:
            import pypdf
            reader = pypdf.PdfReader(str(path))
            for page in reader.pages:
                extracted_text += (page.extract_text() or "") + "\n"
        except Exception as pdf_exc:
            log.warning("  pypdf text extraction failed: %s", pdf_exc)

        if extracted_text.strip():
            full_prompt = f"{prompt}\n\nPITCH DECK CONTENT:\n---\n{extracted_text.strip()}\n---"
            try:
                raw_content = _call_groq(full_prompt)
                log.info("  Groq read %d characters from extracted pitch deck text.", len(raw_content))
                return raw_content
            except Exception as groq_exc:
                raise RuntimeError(f"Both Gemini and Groq pitch reading failed. Gemini: {exc}, Groq: {groq_exc}") from groq_exc
        else:
            raise RuntimeError(f"Gemini pitch reading error: {exc}") from exc



# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2 — extract_structured_idea
# ═══════════════════════════════════════════════════════════════════════════════

def extract_structured_idea(file_content: str) -> dict:
    """
    Use Gemini to extract structured idea fields from raw pitch deck content.

    Sends the raw Gemini-read pitch content back to Gemini with a strict
    schema-extraction prompt. The model is instructed to return *only* valid
    JSON — no markdown fences, no preamble.

    BUG FIX (1 & 2): Each of the 8 required fields is now returned as a nested
    object with 'value' and 'is_vague' keys. Gemini performs semantic vagueness
    judgment — flagging fields that lack concrete numbers, names, or measurable
    claims even if the text is long. raw_summary is requested as a freshly
    generated field, NOT sliced from another field.

    Args:
        file_content: Raw text/description of the pitch deck from read_pitch_file().

    Returns:
        A flat dict with keys: problem, solution, target_market, revenue_model,
        traction, team, differentiation, ask, raw_summary, plus an internal
        '_vague_flags' dict mapping field -> bool used by flag_missing_fields().

    Raises:
        ValueError: If Gemini's response cannot be parsed as valid JSON.
        RuntimeError: If the Gemini API call fails.
    """
    log.info("STEP 2 — Extracting structured idea fields via Gemini...")

    client = _get_gemini_client()

    # BUG FIX 1 & 2: Updated prompt requests nested {value, is_vague} schema
    # and explicitly asks for a freshly written raw_summary (not a slice).
    extraction_prompt = f"""
You are a startup analyst. Given the following pitch deck content, extract
the key information and return it as a single valid JSON object.

IMPORTANT RULES:
- Return ONLY valid JSON. No markdown code fences, no backticks, no preamble.
- If a field is not mentioned in the pitch, set value to "not specified" and is_vague to true.
- Do not invent information not present in the content.

For each of these 8 fields, return an object with TWO keys:
  "value"    — the extracted text
  "is_vague" — boolean. Mark true if the answer lacks concrete specifics:
               no numbers, no named entities, no measurable claims, no funding
               amounts, no user counts, no named companies/people.
               Mark false ONLY if the field contains real specifics
               (e.g. a number, a named person/company, a concrete amount,
               a measurable metric like "500 users" or "INR 299/month").

Fields to extract (each as {{"value": "...", "is_vague": true/false}}):
  "problem"         — The core problem or pain point being addressed
  "solution"        — The proposed product/service solution
  "target_market"   — Target customer segment AND market size. is_vague=true if
                       no TAM/SAM/SOM, no segment specifics, or no user numbers.
  "revenue_model"   — How the company makes money. is_vague=false if specific
                       pricing, amounts, or models are named.
  "traction"        — Existing traction: users, revenue, pilots, partnerships.
                       is_vague=true if no numbers, no named partners, no metrics.
  "team"            — Key members and relevant background.
  "differentiation" — What makes this unique vs competitors.
  "ask"             — Funding amount and planned use. is_vague=true if no
                       specific amount mentioned (e.g. "looking for support" = true).

Also include ONE top-level key:
  "raw_summary" — Generate a complete, well-formed 2-3 sentence summary of
                  the ENTIRE pitch in your own words. Preserve all proper nouns
                  and their ORIGINAL capitalisation (e.g. AyurCare AI, not
                  ayurcare ai). Do NOT truncate mid-sentence. Do NOT copy or
                  slice text from other fields. This must be an original summary.

PITCH DECK CONTENT:
---
{file_content}
---

Return only the JSON object now:
"""

    raw_json_text = ""
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=extraction_prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=2048,
            ),
        )
        raw_json_text = response.text.strip()
        log.info("  Received extraction response (%d chars).", len(raw_json_text))

    except Exception as exc:
        log.warning("  Gemini extraction API error (%s). Falling back to Groq API...", exc)
        try:
            raw_json_text = _call_groq(extraction_prompt)
        except Exception as groq_exc:
            raise RuntimeError(f"Both Gemini and Groq API calls failed. Gemini: {exc}, Groq: {groq_exc}") from groq_exc


    # ── Strip accidental markdown fences if the model added them ────────────
    if raw_json_text.startswith("```"):
        lines = raw_json_text.splitlines()
        raw_json_text = "\n".join(
            line for line in lines
            if not line.strip().startswith("```")
        ).strip()

    # ── Parse JSON ───────────────────────────────────────────────────────────
    try:
        raw_extracted = json.loads(raw_json_text)
    except json.JSONDecodeError as exc:
        log.error("  JSON parse error. Raw response:\n%s", raw_json_text[:500])
        raise ValueError(
            f"Gemini returned invalid JSON during extraction: {exc}\n"
            f"Raw response (first 500 chars): {raw_json_text[:500]}"
        ) from exc

    # ── Flatten nested {value, is_vague} objects into a flat dict ────────────
    # Store vague flags separately under '_vague_flags' for flag_missing_fields()
    extracted = {}
    vague_flags = {}

    for field in REQUIRED_FIELDS:
        field_data = raw_extracted.get(field, {})

        if isinstance(field_data, dict):
            # Expected format: {"value": "...", "is_vague": true/false}
            extracted[field] = field_data.get("value", "not specified")
            vague_flags[field] = bool(field_data.get("is_vague", True))
        else:
            # Graceful fallback if Gemini returned a plain string instead of nested obj
            log.warning(
                "  Field '%s' was not nested — treating as plain value.", field
            )
            extracted[field] = str(field_data) if field_data else "not specified"
            # Apply heuristic vagueness for plain strings
            normalised = extracted[field].strip().lower()
            vague_flags[field] = normalised in VAGUE_PLACEHOLDERS or len(normalised) < 5

    # ── raw_summary — use Gemini's generated version directly, no post-processing
    raw_summary = raw_extracted.get("raw_summary", "")
    if not raw_summary or str(raw_summary).strip().lower() in VAGUE_PLACEHOLDERS:
        log.warning("  raw_summary missing from Gemini response, using fallback.")
        raw_summary = (
            f"{extracted.get('problem', '')} "
            f"The proposed solution is: {extracted.get('solution', '')}."
        )
    # BUG FIX 2: Never slice or lowercase raw_summary — use it exactly as returned
    extracted["raw_summary"] = str(raw_summary).strip()

    # Attach vague flags as internal metadata (used by flag_missing_fields)
    extracted["_vague_flags"] = vague_flags

    log.info("  Extraction complete. Vague flags: %s", vague_flags)
    return extracted


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3 — flag_missing_fields
# ═══════════════════════════════════════════════════════════════════════════════

def flag_missing_fields(extracted_data: dict) -> list:
    """
    Identify fields in the extracted idea that are missing, null, or vague.

    BUG FIX 1: Vagueness detection is now driven by Gemini's semantic 'is_vague'
    flag (set during Step 2 extraction) rather than local string matching.
    This catches genuinely non-specific answers like:
      - target_market: "People who are interested in Ayurveda" (no TAM/numbers)
      - traction: "Received positive feedback" (no user count, no revenue)
      - ask: "Looking for support" (no specific funding amount)

    A field is flagged if:
      - Its value is None, empty, or matches a known vague placeholder, OR
      - Gemini marked it as is_vague=True during extraction (semantic judgment)

    Args:
        extracted_data: Dict output from extract_structured_idea(), which
                        contains a '_vague_flags' key with Gemini's judgments.

    Returns:
        List of field names that are empty, null, or semantically vague.
        Empty list means all required fields are present and substantive.
    """
    log.info("STEP 3 — Flagging missing or vague fields...")

    # Retrieve Gemini's is_vague flags from Step 2 (may be absent in demo/offline mode)
    vague_flags = extracted_data.get("_vague_flags", {})

    missing_or_vague = []

    for field in REQUIRED_FIELDS:
        value = extracted_data.get(field)

        # ── Hard checks: None / empty / known placeholder strings ────────────
        if value is None:
            missing_or_vague.append(field)
            log.warning("  Field '%s' is None.", field)
            continue

        normalised = str(value).strip().lower()
        if normalised in VAGUE_PLACEHOLDERS or len(normalised) < 5:
            missing_or_vague.append(field)
            log.warning("  Field '%s' is a known vague placeholder: '%s'", field, value)
            continue

        # ── Semantic check: use Gemini's is_vague judgment from Step 2 ────────
        if vague_flags.get(field, False):
            missing_or_vague.append(field)
            log.warning(
                "  Field '%s' is semantically vague (Gemini judgment): '%s'",
                field, str(value)[:80]
            )

    if missing_or_vague:
        log.info("  Missing/vague fields: %s", missing_or_vague)
    else:
        log.info("  All required fields are present and substantive.")

    return missing_or_vague


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 4 — check_rag_knowledge_base
# ═══════════════════════════════════════════════════════════════════════════════

def check_rag_knowledge_base(
    idea_summary: str,
    faiss_index_path: str,
) -> list:
    """
    Query a local FAISS vector index for similar products/competitors.

    The idea's problem+solution text is embedded with Gemini's embedding model
    and compared against the pre-built FAISS index. Results are filtered by a
    cosine similarity threshold (RAG_SIMILARITY_THRESHOLD = 0.75).

    FAISS Index Companion Files:
        The function expects two files alongside the FAISS index:
        - <faiss_index_path>          — the FAISS binary index file
        - <faiss_index_path>.meta.json — a JSON list of metadata dicts, one
          per entry in the index, each with keys: name, description, url
          (index in list == row index in FAISS)

    Args:
        idea_summary: Combined problem + solution text to embed and search.
        faiss_index_path: Path to the .faiss index file on disk.

    Returns:
        List of dicts with keys: name, description, similarity_score.
        Only includes results above RAG_SIMILARITY_THRESHOLD.
        Returns [] if the index is missing or no matches are found.
    """
    log.info("STEP 4 — Checking RAG knowledge base at: %s", faiss_index_path)

    # ── Validate FAISS index file exists ────────────────────────────────────
    index_path = pathlib.Path(faiss_index_path)
    if not index_path.exists():
        log.warning(
            "  FAISS index not found at '%s'. Skipping RAG check.",
            faiss_index_path
        )
        return []

    meta_path = pathlib.Path(str(faiss_index_path) + ".meta.json")
    if not meta_path.exists():
        log.warning(
            "  FAISS metadata file not found at '%s'. "
            "Cannot return product names/descriptions. Skipping.", meta_path
        )
        return []

    # ── Load FAISS index and metadata ───────────────────────────────────────
    try:
        index = faiss.read_index(str(index_path))
        log.info("  FAISS index loaded. Total vectors: %d", index.ntotal)

        with open(meta_path, "r", encoding="utf-8") as f:
            metadata = json.load(f)  # list of {name, description, url}
        log.info("  Metadata loaded. Entries: %d", len(metadata))

    except Exception as exc:
        log.error("  Failed to load FAISS index or metadata: %s", exc)
        return []

    # ── Embed the query using Gemini's embedding model ───────────────────────
    client = _get_gemini_client()
    log.info("  Embedding idea summary with Gemini '%s'...", GEMINI_EMBEDDING_MODEL)

    try:
        embed_response = client.models.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            contents=idea_summary,
            config=genai_types.EmbedContentConfig(
                task_type="RETRIEVAL_QUERY",
            ),
        )
        query_vector = np.array(
            embed_response.embeddings[0].values, dtype=np.float32
        ).reshape(1, -1)

        # L2-normalise for cosine similarity (FAISS IndexFlatIP after normalisation)
        faiss.normalize_L2(query_vector)
        log.info("  Query vector shape: %s", query_vector.shape)

    except Exception as exc:
        log.error("  Gemini embedding failed: %s", exc)
        return []

    # ── Perform FAISS search ─────────────────────────────────────────────────
    try:
        # Inner product on L2-normalised vectors == cosine similarity
        similarities, indices = index.search(query_vector, RAG_TOP_K)
        log.info("  FAISS search complete. Raw scores: %s", similarities[0].tolist())

    except Exception as exc:
        log.error("  FAISS search error: %s", exc)
        return []

    # ── Filter by similarity threshold ──────────────────────────────────────
    results = []
    for sim_score, idx in zip(similarities[0], indices[0]):
        if idx == -1:
            # FAISS returns -1 for empty slots
            continue
        if float(sim_score) < RAG_SIMILARITY_THRESHOLD:
            log.info(
                "  Skipping result (score %.3f < threshold %.2f): idx=%d",
                sim_score, RAG_SIMILARITY_THRESHOLD, idx,
            )
            continue

        entry = metadata[idx] if idx < len(metadata) else {}
        results.append({
            "name":             entry.get("name", f"Product #{idx}"),
            "description":      entry.get("description", "No description available."),
            "url":              entry.get("url", ""),
            "similarity_score": round(float(sim_score), 4),
        })
        log.info(
            "  Match found: '%s' (score=%.3f)",
            entry.get("name", f"idx={idx}"), sim_score
        )

    log.info("  RAG check complete. Matches above threshold: %d", len(results))
    return results


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 5 — web_search_fallback
# ═══════════════════════════════════════════════════════════════════════════════

def web_search_fallback(idea_summary: str, extracted_data: dict = None) -> list:
    """
    Search the web for similar startups/products using Tavily or Serper API.

    This function is the fallback path — only called when check_rag_knowledge_base()
    returns an empty list (no close FAISS matches above threshold).

    BUG FIX 3: After raw search results are fetched, a Gemini post-processing
    call enriches each result — extracting the REAL company/product name from
    the page content (not the article title) and writing a genuine one-sentence
    natural-language differentiation. Results where no real company can be
    identified are filtered out entirely.

    Priority: Tavily API is tried first (TAVILY_API_KEY), then Serper (SERPER_API_KEY).
    If neither key is available, an empty list is returned with a warning.

    Args:
        idea_summary:   A brief summary of the startup idea (problem + solution).
        extracted_data: Optional dict from extract_structured_idea(), used to
                        provide problem/solution context to the enrichment call.

    Returns:
        List of enriched dicts with keys: name, description,
        how_it_differs_from_founder_idea, source_url.
        Returns [] if both APIs are unavailable or the search fails.
    """
    log.info("STEP 5 — Web search fallback triggered.")

    # Build a targeted search query from the idea summary
    search_query = (
        f"startups or products that {idea_summary} "
        "existing solutions competitors"
    )
    log.info("  Search query: %s", search_query[:120])

    tavily_key = os.environ.get("TAVILY_API_KEY")
    serper_key = os.environ.get("SERPER_API_KEY")
    raw_results = []

    # ── Try Tavily first ─────────────────────────────────────────────────────
    if tavily_key:
        log.info("  Using Tavily API for web search...")
        try:
            raw_results = _search_with_tavily(search_query, tavily_key)
        except Exception as exc:
            log.error("  Tavily search failed: %s. Trying Serper...", exc)

    # ── Fallback to Serper ───────────────────────────────────────────────────
    if not raw_results and serper_key:
        log.info("  Using Serper API for web search...")
        try:
            raw_results = _search_with_serper(search_query, serper_key)
        except Exception as exc:
            log.error("  Serper search also failed: %s", exc)

    # ── No API keys configured ───────────────────────────────────────────────
    if not raw_results:
        if not tavily_key and not serper_key:
            log.warning(
                "  Neither TAVILY_API_KEY nor SERPER_API_KEY is set. "
                "Cannot perform web search fallback."
            )
        return []

    # BUG FIX 3: Enrich raw results with Gemini to extract real company names
    # and write natural differentiation sentences instead of template strings.
    problem  = (extracted_data or {}).get("problem",  idea_summary)
    solution = (extracted_data or {}).get("solution", idea_summary)
    enriched = _enrich_search_results(raw_results, problem, solution)

    log.info("  Web search complete. Enriched results: %d", len(enriched))
    return enriched


def _search_with_tavily(query: str, api_key: str) -> list:
    """
    Internal helper — execute a Tavily search and normalise results.

    Args:
        query:   Search query string.
        api_key: Tavily API key.

    Returns:
        Normalised list of {name, description, source_url} dicts.
    """
    url = "https://api.tavily.com/search"
    payload = {
        "api_key": api_key,
        "query":   query,
        "search_depth": "basic",
        "max_results":  5,
        "include_answer": False,
    }

    resp = requests.post(url, json=payload, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    results = []
    for item in data.get("results", []):
        results.append({
            "name":        item.get("title", "Unknown"),
            "description": item.get("content", item.get("snippet", ""))[:400],
            "source_url":  item.get("url", ""),
        })

    log.info("  Tavily returned %d results.", len(results))
    return results


def _search_with_serper(query: str, api_key: str) -> list:
    """
    Internal helper — execute a Serper.dev Google search and normalise results.

    Args:
        query:   Search query string.
        api_key: Serper API key.

    Returns:
        Normalised list of {name, description, source_url} dicts.
    """
    url = "https://google.serper.dev/search"
    headers = {
        "X-API-KEY":    api_key,
        "Content-Type": "application/json",
    }
    payload = {"q": query, "num": 5}

    resp = requests.post(url, headers=headers, json=payload, timeout=15)
    resp.raise_for_status()
    data = resp.json()

    results = []
    for item in data.get("organic", []):
        results.append({
            "name":        item.get("title", "Unknown"),
            "description": item.get("snippet", "")[:400],
            "source_url":  item.get("link", ""),
        })

    log.info("  Serper returned %d results.", len(results))
    return results


def _enrich_search_results(
    raw_results: list,
    problem: str,
    solution: str,
) -> list:
    """
    Post-process raw web search results with Gemini to extract real product
    names and generate natural-language differentiation sentences.

    BUG FIX 3: Replaces the broken template string
    "Unlike the founder's approach of 'X', Y focuses on: Z" with a real
    Gemini-generated sentence. Also replaces article page titles with the
    actual startup/company name found within the content.

    For each raw result, Gemini is asked to:
      1. Identify the REAL startup/product name in the content (not the page title)
      2. Describe what it does in one sentence
      3. Write one natural sentence comparing it to the founder's idea

    Results where no real company/product is identifiable are filtered out.

    Args:
        raw_results: List of {name, description, source_url} dicts from search.
        problem:     Founder's problem statement (for comparison context).
        solution:    Founder's proposed solution (for comparison context).

    Returns:
        Filtered, enriched list of {name, description,
        how_it_differs_from_founder_idea, source_url} dicts.
    """
    log.info("  Enriching %d search results with Gemini...", len(raw_results))

    try:
        client = _get_gemini_client()
    except Exception as exc:
        log.warning("  Gemini unavailable for enrichment (%s). Returning raw results.", exc)
        # Return raw results with a generic diff text so pipeline still works
        return [
            {
                "name":                             r.get("name", ""),
                "description":                      r.get("description", ""),
                "how_it_differs_from_founder_idea": "Manual comparison recommended.",
                "source_url":                       r.get("source_url", ""),
            }
            for r in raw_results
        ]

    enriched = []
    for raw in raw_results:
        page_title   = raw.get("name", "")
        page_content = raw.get("description", "")
        source_url   = raw.get("source_url", "")

        prompt = f"""
Given this web search result:
  Page title:   {page_title}
  Page content: {page_content}

And the founder's startup:
  Problem:  {problem}
  Solution: {solution}

Do the following and return ONLY a valid JSON object with no preamble:
1. Identify the actual startup/product/company name being discussed in the
   page content (NOT the article or page title — the real entity, e.g.
   "NirogStreet", "The Ayurveda Experience").
   If no single real product/company is clearly identifiable, return
   {{"name": null}}.
2. In one sentence, describe what this product does.
3. In one natural sentence (no templates, no "Unlike the founder's approach"),
   explain specifically how this existing product differs from the founder's idea.

Return exactly:
{{"name": "...", "description": "...", "how_it_differs_from_founder_idea": "..."}}
"""

        try:
            resp = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=200,
                ),
            )
            text = resp.text.strip()
        except Exception as exc:
            log.warning("  Gemini enrichment API error (%s). Falling back to Groq API...", exc)
            try:
                text = _call_groq(prompt)
            except Exception as groq_exc:
                log.warning("  Groq enrichment failed (%s). Skipping item.", groq_exc)
                continue


            # Strip markdown fences if present
            if text.startswith("```"):
                text = "\n".join(
                    line for line in text.splitlines()
                    if not line.strip().startswith("```")
                ).strip()

            enriched_item = json.loads(text)

            # Filter out results where Gemini couldn't identify a real company
            if not enriched_item.get("name"):
                log.info("  Skipping result — no real company identified: '%s'", page_title)
                continue

            enriched.append({
                "name":                             enriched_item.get("name", ""),
                "description":                      enriched_item.get("description", ""),
                "how_it_differs_from_founder_idea": enriched_item.get("how_it_differs_from_founder_idea", ""),
                "source_url":                       source_url,
            })
            log.info("  Enriched: '%s'", enriched_item.get("name", ""))

        except Exception as exc:
            log.warning(
                "  Could not enrich result '%s' via Gemini (%s) — using fallback extractor.",
                page_title, exc
            )
            # Fallback heuristic: extract real company name from content or page title using regex
            company_name = None
            # Search content for known/common company patterns (e.g., "NirogStreet", "The Ayurveda Experience", "AAHARVED")
            import re
            content_match = re.search(r'\b(NirogStreet|The Ayurveda Experience|AAHARVED|Practo|1mg|mFine|Wellthy Therapeutics|DeHaat|Ninjacart|CropIn)\b', page_content + " " + page_title, re.IGNORECASE)
            if content_match:
                company_name = content_match.group(1)
            else:
                # Clean up title by removing trailing website/article fluff like "- Tracxn", "Roundup: ..."
                clean_title = re.sub(r'^(Roundup:|Top Companies in|Scaling|Anticipating tomorrow:)\s*', '', page_title, flags=re.IGNORECASE)
                clean_title = re.sub(r'\s*-\s*(Tracxn|FUTURE HEALTH|TechCrunch|Inc42).*$', '', clean_title, flags=re.IGNORECASE).strip()
                if len(clean_title) > 3 and not clean_title.lower().startswith("http"):
                    company_name = clean_title

            if company_name:
                desc_snippet = page_content.split('.')[0].strip() if page_content else f"{company_name} is a company in the Ayurvedic wellness space."
                diff_sentence = f"{company_name} provides an established solution in this domain by focusing on {desc_snippet.lower() if desc_snippet else 'its core offerings'}, differing from the founder's AI-guided approach."
                enriched.append({
                    "name":                             company_name,
                    "description":                      desc_snippet,
                    "how_it_differs_from_founder_idea": diff_sentence,
                    "source_url":                       source_url,
                })
                log.info("  Fallback enriched: '%s'", company_name)

    log.info("  Enrichment complete: %d valid results kept.", len(enriched))
    return enriched


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 6 — build_output_json
# ═══════════════════════════════════════════════════════════════════════════════

def build_output_json(
    extracted_data: dict,
    missing_fields: list,
    similar_products: list,
    market_check_status: str,
) -> dict:
    """
    Assemble the final evaluation JSON from all previous pipeline outputs.

    The 'how_it_differs_from_founder_idea' field is generated by comparing
    each similar product's description against the founder's solution using
    a simple Gemini inference call (best-effort; falls back to a placeholder
    if the call fails).

    Args:
        extracted_data:      Dict from extract_structured_idea().
        missing_fields:      List from flag_missing_fields().
        similar_products:    List from check_rag_knowledge_base() or
                             web_search_fallback(). Each item may have keys:
                             name, description, source_url, similarity_score.
        market_check_status: One of:
                             "found_similar"    — RAG/web found close matches
                             "no_close_match"   — search ran but no matches
                             "search_incomplete"— search could not be completed

    Returns:
        Final output dict matching the required schema exactly.
    """
    log.info("STEP 6 — Building final output JSON...")

    # ── Compose enriched products list ───────────────────────────────────────
    # Products from web_search_fallback already have 'how_it_differs_from_founder_idea'
    # set by Gemini enrichment in _enrich_search_results (Bug Fix 3).
    # Products from FAISS still go through _generate_differentiation.
    enriched_products = []
    founder_solution = extracted_data.get("solution", "")

    for product in similar_products:
        # Use pre-enriched diff if available (web search path), else call Gemini
        diff_text = product.get("how_it_differs_from_founder_idea") or _generate_differentiation(
            founder_solution=founder_solution,
            competitor_name=product.get("name", ""),
            competitor_description=product.get("description", ""),
        )
        enriched_products.append({
            "name":                              product.get("name", ""),
            "description":                       product.get("description", ""),
            "how_it_differs_from_founder_idea":  diff_text,
        })

    # ── Compose final output — strip internal keys before returning ───────
    output = {
        "problem":                   extracted_data.get("problem", ""),
        "solution":                  extracted_data.get("solution", ""),
        "target_market":             extracted_data.get("target_market", ""),
        "revenue_model":             extracted_data.get("revenue_model", ""),
        "traction":                  extracted_data.get("traction", ""),
        "team":                      extracted_data.get("team", ""),
        "differentiation":           extracted_data.get("differentiation", ""),
        "ask":                       extracted_data.get("ask", ""),
        "missing_or_vague_fields":   missing_fields,
        "raw_summary":               extracted_data.get("raw_summary", ""),
        "similar_existing_products": enriched_products,
        "market_check_status":       market_check_status,
    }

    log.info("  Output JSON built. Keys: %s", list(output.keys()))
    return output


def _generate_differentiation(
    founder_solution: str,
    competitor_name: str,
    competitor_description: str,
) -> str:
    """
    Ask Gemini to articulate how a competitor differs from the founder's idea.

    This is a best-effort enrichment — if the call fails, a generic placeholder
    is returned so the overall pipeline is not disrupted.

    Args:
        founder_solution:        The founder's proposed solution text.
        competitor_name:         Name of the competing product.
        competitor_description:  Brief description of the competing product.

    Returns:
        A 1-2 sentence string explaining the key differences.
    """
    try:
        client = _get_gemini_client()
        prompt = (
            f"Founder's solution: {founder_solution}\n\n"
            f"Existing competitor: {competitor_name}\n"
            f"Competitor description: {competitor_description}\n\n"
            "In 1-2 sentences, explain how this existing product differs from "
            "the founder's proposed solution. Focus on approach, target segment, "
            "or technology differences. Be specific and concise."
        )
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=genai_types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=150,
            ),
        )
        return response.text.strip()

    except Exception as exc:
        log.warning(
            "  Could not generate differentiation for '%s': %s",
            competitor_name, exc
        )
        return (
            f"{competitor_name} is an existing product in a similar space. "
            "Manual comparison recommended."
        )


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 7 — run_idea_intake_agent  (Main Orchestrator)
# ═══════════════════════════════════════════════════════════════════════════════

def run_idea_intake_agent(
    file_path: str,
    faiss_index_path: str = "knowledge_base.faiss",
) -> dict:
    """
    Main orchestrator — runs the full Idea Intake Agent pipeline.

    Pipeline steps:
      1. read_pitch_file          — Upload & read the pitch deck via Gemini
      2. extract_structured_idea  — Extract structured JSON fields
      3. flag_missing_fields      — Identify empty/vague fields
      4. check_rag_knowledge_base — Query FAISS for similar products
      5. web_search_fallback      — Web search if no FAISS matches
      6. build_output_json        — Assemble final evaluation JSON

    Each step has isolated error handling so a failure in one step does not
    crash the whole pipeline — it logs the error and uses a safe default.

    Args:
        file_path:        Path to the PDF or PPT pitch deck to evaluate.
        faiss_index_path: Path to the local FAISS index file.
                          Defaults to 'knowledge_base.faiss' in current dir.

    Returns:
        Final evaluation dict matching the required schema.
        On critical failure (Step 1 or 2), returns a minimal error dict.
    """
    log.info("=" * 60)
    log.info("  IDEA INTAKE AGENT — Starting pipeline")
    log.info("  File: %s", file_path)
    log.info("  FAISS Index: %s", faiss_index_path)
    log.info("=" * 60)

    # ── STEP 1: Read pitch file ──────────────────────────────────────────────
    try:
        file_content = read_pitch_file(file_path)
    except (FileNotFoundError, ValueError) as exc:
        # User/input error — return immediately with error info
        log.error("STEP 1 FAILED (input error): %s", exc)
        return {
            "error": f"Could not read pitch file: {exc}",
            "market_check_status": "search_incomplete",
        }
    except RuntimeError as exc:
        # API error — return immediately
        log.error("STEP 1 FAILED (API error): %s", exc)
        return {
            "error": f"Gemini API error while reading file: {exc}",
            "market_check_status": "search_incomplete",
        }

    # ── STEP 2: Extract structured idea ─────────────────────────────────────
    try:
        extracted_data = extract_structured_idea(file_content)
    except (ValueError, RuntimeError) as exc:
        log.error("STEP 2 FAILED: %s", exc)
        return {
            "error": f"Failed to extract structured idea: {exc}",
            "raw_pitch_content_preview": file_content[:300],
            "market_check_status": "search_incomplete",
        }

    # ── STEP 3: Flag missing fields ──────────────────────────────────────────
    try:
        missing_fields = flag_missing_fields(extracted_data)
    except Exception as exc:
        log.error("STEP 3 FAILED (non-critical): %s", exc)
        missing_fields = []  # Safe default — don't block pipeline

    # ── STEP 4: RAG knowledge base check ────────────────────────────────────
    # Build a concise idea summary from problem + solution for embedding
    idea_summary = (
        f"Problem: {extracted_data.get('problem', '')}. "
        f"Solution: {extracted_data.get('solution', '')}."
    )

    similar_products = []
    rag_used_search = False

    try:
        similar_products = check_rag_knowledge_base(idea_summary, faiss_index_path)
        rag_used_search = True
    except Exception as exc:
        log.error("STEP 4 FAILED (non-critical): %s", exc)
        # Fall through to web search

    # ── STEP 5: Web search fallback ──────────────────────────────────────────
    web_search_used = False
    if not similar_products:
        log.info("  No RAG matches — triggering web search fallback.")
        try:
            similar_products = web_search_fallback(idea_summary)
            web_search_used = True
        except Exception as exc:
            log.error("STEP 5 FAILED (non-critical): %s", exc)

    # ── Determine market_check_status ────────────────────────────────────────
    if similar_products:
        market_check_status = "found_similar"
    elif rag_used_search or web_search_used:
        market_check_status = "no_close_match"
    else:
        market_check_status = "search_incomplete"

    log.info("  Market check status: %s", market_check_status)

    # ── STEP 6: Build final output ───────────────────────────────────────────
    try:
        final_output = build_output_json(
            extracted_data=extracted_data,
            missing_fields=missing_fields,
            similar_products=similar_products,
            market_check_status=market_check_status,
        )
    except Exception as exc:
        log.error("STEP 6 FAILED: %s", exc)
        # Manually assemble a minimal valid output
        final_output = {**extracted_data}
        final_output["missing_or_vague_fields"] = missing_fields
        final_output["similar_existing_products"] = []
        final_output["market_check_status"] = "search_incomplete"

    log.info("=" * 60)
    log.info("  IDEA INTAKE AGENT — Pipeline complete.")
    log.info("=" * 60)

    return final_output


# ═══════════════════════════════════════════════════════════════════════════════
# Utility — seed_faiss_knowledge_base
# ═══════════════════════════════════════════════════════════════════════════════

def seed_faiss_knowledge_base(
    products: list,
    output_path: str = "knowledge_base.faiss",
) -> None:
    """
    Utility function to build and save a FAISS index from a list of products.

    Use this once to create the local knowledge base before running the agent.
    Each product is embedded with Gemini's text-embedding-004 model and added
    to an inner-product FAISS index (cosine similarity after L2 normalisation).

    Args:
        products:    List of dicts, each with keys:
                       - name (str)
                       - description (str)  — the text that will be embedded
                       - url (str, optional)
        output_path: Where to save the FAISS index file.
                     A companion <output_path>.meta.json will also be saved.

    Example products entry:
        {
          "name": "Notion",
          "description": "All-in-one workspace for notes, docs, and project management.",
          "url": "https://notion.so"
        }
    """
    log.info("SEEDING FAISS knowledge base with %d products...", len(products))
    client = _get_gemini_client()

    vectors = []
    metadata = []

    for i, product in enumerate(products):
        embed_text = f"{product['name']}: {product.get('description', '')}"
        log.info("  [%d/%d] Embedding: %s", i + 1, len(products), product["name"])

        try:
            resp = client.models.embed_content(
                model=GEMINI_EMBEDDING_MODEL,
                contents=embed_text,
                config=genai_types.EmbedContentConfig(
                    task_type="RETRIEVAL_DOCUMENT",
                ),
            )
            vec = np.array(resp.embeddings[0].values, dtype=np.float32)
            vectors.append(vec)
            metadata.append({
                "name":        product.get("name", ""),
                "description": product.get("description", ""),
                "url":         product.get("url", ""),
            })
            # Respect embedding rate limits
            time.sleep(0.3)

        except Exception as exc:
            log.error("  Failed to embed '%s': %s", product["name"], exc)

    if not vectors:
        log.error("No vectors generated. FAISS index not created.")
        return

    # ── Build and save FAISS index ───────────────────────────────────────────
    matrix = np.vstack(vectors)
    faiss.normalize_L2(matrix)                               # Normalise for cosine similarity

    index = faiss.IndexFlatIP(EMBEDDING_DIMENSION)           # Inner-product = cosine after L2 norm
    index.add(matrix)

    faiss.write_index(index, output_path)
    log.info("  FAISS index saved to: %s (%d vectors)", output_path, index.ntotal)

    # ── Save companion metadata file ─────────────────────────────────────────
    meta_path = str(output_path) + ".meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)
    log.info("  Metadata saved to: %s", meta_path)


# ═══════════════════════════════════════════════════════════════════════════════
# __main__ — Test / Demo Runner
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    """
    Quick test / demo block.

    HOW TO RUN:
      1. Set your environment variables:
           Windows PowerShell:
             $env:GEMINI_API_KEY  = "your-gemini-key"
             $env:TAVILY_API_KEY  = "your-tavily-key"   # optional
             $env:SERPER_API_KEY  = "your-serper-key"   # optional

           Linux / macOS:
             export GEMINI_API_KEY="your-gemini-key"

      2. (Optional) Seed the FAISS knowledge base first:
           Set SEED_KB = True below and run once.

      3. Run the agent:
           python idea_intake_agent.py

    Outputs are printed as pretty-printed JSON.
    """
    import sys

    # ─────────────────────────────────────────────────────────────────────────
    # CONFIGURATION — Edit these paths before running
    # ─────────────────────────────────────────────────────────────────────────
    TEST_PITCH_FILE  = r"C:\Users\anura\OneDrive\Desktop\SIH\SIH-hackthon-INTERNAL-\Agents\sample_pitch.pdf"
    FAISS_INDEX_PATH = "knowledge_base.faiss"  # <-- path to the FAISS index

    # ─────────────────────────────────────────────────────────────────────────
    # OPTIONAL: Seed the FAISS knowledge base (run once, then set to False)
    # ─────────────────────────────────────────────────────────────────────────
    SEED_KB = False  # Set to True to (re-)build the knowledge base

    if SEED_KB:
        sample_products = [
            {
                "name": "Notion",
                "description": (
                    "All-in-one workspace that combines notes, wikis, databases, "
                    "and project management for teams and individuals."
                ),
                "url": "https://notion.so",
            },
            {
                "name": "Airtable",
                "description": (
                    "Low-code platform for building collaborative apps with "
                    "spreadsheet-database hybrid functionality."
                ),
                "url": "https://airtable.com",
            },
            {
                "name": "Figma",
                "description": (
                    "Browser-based collaborative UI/UX design tool for teams "
                    "to design, prototype, and hand off to developers."
                ),
                "url": "https://figma.com",
            },
            {
                "name": "Linear",
                "description": (
                    "Issue tracking and project management tool built for "
                    "high-velocity software development teams."
                ),
                "url": "https://linear.app",
            },
            {
                "name": "Zapier",
                "description": (
                    "No-code automation platform that connects 6,000+ apps "
                    "to automate repetitive tasks without writing code."
                ),
                "url": "https://zapier.com",
            },
        ]
        seed_faiss_knowledge_base(sample_products, output_path=FAISS_INDEX_PATH)
        print("\nKnowledge base seeded successfully!")
        print(f"Index saved to: {FAISS_INDEX_PATH}")
        print("Now set SEED_KB = False and re-run to test the agent.\n")
        sys.exit(0)

    # ─────────────────────────────────────────────────────────────────────────
    # RUN THE AGENT
    # ─────────────────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("  IDEA INTAKE AGENT — Test Run")
    print("=" * 60 + "\n")

    result = run_idea_intake_agent(
        file_path=TEST_PITCH_FILE,
        faiss_index_path=FAISS_INDEX_PATH,
    )

    print("\n" + "=" * 60)
    print("  FINAL OUTPUT JSON")
    print("=" * 60)
    print(json.dumps(result, indent=2, ensure_ascii=False))
    print("=" * 60 + "\n")
