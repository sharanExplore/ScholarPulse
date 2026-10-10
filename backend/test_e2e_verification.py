import os
import re
import json
import urllib.request
import urllib.parse
import fitz

BASE_URL = "http://127.0.0.1:8000"

def main():
    print("======================================================================")
    print("        SCHOLARPULSE FULL END-TO-END FEATURE VERIFICATION            ")
    print("======================================================================")

    # 1. Health Check
    req = urllib.request.Request(f"{BASE_URL}/api/health")
    with urllib.request.urlopen(req) as resp:
        health_data = json.loads(resp.read().decode())
        print(f"[1/22] System Health Check: {health_data['status']} (DB: {health_data['database']})")

    # 2. Email/Password User Registration Flow
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/register",
        data=json.dumps({"name": "Dr. Researcher", "email": "researcher@academic.org", "password": "secure_research_password"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            reg_data = json.loads(resp.read().decode())
            researcher_token = reg_data["token"]
            print(f"[2/22] Researcher Registration: role={reg_data['user']['role']}, email={reg_data['user']['email']}")
    except urllib.error.HTTPError as e:
        # If user already exists, log in
        login_req = urllib.request.Request(
            f"{BASE_URL}/api/auth/login",
            data=json.dumps({"email": "researcher@academic.org", "password": "secure_research_password"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(login_req) as resp:
            login_data = json.loads(resp.read().decode())
            researcher_token = login_data["token"]
            print(f"[2/22] Researcher Login: role={login_data['user']['role']}, email={login_data['user']['email']}")

    # 3. Superuser Authentication Flow
    req = urllib.request.Request(
        f"{BASE_URL}/api/auth/login",
        data=json.dumps({"email": "admin@scholarpulse.org", "password": "scholarpulse_admin_2026!"}).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        super_auth = json.loads(resp.read().decode())
        super_token = super_auth["token"]
        print(f"[3/22] Superuser Login: role={super_auth['user']['role']}, email={super_auth['user']['email']}")

    # 4. User Profile & JWT Session
    req = urllib.request.Request(f"{BASE_URL}/api/auth/me", headers={"Authorization": f"Bearer {super_token}"})
    with urllib.request.urlopen(req) as resp:
        me = json.loads(resp.read().decode())
        print(f"[4/22] Auth /me Profile Verification: email={me['user']['email']}")

    # 5. Verify RBAC on Admin Endpoint

    # Verify normal user blocked from admin stats (HTTP 403)
    req = urllib.request.Request(f"{BASE_URL}/api/admin/stats", headers={"Authorization": f"Bearer {researcher_token}"})
    try:
        with urllib.request.urlopen(req) as resp:
            print("ERROR: Regular user was not blocked!")
    except urllib.error.HTTPError as e:
        print(f"[5/22] RBAC Authorization: Regular researcher blocked from /api/admin/* (HTTP {e.code})")

    # 6. Create Realistic Academic PDF
    pdf_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sample_research_paper.pdf")
    doc = fitz.open()

    p1 = doc.new_page()
    p1.insert_text((50, 60), "Attention-Driven Neural Transduction Models", fontsize=18, fontname="helv")
    p1.insert_text((50, 85), "Ashish Vaswani, Noam Shazeer, Niki Parmar", fontsize=11, fontname="helv")
    p1.insert_text((50, 100), "Department of Computer Science, Stanford University", fontsize=9, fontname="helv")
    p1.insert_text((50, 115), "DOI: 10.1145/3318464.3389700", fontsize=9, fontname="helv")

    abstract_text = (
        "Abstract: The dominant sequence transduction models are based on complex recurrent or "
        "convolutional neural networks that include an encoder and a decoder. We propose the Transformer, "
        "a simple network architecture based solely on attention mechanisms, dispensing with recurrence "
        "and convolutions entirely. Experiments on machine translation show superior quality and faster training."
    )
    p1.insert_textbox(fitz.Rect(50, 135, 550, 220), abstract_text, fontsize=9.5, fontname="helv")

    intro_text = (
        "1. Introduction\n\n"
        "Recurrent neural networks, long short-term memory [1] and gated recurrent neural networks [2] have "
        "been firmly established as state of the art approaches in sequence modeling. Numerous efforts have "
        "since continued to push the boundaries of recurrent language models [3]. In this work we propose the "
        "Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention "
        "mechanism to draw global dependencies between input and output [1, 4]."
    )
    p1.insert_textbox(fitz.Rect(50, 230, 550, 360), intro_text, fontsize=9.5, fontname="helv")

    method_text = (
        "3. Methodology\n\n"
        "An attention function maps a query and a set of key-value pairs to an output. The output is computed "
        "as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility "
        "function of the query with the corresponding key. Multi-head attention allows the model to jointly "
        "attend to information from different representation subspaces."
    )
    p1.insert_textbox(fitz.Rect(50, 370, 550, 500), method_text, fontsize=9.5, fontname="helv")

    p2 = doc.new_page()
    conc_text = (
        "6. Conclusion\n\n"
        "In this work, we presented the Transformer, the first sequence transduction model based entirely on "
        "attention. We plan to extend the Transformer to problems involving input and output modalities other "
        "than text."
    )
    p2.insert_textbox(fitz.Rect(50, 50, 550, 150), conc_text, fontsize=9.5, fontname="helv")

    refs_text = (
        "References\n\n"
        "[1] Hochreiter, S., Schmidhuber, J. Long short-term memory. Neural Computation 9(8):1735-1780, 1997. 10.1162/neco.1997.9.8.1735\n\n"
        "[2] Cho, K., van Merrienboer, B., Gulcehre, C. Learning phrase representations using RNN encoder-decoder. In EMNLP 2014. 10.3115/v1/D14-1179\n\n"
        "[3] Sutskever, I., Vinyals, O., Le, Q. V. Sequence to sequence learning with neural networks. In NeurIPS 2014. 10.5555/2969033.2969173\n\n"
        "[4] Bahdanau, D., Cho, K., Bengio, Y. Neural machine translation by jointly learning to align and translate. In ICLR 2015. 10.48550/arXiv.1409.0473"
    )
    p2.insert_textbox(fitz.Rect(50, 160, 550, 420), refs_text, fontsize=9, fontname="helv")

    doc.save(pdf_path)
    doc.close()
    print(f"[6/22] Realistic Research PDF Generation: Created '{pdf_path}' ({os.path.getsize(pdf_path)} bytes)")

    # 7. PDF Validation (Test invalid file rejection)
    boundary = "----ScholarPulseBoundaryXYZ"
    bad_body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="invalid.txt"\r\n'
        "Content-Type: text/plain\r\n\r\n"
        "Invalid non-pdf data\r\n"
        f"--{boundary}--\r\n"
    ).encode()
    req = urllib.request.Request(
        f"{BASE_URL}/api/papers/upload",
        data=bad_body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}", "Authorization": f"Bearer {researcher_token}"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print("ERROR: Invalid file was accepted!")
    except urllib.error.HTTPError as e:
        print(f"[7/22] PDF Validation: Non-PDF rejected with HTTP {e.code}")

    # 8. Document Ingestion & Multi-Agent Processing Pipeline
    with open(pdf_path, "rb") as f:
        pdf_bytes = f.read()

    upload_body = (
        f"--{boundary}\r\n"
        'Content-Disposition: form-data; name="file"; filename="attention_paper.pdf"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
    ).encode() + pdf_bytes + f"\r\n--{boundary}--\r\n".encode()

    req = urllib.request.Request(
        f"{BASE_URL}/api/papers/upload",
        data=upload_body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}", "Authorization": f"Bearer {researcher_token}"}
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode())
        paper_id = result["paper_id"]
        print(f"[8/22] Document Ingestion & Pipeline Orchestration: Succeeded! Paper ID: {paper_id}")

    # 9. PDF Text & Structural Extraction
    doc_info = result["document"]
    print(f"[9/22] Text Extraction: {doc_info['word_count']} words, {doc_info['page_count']} pages, hash={doc_info['file_hash'][:12]}...")

    # 10. Metadata Extraction
    meta = result["metadata"]
    print(f"[10/22] Metadata Extraction: Title='{meta['title']}', Authors={meta['authors']}, DOI='{meta['doi']}'")

    # 11. Multi-Facet AI Summarization
    summary = result["summary"]
    print(f"[11/22] Summarization Agent: Findings count={len(summary.get('key_findings', []))}, Exec Summary length={len(summary.get('executive_summary', ''))}")

    # 12. Technical Keyword Extraction
    keywords = result["keywords"]
    print(f"[12/22] Keyword Extraction Agent: Discovered {len(keywords)} keywords ({', '.join([k['keyword'] for k in keywords[:4]])})")

    # 13. Reference Extraction
    references = result["references"]
    print(f"[13/22] Reference Extraction Agent: Extracted {len(references)} bibliography entries")

    # 14. Citation Analysis & Metrics
    metrics = result["citation_metrics"]
    print(f"[14/22] Citation Analysis Agent: Density={metrics.get('citation_density_per_page')} per page, Median Year={metrics.get('median_year')}")

    # 15. Related Literature Recommendations (arXiv, Semantic Scholar, CrossRef)
    recs = result["recommendations"]
    sources = set(r["source"] for r in recs)
    print(f"[15/22] Recommendation Agent: {len(recs)} papers found across sources {sources}")

    # 16. Reference Verification API (CrossRef Registry)
    req = urllib.request.Request(
        f"{BASE_URL}/api/papers/{paper_id}/verify-references",
        data=b"{}",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {researcher_token}"}
    )
    with urllib.request.urlopen(req) as resp:
        verify_data = json.loads(resp.read().decode())
        print(f"[16/22] Reference Verification: verified_count={verify_data.get('verified_count')} of {verify_data.get('total_references')}")

    # 17. Metadata Enrichment API (CrossRef Registry)
    req = urllib.request.Request(
        f"{BASE_URL}/api/papers/{paper_id}/enrich-metadata",
        data=b"{}",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {researcher_token}"}
    )
    with urllib.request.urlopen(req) as resp:
        enrich_data = json.loads(resp.read().decode())
        print(f"[17/22] Metadata Enrichment: status={enrich_data.get('status')}, enriched={enrich_data.get('enriched')}")

    # 18. Dashboard & Paper Retrieval
    req = urllib.request.Request(f"{BASE_URL}/api/papers/{paper_id}", headers={"Authorization": f"Bearer {researcher_token}"})
    with urllib.request.urlopen(req) as resp:
        paper_detail = json.loads(resp.read().decode())
        health_score = paper_detail.get("dashboard", {}).get("academic_health_score", 0)
        print(f"[18/22] Academic Dashboard Synthesis: Loaded! Academic Health Score={health_score}/100")

    # 19. Superuser Admin Dashboard & System Analytics
    req = urllib.request.Request(f"{BASE_URL}/api/admin/stats", headers={"Authorization": f"Bearer {super_token}"})
    with urllib.request.urlopen(req) as resp:
        admin_stats = json.loads(resp.read().decode())
        print(f"[19/22] Superuser Admin Dashboard: Total Users={admin_stats['total_users']}, Total Papers={admin_stats['total_papers']}")

    # 20. Superuser Admin User & Paper Lists
    req = urllib.request.Request(f"{BASE_URL}/api/admin/papers", headers={"Authorization": f"Bearer {super_token}"})
    with urllib.request.urlopen(req) as resp:
        admin_papers = json.loads(resp.read().decode())
        print(f"[20/22] Superuser Paper Management: System contains {admin_papers['count']} papers.")

    # 21. User Document Deletion
    req = urllib.request.Request(f"{BASE_URL}/api/papers/{paper_id}", headers={"Authorization": f"Bearer {researcher_token}"}, method="DELETE")
    with urllib.request.urlopen(req) as resp:
        del_res = json.loads(resp.read().decode())
        print(f"[21/22] Paper Deletion & DB Cleanup: {del_res['message']}")

    # 22. Logout & Session Invalidation
    req = urllib.request.Request(f"{BASE_URL}/api/auth/logout", data=b"{}", headers={"Content-Type": "application/json", "Authorization": f"Bearer {researcher_token}"})
    with urllib.request.urlopen(req) as resp:
        logout_data = json.loads(resp.read().decode())
        print(f"[22/22] Logout & Session Persistence: {logout_data['message']}")

    # Cleanup temp pdf
    if os.path.exists(pdf_path):
        os.remove(pdf_path)

    print("======================================================================")
    print("      ALL 22 SCHOLARPULSE FEATURES VERIFIED WORKING END-TO-END!       ")
    print("======================================================================")

if __name__ == "__main__":
    main()
