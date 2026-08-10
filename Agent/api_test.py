"""
api_test.py  —  End-to-end programmatic test of interview_api.py
Tests: /api/health, /api/interview/start, /api/interview/answer (x3, including
a founder-question-back), /api/interview/result
Prints EXACT raw JSON at every step.
"""
import json, sys, urllib.request, urllib.error

BASE = "http://localhost:8000"

def call(method, path, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
          headers={"Content-Type": "application/json"} if data else {})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            raw = r.read().decode()
            return r.status, raw
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as ex:
        return 0, str(ex)

def section(title):
    print("\n" + "="*60)
    print("  " + title)
    print("="*60)

# ── 1. Health check ──────────────────────────────────────────
section("STEP 1 — GET /api/health")
status, body = call("GET", "/api/health")
print(f"HTTP {status}")
print(body)
if status != 200:
    print("FATAL: API not reachable. Is uvicorn running?")
    sys.exit(1)

# ── 2. Start interview ────────────────────────────────────────
section("STEP 2 — POST /api/interview/start  (demo AyurCare AI context)")
status, body = call("POST", "/api/interview/start", {"idea_context": None})
print(f"HTTP {status}")
print(body)
if status != 200:
    print("FATAL: /start failed.")
    sys.exit(1)

data = json.loads(body)
session_id = data["session_id"]
print(f"\n>>> session_id : {session_id}")
print(f">>> startup_name: {data.get('startup_name')}")
print(f">>> first question: {data.get('question')}")
print(f">>> progress: {data.get('progress')}")

# ── 3. Answer 1 — normal answer ──────────────────────────────
section("STEP 3 — POST /api/interview/answer  (normal founder answer)")
ans1 = "We are building AyurCare AI — an AI-driven Prakriti assessment platform where every wellness plan is reviewed and signed off by a licensed AYUSH practitioner before the patient sees it."
print(f"Sending answer: \"{ans1[:80]}...\"")
status, body = call("POST", "/api/interview/answer",
                    {"session_id": session_id, "answer": ans1})
print(f"HTTP {status}")
print(body)
data2 = json.loads(body)
print(f"\n>>> finished: {data2.get('finished')}")
print(f">>> next question: {data2.get('question')}")
print(f">>> founder_question_handled: {data2.get('founder_question_handled')}")
print(f">>> progress: {data2.get('progress')}")

# ── 4. Answer 2 — founder asks a question back ───────────────
section("STEP 4 — POST /api/interview/answer  (FOUNDER ASKS QUESTION BACK)")
ans2 = "How is this interview being scored? What criteria matter most?"
print(f"Sending answer: \"{ans2}\"")
status, body = call("POST", "/api/interview/answer",
                    {"session_id": session_id, "answer": ans2})
print(f"HTTP {status}")
print(body)
data3 = json.loads(body)
print(f"\n>>> finished: {data3.get('finished')}")
print(f">>> next question: {data3.get('question')}")
print(f">>> founder_question_handled: {data3.get('founder_question_handled')}")
print(f">>> progress: {data3.get('progress')}")

# ── 5. Answer 3 — another normal answer ──────────────────────
section("STEP 5 — POST /api/interview/answer  (normal answer #2)")
ans3 = "Our target market is urban Indian wellness consumers aged 25-55 who are already interested in Ayurveda. We estimate roughly 80 million such users in tier-1 and tier-2 cities, and we plan to capture the top 1% in year one through content marketing."
print(f"Sending answer: \"{ans3[:80]}...\"")
status, body = call("POST", "/api/interview/answer",
                    {"session_id": session_id, "answer": ans3})
print(f"HTTP {status}")
print(body)
data4 = json.loads(body)
print(f"\n>>> finished: {data4.get('finished')}")
print(f">>> next question: {data4.get('question')}")
print(f">>> founder_question_handled: {data4.get('founder_question_handled')}")
print(f">>> progress: {data4.get('progress')}")

# ── 6. GET result (expect 400 since not finished) ─────────────
section("STEP 6 — GET /api/interview/result/{session_id}  (mid-interview, expect 400)")
status, body = call("GET", f"/api/interview/result/{session_id}")
print(f"HTTP {status}  (expected 400 — interview not finished yet)")
print(body)

section("ALL STEPS COMPLETE — paste this output when reporting results")
