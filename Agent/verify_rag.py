import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))

from idea_intake_agent import run_idea_intake_agent

PITCH = str(pathlib.Path(__file__).parent / "sample_pitch.pdf")
FAISS = str(pathlib.Path(__file__).parent / "knowledge_base.faiss")

print("Running idea_intake_agent against sample_pitch.pdf ...")
result = run_idea_intake_agent(file_path=PITCH, faiss_index_path=FAISS)

print()
print("=" * 60)
print("  RAG VERIFICATION RESULT")
print("=" * 60)
status = result.get("market_check_status", "MISSING")
similar = result.get("similar_existing_products", [])
print("market_check_status      :", status)
print("similar_existing_products:", len(similar), "matches")
for p in similar:
    score = p.get("similarity_score", p.get("score", "n/a"))
    if isinstance(score, float):
        print("  -", p["name"], " (score={:.4f})".format(score))
    else:
        print("  -", p["name"], " (score={})".format(score))
print("=" * 60)
