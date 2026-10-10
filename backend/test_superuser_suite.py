import sys
import os
import time
import json
import urllib.request
import urllib.error
import subprocess

BASE_URL = "http://127.0.0.1:8899"

def log(msg):
    print(f"[TEST] {msg}", flush=True)

def http_req(path, method="GET", data=None, token=None, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {"Content-Type": "application/json"}
    if token:
        req_headers["Authorization"] = f"Bearer {token}"
    if headers:
        req_headers.update(headers)
    
    encoded_data = None
    if data is not None:
        if isinstance(data, (dict, list)):
            encoded_data = json.dumps(data).encode("utf-8")
        elif isinstance(data, bytes):
            encoded_data = data
        elif isinstance(data, str):
            encoded_data = data.encode("utf-8")

    req = urllib.request.Request(url, data=encoded_data, headers=req_headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}
    except Exception as e:
        return 0, {"error": str(e)}

def run_tests():
    log("Starting FastAPI server on port 8899 for comprehensive verification...")
    server_process = subprocess.Popen(
        [
            sys.executable,
            "-m", "uvicorn", "main:app",
            "--host", "127.0.0.1",
            "--port", "8899"
        ],
        cwd=os.path.join(os.path.dirname(__file__), "..", "backend"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Wait for server to boot
    for _ in range(30):
        time.sleep(0.5)
        status, body = http_req("/api/health")
        if status == 200:
            log("FastAPI server is UP and responding!")
            break
    else:
        log("Server failed to start within timeout.")
        server_process.kill()
        return False

    passed = 0
    failed = 0

    def assert_eq(desc, actual, expected):
        nonlocal passed, failed
        if actual == expected:
            log(f"PASS: {desc} (Value: {actual})")
            passed += 1
        else:
            log(f"FAIL: {desc} - Expected: {expected}, Got: {actual}")
            failed += 1

    def assert_true(desc, condition, info=""):
        nonlocal passed, failed
        if condition:
            log(f"PASS: {desc} {info}")
            passed += 1
        else:
            log(f"FAIL: {desc} {info}")
            failed += 1

    try:
        # 1. Health check endpoint
        status, health = http_req("/api/health")
        assert_eq("API Health Status Code", status, 200)
        assert_eq("Health overall status", health.get("status"), "healthy")
        assert_true("Health components exist", "components" in health)

        # 2. Authenticate as Superuser
        log("Authenticating superuser admin@scholarpulse.org...")
        status, login_res = http_req(
            "/api/auth/superuser/login",
            method="POST",
            data={"email": "admin@scholarpulse.org", "password": "scholarpulse_admin_2026!"}
        )
        assert_eq("Superuser login HTTP status", status, 200)
        assert_true("Token returned in login", "token" in login_res)
        superuser_token = login_res.get("token")
        superuser_user = login_res.get("user", {})
        assert_eq("Superuser role verified", superuser_user.get("role"), "superuser")

        # 3. Authenticate / Create normal user for RBAC verification
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
        from database.db import get_user_by_email, create_user_with_password
        from auth import create_jwt_token, hash_password
        
        normal_user = get_user_by_email("researcher@academic.org")
        if not normal_user:
            normal_user = create_user_with_password(
                name="Researcher Normal",
                email="researcher@academic.org",
                password_hash=hash_password("secure_pass_123"),
                role="user"
            )
        normal_token = create_jwt_token(normal_user)

        # 4. RBAC Strict Security Tests - Normal user must NEVER access admin endpoints
        admin_endpoints = [
            ("/api/admin/stats", "GET"),
            ("/api/admin/health", "GET"),
            ("/api/admin/logins/daily", "GET"),
            ("/api/admin/registrations/trend", "GET"),
            ("/api/admin/activity", "GET"),
            ("/api/admin/users", "GET"),
            ("/api/admin/papers", "GET"),
            ("/api/admin/search?q=test", "GET"),
            ("/api/admin/papers/9999", "DELETE"),
        ]
        for ep, meth in admin_endpoints:
            # Unauthenticated: 401
            no_auth_status, _ = http_req(ep, method=meth)
            assert_eq(f"Unauthenticated blocked on {ep}", no_auth_status, 401)

            # Normal user: 403 Forbidden
            norm_status, _ = http_req(ep, method=meth, token=normal_token)
            assert_eq(f"Normal user forbidden (403) on {ep}", norm_status, 403)

        # 5. Top-Level Statistics from Database
        status, stats = http_req("/api/admin/stats", token=superuser_token)
        assert_eq("Superuser fetch /api/admin/stats status", status, 200)
        assert_true("Total users is integer >= 1", isinstance(stats.get("total_users"), int) and stats["total_users"] >= 1, f"Value: {stats.get('total_users')}")
        assert_true("Active users today is integer >= 1", isinstance(stats.get("active_users_today"), int) and stats["active_users_today"] >= 1, f"Value: {stats.get('active_users_today')}")
        assert_true("Total papers is integer >= 0", isinstance(stats.get("total_papers"), int) and stats["total_papers"] >= 0, f"Value: {stats.get('total_papers')}")
        assert_true("Papers analyzed is integer >= 0", isinstance(stats.get("papers_analyzed"), int) and stats["papers_analyzed"] >= 0, f"Value: {stats.get('papers_analyzed')}")
        assert_true("Total references is integer >= 0", isinstance(stats.get("total_references"), int) and stats["total_references"] >= 0, f"Value: {stats.get('total_references')}")
        assert_true("Total recommendations is integer >= 0", isinstance(stats.get("total_recommendations"), int) and stats["total_recommendations"] >= 0, f"Value: {stats.get('total_recommendations')}")
        assert_true("Failed analyses is integer >= 0", isinstance(stats.get("failed_analyses"), int) and stats["failed_analyses"] >= 0, f"Value: {stats.get('failed_analyses')}")
        assert_true("Active sessions is integer >= 1", isinstance(stats.get("active_sessions"), int) and stats["active_sessions"] >= 1, f"Value: {stats.get('active_sessions')}")

        # 6. User Activity Metrics
        user_metrics = stats.get("user_activity", {})
        assert_true("user_activity metrics present", bool(user_metrics))
        assert_true("new_users_today >= 0", user_metrics.get("new_users_today", -1) >= 0)
        assert_true("active_users_this_week >= 1", user_metrics.get("active_users_this_week", -1) >= 1)

        # 7. System Health Component Diagnostics
        status, health_data = http_req("/api/admin/health", token=superuser_token)
        assert_eq("Fetch /api/admin/health status", status, 200)
        components = health_data.get("components", {})
        for comp in ["backend", "database", "auth", "pdf_processing", "ai_analysis"]:
            assert_true(f"Health component '{comp}' checked", comp in components, f"Status: {components.get(comp, {}).get('status')}")

        # 8. Daily Login Monitoring (deduplicated per user per day, 7/30/90 days)
        for days in [7, 30, 90]:
            status, login_res = http_req(f"/api/admin/logins/daily?days={days}", token=superuser_token)
            assert_eq(f"Daily login activity ({days}d) status", status, 200)
            logins_list = login_res.get("logins", [])
            assert_true(f"Daily login activity ({days}d) has points", isinstance(logins_list, list) and len(logins_list) == days)
            # Check today's point has unique user count >= 1
            today_point = logins_list[-1]
            assert_true(f"Today login point has date & unique_users >= 1", today_point.get("unique_users", 0) >= 1, f"Point: {today_point}")

        # 9. User Registration Trend (7/30/90 days)
        for days in [7, 30, 90]:
            status, reg_res = http_req(f"/api/admin/registrations/trend?days={days}", token=superuser_token)
            assert_eq(f"Registration trend ({days}d) status", status, 200)
            trend_list = reg_res.get("trend", [])
            assert_true(f"Registration trend ({days}d) has points", isinstance(trend_list, list) and len(trend_list) == days)

        # 10. System Activity Summary & Recent Activity Timeline
        status, activity_res = http_req("/api/admin/activity?limit=25", token=superuser_token)
        assert_eq("Fetch /api/admin/activity status", status, 200)
        timeline = activity_res.get("activity", [])
        assert_true("Timeline events present", isinstance(timeline, list) and len(timeline) > 0)
        first_event = timeline[0]
        assert_true("Timeline item has action, user, timestamp, status", all(k in first_event for k in ["action", "status", "created_at"]))

        # 11. All Users Table with Filtering & Search
        status, users_res = http_req("/api/admin/users?role=all&date_filter=90days", token=superuser_token)
        assert_eq("Fetch /api/admin/users status", status, 200)
        users_list = users_res.get("users", [])
        assert_true("Users list populated (>=1)", len(users_list) >= 1)
        
        # Test role filter
        status, su_users = http_req("/api/admin/users?role=superuser", token=superuser_token)
        assert_true("Role filter superuser works", all(u["role"] == "superuser" for u in su_users.get("users", [])))

        # Test search filter
        status, searched_users = http_req("/api/admin/users?search=admin@scholarpulse", token=superuser_token)
        assert_true("Search user by email works", len(searched_users.get("users", [])) >= 1)

        # 12. All Research Papers Table with Filtering & Search
        status, papers_res = http_req("/api/admin/papers?status=all&date_filter=90days", token=superuser_token)
        assert_eq("Fetch /api/admin/papers status", status, 200)
        assert_true("All papers list returned", "papers" in papers_res)

        # 13. Global Search Endpoint (Users, Emails, Paper Titles, Authors, References)
        status, search_res = http_req("/api/admin/search?q=admin", token=superuser_token)
        assert_eq("Admin global search status", status, 200)
        assert_true("Search results structure valid", "users" in search_res and "papers" in search_res)

        # 14. Research Workspace Isolation Test:
        # My Research (/api/papers) returns papers owned by superuser
        status, my_papers = http_req("/api/papers", token=superuser_token)
        assert_eq("Superuser fetch /api/papers (My Research) status", status, 200)
        assert_true("My Research returns user paper array", isinstance(my_papers.get("papers"), list))

        # 15. Paper Upload & Processing Pipeline Test
        # Test uploading a synthetic PDF to verify complete document processing and activity logging
        import pymupdf
        
        doc = pymupdf.open()
        page = doc.new_page()
        page.insert_text((50, 72), "Autonomous Attention Networks in Multimodal AI", fontsize=16)
        page.insert_text((50, 100), "Dr. Superuser Admin, ScholarPulse Institute of Artificial Intelligence", fontsize=10)
        page.insert_text((50, 130), "Abstract: We present an advanced graph-based citation intelligence architecture...", fontsize=10)
        page.insert_text((50, 180), "References:", fontsize=12)
        page.insert_text((50, 200), "[1] Vaswani, A. et al. Attention is all you need. NeurIPS 2017.", fontsize=9)
        page.insert_text((50, 220), "[2] Devlin, J. et al. BERT: Pre-training of deep bidirectional transformers. NAACL 2019.", fontsize=9)
        pdf_bytes = doc.tobytes()
        doc.close()

        # Build multipart/form-data for upload
        boundary = "----ScholarPulseFormBoundary12345"
        body_parts = [
            f"--{boundary}\r\n".encode("utf-8"),
            b'Content-Disposition: form-data; name="file"; filename="test_paper.pdf"\r\n',
            b"Content-Type: application/pdf\r\n\r\n",
            pdf_bytes,
            f"\r\n--{boundary}--\r\n".encode("utf-8"),
        ]
        upload_data = b"".join(body_parts)

        log("Testing paper upload by superuser...")
        upload_status, upload_res = http_req(
            "/api/papers/upload",
            method="POST",
            data=upload_data,
            token=superuser_token,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
        )
        assert_eq("Upload paper status", upload_status, 201)
        assert_true("Paper analysis generated", "paper_id" in upload_res)
        new_paper_id = upload_res.get("paper_id")
        assert_true("Document structure/metadata extracted", "metadata" in upload_res)
        assert_true("Summary extracted", bool(upload_res.get("summary")))
        assert_true("References extracted", len(upload_res.get("references", [])) > 0)
        assert_true("Recommendations generated", len(upload_res.get("recommendations", [])) > 0)

        # 16. Verify Paper appears in My Research AND System Papers
        status, updated_my_papers = http_req("/api/papers", token=superuser_token)
        uploaded_in_my = any(p["id"] == new_paper_id for p in updated_my_papers.get("papers", []))
        assert_true("Uploaded paper appears in My Research", uploaded_in_my)

        status, updated_sys_papers = http_req("/api/admin/papers", token=superuser_token)
        uploaded_in_sys = any(p["id"] == new_paper_id for p in updated_sys_papers.get("papers", []))
        assert_true("Uploaded paper appears in System Papers monitoring", uploaded_in_sys)

        # 17. Verify Activity Log has recorded the upload and analysis
        status, act_after_upload = http_req("/api/admin/activity?limit=5", token=superuser_token)
        actions = [a["action"] for a in act_after_upload.get("activity", [])]
        assert_true("Activity log recorded paper_uploaded or analysis", "paper_uploaded" in actions or "paper_analysis_completed" in actions, f"Actions: {actions}")

        # 18. Delete Paper via Admin endpoint (with deletion confirmation check)
        status, del_res = http_req(f"/api/admin/papers/{new_paper_id}", method="DELETE", token=superuser_token)
        assert_eq("Admin delete paper status", status, 200)
        
        # Verify paper is removed
        status, after_del_my = http_req("/api/papers", token=superuser_token)
        assert_true("Paper removed from library after deletion", not any(p["id"] == new_paper_id for p in after_del_my.get("papers", [])))

        # 19. Logout & Session Tracking Test
        log("Testing logout and session termination...")
        logout_status, logout_res = http_req("/api/auth/logout", method="POST", token=superuser_token)
        assert_eq("Logout status code", logout_status, 200)
        assert_true("Logout confirmed in response", logout_res.get("status") == "success")

    finally:
        log("Shutting down test server...")
        server_process.kill()
        server_process.wait()

    log(f"\n==========================================")
    log(f"TEST RUN COMPLETED: {passed} PASSED, {failed} FAILED")
    log(f"==========================================")
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
