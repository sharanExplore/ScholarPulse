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
    log("Starting FastAPI server on port 8899 for Auth Migration Verification...")
    server_process = subprocess.Popen(
        [
            sys.executable,
            "-m", "uvicorn", "main:app",
            "--host", "127.0.0.1",
            "--port", "8899"
        ],
        cwd=os.path.join(os.path.dirname(__file__)),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    # Wait for server to boot
    for _ in range(30):
        time.sleep(0.5)
        status, health = http_req("/api/health")
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
        # TEST 1: Health check - verify Google OAuth is completely removed from health report
        status, health = http_req("/api/health")
        assert_eq("API Health Status Code", status, 200)
        auth_comp = health.get("components", {}).get("auth", {})
        assert_true("Auth component exists", "status" in auth_comp)
        assert_true("No google_configured in auth report", "google_configured" not in auth_comp)
        assert_true("Detail shows Secure Email/Password Authentication", "Email/Password" in auth_comp.get("detail", ""))

        # TEST 2: Old Google endpoints must return 404 Not Found
        status, _ = http_req("/api/auth/google/client-id")
        assert_eq("Old Google client-id endpoint returns 404", status, 404)
        status, _ = http_req("/api/auth/google/url")
        assert_eq("Old Google URL endpoint returns 404", status, 404)
        status, _ = http_req("/api/auth/google/login")
        assert_eq("Old Google login endpoint returns 404", status, 404)
        status, _ = http_req("/api/auth/google/callback")
        assert_eq("Old Google callback endpoint returns 404", status, 404)

        # TEST 3: User Registration via POST /api/auth/register
        test_email = f"researcher_{int(time.time())}@academic.org"
        test_name = "Dr. Ada Lovelace"
        test_pw = "quantum_computing_2026"

        log(f"Registering new user: {test_email}")
        status, reg_res = http_req(
            "/api/auth/register",
            method="POST",
            data={
                "name": test_name,
                "email": test_email,
                "password": test_pw
            }
        )
        assert_eq("Registration HTTP status", status, 201)
        assert_true("Registration success flag", reg_res.get("success") is True)
        assert_true("JWT token returned on registration", bool(reg_res.get("token")))
        user_obj = reg_res.get("user", {})
        assert_eq("User name matches", user_obj.get("name"), test_name)
        assert_eq("User email matches", user_obj.get("email"), test_email)
        assert_eq("Role assigned by backend is strictly 'user'", user_obj.get("role"), "user")
        assert_true("No password hash exposed in response", "password_hash" not in user_obj)
        assert_true("No password exposed in response", "password" not in user_obj)

        normal_token = reg_res.get("token")

        # TEST 4: Attempt registration with duplicate email
        log("Attempting duplicate registration with same email...")
        status, dup_res = http_req(
            "/api/auth/register",
            method="POST",
            data={
                "name": "Imposter Ada",
                "email": test_email,
                "password": "another_password"
            }
        )
        assert_eq("Duplicate email returns HTTP 400", status, 400)
        assert_eq("Duplicate email exact message", dup_res.get("detail"), "An account with this email already exists.")

        # TEST 5: Attempt registration with superuser email (should also be blocked)
        status, sup_dup = http_req(
            "/api/auth/register",
            method="POST",
            data={
                "name": "Super Imposter",
                "email": "admin@scholarpulse.org",
                "password": "fake_password"
            }
        )
        assert_eq("Superuser email blocked from registration", status, 400)
        assert_eq("Superuser duplicate exact message", sup_dup.get("detail"), "An account with this email already exists.")

        # TEST 6: Normal User Login via POST /api/auth/login
        log("Testing normal user login...")
        status, login_res = http_req(
            "/api/auth/login",
            method="POST",
            data={
                "email": test_email,
                "password": test_pw
            }
        )
        assert_eq("Normal user login HTTP status", status, 200)
        assert_true("Login success flag", login_res.get("success") is True)
        assert_true("Login returns token", bool(login_res.get("token")))
        assert_eq("Login returns role 'user'", login_res.get("user", {}).get("role"), "user")
        assert_true("No password_hash in login response", "password_hash" not in login_res.get("user", {}))

        # TEST 7: Login with invalid password
        status, fail_res = http_req(
            "/api/auth/login",
            method="POST",
            data={
                "email": test_email,
                "password": "wrong_password_123"
            }
        )
        assert_eq("Invalid password rejected with 401", status, 401)
        assert_eq("Invalid password detail message", fail_res.get("detail"), "Invalid email or password.")

        # TEST 8: Superuser Login via universal POST /api/auth/login
        log("Testing superuser login with configured credentials...")
        status, super_res = http_req(
            "/api/auth/login",
            method="POST",
            data={
                "email": "admin@scholarpulse.org",
                "password": "scholarpulse_admin_2026!"
            }
        )
        assert_eq("Superuser login HTTP status", status, 200)
        assert_true("Superuser success flag", super_res.get("success") is True)
        assert_true("Superuser token returned", bool(super_res.get("token")))
        superuser_token = super_res.get("token")
        assert_eq("Superuser role verified as 'superuser'", super_res.get("user", {}).get("role"), "superuser")
        assert_true("No password or hash in superuser response", "password_hash" not in super_res.get("user", {}))

        # TEST 9: Normal user blocked from /api/admin/* endpoints (HTTP 403)
        log("Testing normal user RBAC protection on admin endpoints...")
        status, admin_stat_normal = http_req("/api/admin/stats", token=normal_token)
        assert_eq("Normal user blocked on /api/admin/stats with 403 Forbidden", status, 403)

        status, admin_users_normal = http_req("/api/admin/users", token=normal_token)
        assert_eq("Normal user blocked on /api/admin/users with 403 Forbidden", status, 403)

        # TEST 10: Superuser allowed on /api/admin/* endpoints
        log("Testing superuser access to admin endpoints...")
        status, admin_stat_super = http_req("/api/admin/stats", token=superuser_token)
        assert_eq("Superuser access /api/admin/stats HTTP 200", status, 200)
        assert_true("Admin stats returned real metrics", "total_users" in admin_stat_super)
        assert_true("Users count is at least 1", admin_stat_super.get("total_users", 0) >= 1)

        # TEST 11: Normal user data isolation
        status, papers_res = http_req("/api/papers", token=normal_token)
        assert_eq("Normal user papers listing HTTP 200", status, 200)
        assert_true("Normal user starts with clean papers list", isinstance(papers_res.get("papers"), list))

        # TEST 12: Logout endpoint
        status, logout_res = http_req("/api/auth/logout", method="POST", token=normal_token)
        assert_eq("Logout endpoint HTTP 200", status, 200)
        assert_eq("Logout success status", logout_res.get("status"), "success")

        log("\n==========================================")
        log(f"RESULTS: {passed} PASSED, {failed} FAILED")
        log("==========================================")
        return failed == 0

    finally:
        server_process.terminate()
        try:
            server_process.wait(timeout=3)
        except Exception:
            server_process.kill()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
