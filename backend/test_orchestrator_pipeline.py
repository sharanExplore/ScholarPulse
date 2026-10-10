import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

from agents.orchestrator import OrchestratorAgent

upload_dir = "uploads"
attention_candidates = [
    f for f in os.listdir(upload_dir)
    if 'Attention_Is_All_You_Need.pdf' in f or 'scholarpulse_example_input.pdf' in f
]
if not attention_candidates:
    raise FileNotFoundError("Could not find Attention PDF candidate in uploads directory")
pdf_path = os.path.join(upload_dir, attention_candidates[0])
with open(pdf_path, "rb") as f:
    file_bytes = f.read()

orchestrator = OrchestratorAgent(upload_dir="uploads")
res = orchestrator.process_document("Attention_Is_All_You_Need.pdf", file_bytes)

print("\n=== PIPELINE EXECUTION SUCCESSFUL ===")
print("Paper ID:", res["paper_id"])
print("Status:", res["status"])
print("Title:", res["metadata"]["title"])
print("Publication Year:", res["metadata"].get("publication_year"))
print("Document Type:", res["metadata"].get("document_type"))
print("Authors count:", len(res["metadata"]["authors"]))
print("Authors:", res["metadata"]["authors"])
print("Abstract length:", len(res["metadata"]["abstract"]))
print("Keywords count:", len(res["keywords"]))
print("Top 6 Keywords:", [k["keyword"] for k in res["keywords"][:6]])
print("Summary key findings:", len(res["summary"]["key_findings"]))
print("References parsed:", len(res["references"]))
print("Citation Metrics:", res["citation_metrics"])
print("Median Reference Year:", res["citation_metrics"].get("median_year"))
print("Reference Density:", res["citation_metrics"].get("reference_density_per_page"))
print("Health Score / Rigor Score:", res["dashboard"].get("academic_health_score"), "/", res["dashboard"].get("rigor_score"))
print("\n=== RECOMMENDATIONS ===")
for idx, rec in enumerate(res["recommendations"], start=1):
    print(f"[{idx}] {rec['title']} (Score: {rec['similarity_score']}, Source: {rec['source']})")
    print(f"     Rationale: {rec['rationale']}")

# VERIFICATION OF ACCURACY RULES
print("\n=== VERIFYING ACCURACY RULES ===")

# 1. Title verification
assert "Attention Is All You Need" in res["metadata"]["title"], "Title mismatch"
print("✓ Rule 1: Title verified as 'Attention Is All You Need'")

# 2. Publication year
assert res["metadata"].get("publication_year") == 2017, f"Expected publication year 2017, got {res['metadata'].get('publication_year')}"
print("✓ Rule 2: Publication year verified as 2017")

# 3. Authors: all 8 authors extracted
assert len(res["metadata"]["authors"]) == 8, f"Expected 8 authors, got {len(res['metadata']['authors'])}"
print("✓ Rule 3: All 8 authors extracted accurately")

# 4. References & Reference Density
assert len(res["references"]) >= 35, f"Expected >=35 references, got {len(res['references'])}"
assert res["citation_metrics"].get("reference_density_per_page") is not None, "Reference density missing"
assert res["citation_metrics"].get("median_year") is not None, "Median reference year missing"
print(f"✓ Rule 4: Reference Density ({res['citation_metrics'].get('reference_density_per_page')} refs/page) and Median Year ({res['citation_metrics'].get('median_year')}) verified")

# 5. Rigor Score Consistency
assert res["dashboard"].get("academic_health_score") == res["dashboard"].get("rigor_score"), "Health score and rigor score must be identical"
print(f"✓ Rule 5: Rigor score consistency verified: {res['dashboard'].get('academic_health_score')}/100")

# 6. Recommendation Quality & Filtering
for rec in res["recommendations"]:
    t = rec["title"]
    assert not t.lower().startswith("figure "), f"Figure caption leaked into recommendations: {t}"
    assert not t.lower().startswith("table "), f"Table caption leaked into recommendations: {t}"
    assert not t.lower().startswith("section "), f"Section heading leaked into recommendations: {t}"
    # No unrelated Vue or Redis papers for Attention paper
    assert "vue" not in t.lower(), f"Unrelated Vue paper leaked: {t}"
    assert "redis" not in t.lower(), f"Unrelated Redis paper leaked: {t}"
    assert rec["similarity_score"] >= 0.45, f"Score below threshold: {rec['similarity_score']}"
print("✓ Rule 6: Related paper recommendations strictly verified (no captions, no unrelated papers, domain-aligned)")

print("\nALL ACCURACY RULES PASSED SUCCESSFULLY!")
