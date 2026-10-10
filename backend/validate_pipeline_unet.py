import os
import sys
import json

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from agents.orchestrator import PaperAnalysisOrchestrator

def main():
    pdf_path = os.path.join(backend_dir, "uploads", "f3c1070e-63c8-4dde-a0b8-6b56db56bc4e_input_scholar_pulse.pdf")
    if not os.path.exists(pdf_path):
        print(f"ERROR: PDF not found at {pdf_path}")
        sys.exit(1)

    print(f"Running pipeline on: {pdf_path}")
    orchestrator = PaperAnalysisOrchestrator()
    result = orchestrator.process_paper(pdf_path, "U-Net-Validation-Paper")

    # 1. Metadata Checks
    meta = result.get("metadata", {})
    title = meta.get("title", "")
    authors = meta.get("authors", [])
    abstract = meta.get("abstract", "")
    print("\n--- 1. METADATA ---")
    print(f"Title: {title}")
    print(f"Authors: {authors}")
    print(f"Abstract length: {len(abstract)} chars")
    assert "U-Net" in title, f"Title should contain U-Net, got: {title}"
    assert len(authors) >= 3, f"Expected at least 3 authors, got: {authors}"
    assert "Ronneberger" in str(authors), f"Expected Ronneberger in authors, got: {authors}"
    assert len(abstract) > 100, f"Abstract too short: {len(abstract)}"

    # 2. Reference Extraction Checks
    refs = result.get("references", [])
    val_refs = result.get("validated_references", refs)
    print("\n--- 2. REFERENCES ---")
    print(f"Total References count: {len(refs)}")
    print(f"Validated References count: {len(val_refs)}")
    assert len(refs) == 14, f"Expected exactly 14 references for U-Net, got {len(refs)}"
    assert len(val_refs) == 14, f"Expected exactly 14 validated references, got {len(val_refs)}"

    for r in refs:
        num = r.get("reference_number")
        r_authors = r.get("authors", [])
        r_title = r.get("title", "")
        r_year = r.get("year")
        mentions = r.get("in_text_mention_count", 0)
        print(f"  [{num}] {', '.join(r_authors[:2])} ({r_year}): {r_title[:50]}... | in-text mentions: {mentions}")
        assert num is not None and 1 <= num <= 14, f"Invalid reference number: {num}"
        assert len(r_authors) > 0, f"Missing authors for ref [{num}]"
        assert len(r_title) > 5, f"Missing or too short title for ref [{num}]"
        # Check first author is not lost or malformed
        first_author = r_authors[0]
        assert not first_author.startswith("al.") and not first_author.startswith("et al"), f"Malformed author in ref [{num}]: {first_author}"

    # 3. Citation Extraction Checks
    print("\n--- 3. CITATIONS ---")
    cm = result.get("citation_metrics", {})
    in_text_mentions = cm.get("in_text_mentions", 0)
    total_references = cm.get("total_references", 0)
    print(f"Citation Metrics total_references: {total_references}")
    print(f"Citation Metrics in_text_mentions: {in_text_mentions}")
    print(f"Reference density: {cm.get('reference_density')}")
    assert total_references == 14, f"Citation metrics total_references should be 14, got {total_references}"
    assert in_text_mentions > 0, f"Expected in_text_mentions > 0, got {in_text_mentions}"
    assert in_text_mentions != total_references, "References count and citation mentions count should be separate"

    citation_analysis = result.get("citation_analysis", {})
    in_text_citations = citation_analysis.get("in_text_citations", [])
    print(f"Detailed in-text citation instances recorded: {len(in_text_citations)}")
    for cit in in_text_citations[:5]:
        print(f"  Instance: Ref [{cit.get('reference_number')}] on page {cit.get('source_page')}: context='{cit.get('context')[:60]}...'")
        assert cit.get("reference_number") in range(1, 15), f"Citation maps to invalid ref: {cit.get('reference_number')}"
        assert cit.get("source_page") is not None, "Missing source_page in citation"
        assert cit.get("context") is not None, "Missing context in citation"

    # 4. Summary & Contributions Checks
    print("\n--- 4. SUMMARY & CONTRIBUTIONS ---")
    summary = result.get("summary", {})
    exec_summary = summary.get("executive_summary", "")
    key_findings = summary.get("key_findings", [])
    structured_facets = summary.get("structured_facets", {})
    contributions = structured_facets.get("contributions", [])
    
    print(f"Executive Summary length: {len(exec_summary)} chars")
    print(f"Executive Summary preview:\n{exec_summary[:300]}...\n")
    print(f"Key Findings / Contributions count: {len(contributions)}")
    for i, c in enumerate(contributions):
        claim = c.get("claim", str(c)) if isinstance(c, dict) else str(c)
        print(f"  Contribution {i+1}: {claim}")

    # Verify abstract is NOT copied as executive summary
    assert exec_summary != abstract, "Executive summary must not be identical to abstract!"
    # Verify summary synthesizes method, architecture/experiments, and results
    exec_lower = exec_summary.lower()
    has_method_or_arch = any(w in exec_lower for w in ["architecture", "contracting", "expansive", "convolutional", "u-net", "network"])
    has_results_or_exp = any(w in exec_lower for w in ["segmentation", "challenge", "isbi", "result", "electron", "cell", "iou", "warping"])
    assert has_method_or_arch, "Executive summary missing method/architecture synthesis"
    assert has_results_or_exp, "Executive summary missing results/experiments synthesis"

    # Verify NO figure captions, equations, or section headings in contributions
    for c in contributions:
        claim = c.get("claim", str(c)) if isinstance(c, dict) else str(c)
        assert not claim.lower().startswith("fig"), f"Figure caption leaked as contribution: {claim}"
        assert not claim.lower().startswith("table"), f"Table caption leaked as contribution: {claim}"
        assert not claim.lower().startswith("section"), f"Section header leaked as contribution: {claim}"
        assert not claim.lower().startswith("2 network"), f"Section header leaked as contribution: {claim}"
        assert not claim.lower().startswith("3 training"), f"Section header leaked as contribution: {claim}"
        assert "∑" not in claim and "Ω" not in claim and "∈" not in claim, f"Equation leaked as contribution: {claim}"
        assert "pℓ" not in claim and "ak(x)" not in claim, f"Equation leaked as contribution: {claim}"

    # 5. Keyword Extraction Checks
    print("\n--- 5. KEYWORDS ---")
    keywords = result.get("keywords", [])
    kw_names = [k.get("keyword") for k in keywords]
    print(f"Extracted {len(keywords)} keywords:")
    for k in keywords:
        print(f"  - {k.get('keyword')} ({k.get('category')}, score: {k.get('relevance_score')}) [p.{k.get('page_number')}, {k.get('section')}]")

    # Verify no duplicates
    assert len(kw_names) == len(set(k.lower() for k in kw_names)), "Keywords contain duplicates!"

    # Verify no author names
    for auth in authors:
        for part in auth.split():
            if len(part) > 2:
                assert part.lower() not in [k.lower() for k in kw_names], f"Author name '{part}' leaked into keywords!"

    # Check for expected technical concepts from U-Net prompt
    target_concepts = [
        "u-net",
        "biomedical image segmentation",
        "convolutional networks",
        "contracting path",
        "expansive path",
        "data augmentation",
        "elastic deformation",
        "weighted loss",
        "cell segmentation",
        "iou"
    ]
    matched_targets = []
    kw_lower_set = set(k.lower() for k in kw_names)
    for target in target_concepts:
        found = any(target in k.lower() or k.lower() in target for k in kw_names)
        if found:
            matched_targets.append(target)
            print(f"  ✓ Matched target concept: '{target}'")
        else:
            print(f"  ✗ Missing target concept: '{target}'")

    print(f"Matched {len(matched_targets)} of {len(target_concepts)} expected concepts.")
    assert len(matched_targets) >= 8, f"Expected at least 8/10 target concepts matched, got {len(matched_targets)}: {matched_targets}"

    # 6. Single Source of Truth Checks
    print("\n--- 6. SINGLE SOURCE OF TRUTH ---")
    dashboard = result.get("dashboard", {})
    stats = dashboard.get("stats", {})
    dash_refs = stats.get("references_count")
    print(f"Dashboard stats references_count: {dash_refs}")
    print(f"Pipeline root references count: {len(refs)}")
    print(f"Pipeline root validated_references count: {len(val_refs)}")
    print(f"Citation metrics total_references: {cm.get('total_references')}")

    assert dash_refs == len(refs) == len(val_refs) == cm.get("total_references") == 14, (
        f"Mismatch across pipeline! dash_refs={dash_refs}, refs={len(refs)}, val_refs={len(val_refs)}, cm={cm.get('total_references')}"
    )
    print("✓ Single source of truth verified: all components report exactly 14 references.")

    print("\n==========================================")
    print("ALL VALIDATION CRITERIA PASSED FOR U-NET!")
    print("==========================================")

if __name__ == "__main__":
    main()
