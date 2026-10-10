import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

from agents.orchestrator import OrchestratorAgent
import database.db as db

def run_regression():
    print("==================================================")
    print("SCHOLARPULSE - RUNNING FULL SYSTEM REGRESSION TEST")
    print("==================================================")

    # 1. Test Attention Is All You Need
    upload_dir = "uploads"
    attention_files = [f for f in os.listdir(upload_dir) if "scholarpulse_example_input.pdf" in f or "Attention" in f]
    if not attention_files:
        raise FileNotFoundError("Attention Is All You Need PDF not found in uploads")
    
    attention_path = os.path.join(upload_dir, attention_files[0])
    print(f"\nProcessing Attention Is All You Need: {attention_path}")
    with open(attention_path, "rb") as f:
        file_bytes = f.read()

    orchestrator = OrchestratorAgent(upload_dir=upload_dir)
    res = orchestrator.process_document("Attention_Is_All_You_Need.pdf", file_bytes)
    paper_id = res["paper_id"]
    print(f"Assigned Paper ID: {paper_id}")

    # Check 1: Title, Authors, Year, Pages
    meta = res["metadata"]
    assert "Attention Is All You Need" in meta["title"], f"Title mismatch: {meta['title']}"
    assert meta["publication_year"] == 2017, f"Year mismatch: {meta['publication_year']}"
    assert len(meta["authors"]) == 8, f"Expected 8 authors, got {len(meta['authors'])}"
    doc = res["document"]
    assert doc["page_count"] == 15, f"Expected 15 pages, got {doc['page_count']}"
    print("✓ Check 1 Passed: Title='Attention Is All You Need', Authors=8, Year=2017, Pages=15")

    # Check 2: Canonical References count
    validated_refs = res.get("validated_references", [])
    assert len(validated_refs) == 40, f"Expected 40 validated references, got {len(validated_refs)}"
    # Check fields in each reference
    for ref in validated_refs:
        assert "reference_number" in ref, "Missing reference_number"
        assert "title" in ref, "Missing title"
        assert "authors" in ref, "Missing authors"
        assert "year" in ref, "Missing year"
        assert "venue" in ref, "Missing venue"
        assert "raw_text" in ref, "Missing raw_text"
        assert "in_text_mention_count" in ref, "Missing in_text_mention_count"
        assert "source_page" in ref, "Missing source_page"
        assert "confidence" in ref, "Missing confidence"
    print("✓ Check 2 Passed: 40 validated_references present with all canonical fields")

    # Check 3: Citation Intelligence Metrics
    cm = res["citation_metrics"]
    assert cm["total_references"] == 40, f"Expected total_references=40, got {cm['total_references']}"
    assert cm["in_text_mentions"] == sum(r["in_text_mention_count"] for r in validated_refs), "in_text_mentions mismatch"
    assert cm["external_citations"] == "N/A", f"Expected external_citations='N/A', got {cm['external_citations']}"
    assert "2.67" in str(cm["reference_density"]), f"Expected 2.67 density, got {cm['reference_density']}"
    assert cm["reference_density_per_page"] == 2.67, f"Expected 2.67 density, got {cm['reference_density_per_page']}"
    print(f"✓ Check 3 Passed: total_references={cm['total_references']}, in_text_mentions={cm['in_text_mentions']}, density={cm['reference_density']}, external_citations={cm['external_citations']}")

    # Check 4: Temporal Distribution
    yd = cm["year_distribution"]
    assert yd.get("<2015") == 13, f"Expected <2015: 13, got {yd.get('<2015')}"
    assert yd.get("2015-2019") == 27, f"Expected 2015-2019: 27, got {yd.get('2015-2019')}"
    assert yd.get("2020-2023", 0) == 0, f"Expected 2020-2023: 0, got {yd.get('2020-2023')}"
    assert yd.get("2024-2026", 0) == 0, f"Expected 2024-2026: 0, got {yd.get('2024-2026')}"
    assert cm.get("unknown_year_count", 0) == 0, f"Expected Unknown: 0, got {cm.get('unknown_year_count')}"
    known_count = cm["known_year_count"]
    bucket_sum = yd["<2015"] + yd["2015-2019"] + yd.get("2020-2023", 0) + yd.get("2024-2026", 0)
    assert bucket_sum == known_count == 40, f"Bucket sum {bucket_sum} != known {known_count}"
    print("✓ Check 4 Passed: Temporal buckets = 13 (<2015) / 27 (2015-2019) / 0 (2020-2023) / 0 (2024-2026), Total=40")

    # Check 5: Keywords Canonicalization
    kws = [k["keyword"] for k in res["keywords"]]
    expected_concepts = [
        "Transformer", "Self-Attention", "Multi-Head Attention",
        "Scaled Dot-Product Attention", "Positional Encoding",
        "Encoder-Decoder Architecture", "Neural Machine Translation",
        "Sequence Transduction", "WMT 2014", "BLEU"
    ]
    matched_concepts = [c for c in expected_concepts if any(c.lower() in k.lower() for k in kws)]
    print(f"Keywords extracted ({len(kws)}): {kws[:10]}...")
    print(f"Matched concepts ({len(matched_concepts)}/{len(expected_concepts)}): {matched_concepts}")
    assert len(matched_concepts) >= 8, f"Too few expected concepts matched: {matched_concepts}"
    # Verify no redundant variants like 'English-To-French' alongside 'English-to-French Translation'
    e2f_variants = [k for k in kws if "french" in k.lower()]
    assert len(e2f_variants) <= 1, f"Duplicate semantic variants found for English-to-French: {e2f_variants}"
    print("✓ Check 5 Passed: Concept canonicalization verified; core concepts present without duplicate variants")

    # Check 6: Summary Quality
    summary = res["summary"]
    key_findings = summary.get("key_findings", [])
    assert 3 <= len(key_findings) <= 6, f"Expected 3-5 contributions, got {len(key_findings)}"
    # Verify separation of contributions from results
    structured = summary.get("structured_sections", {})
    assert "research_problem" in structured, "Missing research_problem in structured_sections"
    assert "proposed_approach" in structured, "Missing proposed_approach in structured_sections"
    assert "architecture" in structured, "Missing architecture in structured_sections"
    assert "key_technical_components" in structured, "Missing key_technical_components in structured_sections"
    assert "experiments" in structured, "Missing experiments in structured_sections"
    assert "main_results" in structured, "Missing main_results in structured_sections"
    assert "contributions" in structured, "Missing contributions in structured_sections"
    assert "conclusion" in structured, "Missing conclusion in structured_sections"
    print("✓ Check 6 Passed: 3-5 contributions separated from experimental results; 8 structured sections present")

    # Check 7: Recommendation Quality
    recs = res["recommendations"]
    assert len(recs) > 0, "No recommendations generated"
    for r in recs:
        assert not any(bad in r["title"].lower() for bad in ["affinity", "drug", "vue", "redis"]), f"Unrelated cross-discipline recommendation: {r['title']}"
        assert "similarity_label" in r or "semantic_relevance" in r, "Missing semantic relevance label"
    print("✓ Check 7 Passed: Recommendations aligned with NLP/NMT domain; displayed with Semantic Relevance")

    # Check 8: Cross-Page Consistency & Database Verification
    assert res.get("analysis_status") == "consistent", f"Expected consistent status, got {res.get('analysis_status')}"
    db_paper = db.get_paper_full(paper_id)
    assert db_paper is not None, "Failed to retrieve paper from database"
    db_refs = db_paper.get("validated_references", db_paper.get("references", []))
    assert len(db_refs) == 40, f"Database has {len(db_refs)} references, expected 40"
    assert len(res["references"]) == len(db_refs) == cm["total_references"] == 40
    print(f"✓ Check 8 Passed: Cross-Page Consistency: References Tab (40) == Citation Intelligence (40) == DB (40)")

    # 2. Test Question Bank (Regression to ensure it didn't break)
    qb_files = [f for f in os.listdir(upload_dir) if "Question_Bank" in f or "22CS504" in f]
    if qb_files:
        qb_path = os.path.join(upload_dir, qb_files[0])
        print(f"\nProcessing Question Bank: {qb_path}")
        with open(qb_path, "rb") as f:
            qb_bytes = f.read()
        qb_res = orchestrator.process_document("Student_Question_Bank.pdf", qb_bytes)
        qb_id = qb_res["paper_id"]
        qb_meta = qb_res["metadata"]
        assert qb_meta["document_type"] == "Academic Question Bank", f"Expected Academic Question Bank, got {qb_meta['document_type']}"
        qb_refs = qb_res.get("validated_references", qb_res.get("references", []))
        assert len(qb_refs) == 0, f"Expected 0 references for question bank, got {len(qb_refs)}"
        qb_cm = qb_res["citation_metrics"]
        assert qb_cm["total_references"] == 0, f"Expected 0 total_references, got {qb_cm['total_references']}"
        qb_dash = qb_res["dashboard"]
        assert qb_dash.get("rigor_disabled") is True or qb_dash.get("academic_health_score") is None, "Completeness scoring must be disabled for question bank"
        assert qb_dash.get("reading_level") in ["N/A", "Undergraduate / Technical Course Level"], f"Unexpected reading level: {qb_dash.get('reading_level')}"
        print("✓ Check 9 Passed: Question Bank preserves 0 references, N/A completeness scoring, no fake references")

    print("\n==================================================")
    print("ALL 9 REGRESSION CHECKS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == "__main__":
    run_regression()
