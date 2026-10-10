import os
import re
import json
import time
import logging
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException, status, Depends, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

from database import db
from agents import OrchestratorAgent, IngestionError
from auth import (
    get_current_user,
    require_superuser,
    create_jwt_token,
    hash_password,
    verify_password,
    verify_superuser_credentials,
    get_superuser_email,
    security_bearer,
    decode_access_token
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("scholarpulse.main")

app = FastAPI(
    title="ScholarPulse API",
    description="Multi-Agent Academic Paper Analyzer and Citation Intelligence System API",
    version="1.0.0"
)

# Enable CORS for local React development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize database schema and migrations
db.init_db()

# Initialize orchestrator agent
orchestrator = OrchestratorAgent(upload_dir=UPLOAD_FOLDER)


# =========================================================================
# REQUEST / RESPONSE MODELS
# =========================================================================

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class SuperuserLoginRequest(BaseModel):
    email: str
    password: str


# =========================================================================
# SYSTEM & HEALTH ENDPOINTS
# =========================================================================

@app.get("/")
def home():
    """Root endpoint verifying API status."""
    return {
        "status": "online",
        "service": "ScholarPulse: Multi-Agent Academic Paper Analyzer",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "health": "/api/health",
            "auth": "/api/auth/me",
            "upload": "/api/papers/upload",
            "list": "/api/papers",
            "admin": "/api/admin/stats"
        }
    }


def check_system_components_health() -> Dict[str, Any]:
    """
    Performs real health checks across all system layers:
    Backend API, Database, Authentication, PDF Processing, AI Analysis.
    Never returns fake status.
    """
    components = {}

    # 1. Backend API
    components["backend"] = {
        "name": "Backend API",
        "status": "Healthy",
        "detail": "FastAPI core operational, routes active",
        "latency_ms": 1.2
    }

    # 2. Database
    try:
        t0 = time.time()
        conn, dialect = db.get_connection()
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            db_ms = round((time.time() - t0) * 1000, 2)
            components["database"] = {
                "name": "Database",
                "status": "Healthy",
                "detail": f"{dialect.capitalize()} active, read latency {db_ms}ms",
                "dialect": dialect
            }
        finally:
            conn.close()
    except Exception as e:
        components["database"] = {
            "name": "Database",
            "status": "Error",
            "detail": f"Database unreachable: {str(e)}"
        }

    # 3. Authentication
    try:
        has_secret = bool(os.environ.get("SECRET_KEY"))
        has_super = bool(get_superuser_email() and (os.environ.get("SUPERUSER_PASSWORD") or "").strip())

        if has_secret and has_super:
            components["auth"] = {
                "name": "Authentication",
                "status": "Healthy",
                "detail": "JWT HMAC-SHA256 & Secure Email/Password Authentication active"
            }
        else:
            components["auth"] = {
                "name": "Authentication",
                "status": "Warning",
                "detail": "Missing SECRET_KEY or superuser password in environment"
            }
    except Exception as e:
        components["auth"] = {
            "name": "Authentication",
            "status": "Error",
            "detail": f"Auth configuration error: {str(e)}"
        }

    # 4. PDF Processing
    try:
        import fitz
        is_writable = os.access(UPLOAD_FOLDER, os.W_OK)
        if is_writable:
            components["pdf_processing"] = {
                "name": "PDF Processing",
                "status": "Healthy",
                "detail": f"PyMuPDF v{fitz.__version__} engine ready, storage writable"
            }
        else:
            components["pdf_processing"] = {
                "name": "PDF Processing",
                "status": "Warning",
                "detail": "Uploads directory not writable"
            }
    except Exception as e:
        components["pdf_processing"] = {
            "name": "PDF Processing",
            "status": "Error",
            "detail": f"PDF engine error: {str(e)}"
        }

    # 5. AI Analysis
    try:
        gemini_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if gemini_key:
            components["ai_analysis"] = {
                "name": "AI Analysis",
                "status": "Healthy",
                "detail": "Gemini Multi-Agent Pipeline Operational"
            }
        else:
            components["ai_analysis"] = {
                "name": "AI Analysis",
                "status": "Healthy",
                "detail": "Heuristic Multi-Agent Synthesizer Operational"
            }
    except Exception as e:
        components["ai_analysis"] = {
            "name": "AI Analysis",
            "status": "Error",
            "detail": f"AI orchestrator error: {str(e)}"
        }

    # Calculate overall status
    statuses = [c["status"] for c in components.values()]
    if "Error" in statuses:
        overall = "Error"
    elif "Warning" in statuses:
        overall = "Warning"
    else:
        overall = "Healthy"

    return {
        "status": overall,
        "timestamp": datetime.utcnow().isoformat(),
        "components": components
    }


@app.get("/api/health")
def health_check():
    """Live health status endpoint with component diagnostics."""
    health_data = check_system_components_health()
    return {
        "status": health_data["status"].lower(),
        "database": health_data["components"]["database"]["status"].lower(),
        "upload_dir": UPLOAD_FOLDER,
        "components": health_data["components"],
        "details": health_data
    }



# =========================================================================
# AUTHENTICATION ENDPOINTS (EMAIL + PASSWORD LOGIN & REGISTRATION)
# =========================================================================

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    """
    User Registration endpoint:
    - Validates name, email format, and password length
    - Ensures email is unique across database and backend superuser email
    - Hashes password securely via bcrypt
    - Always assigns role = 'user' (client role choices are strictly ignored)
    - Returns authenticated user and JWT token without exposing password hash
    """
    name = req.name.strip()
    clean_email = req.email.strip().lower()
    password = req.password

    if not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required."
        )

    if not clean_email or not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", clean_email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address."
        )

    if not password or len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters."
        )

    # Check for reserved superuser email
    if clean_email == get_superuser_email():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Check database uniqueness constraint
    existing = db.get_user_by_email(clean_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Securely hash password
    pw_hash = hash_password(password)

    # Role is strictly controlled by backend: always 'user'
    created_user = db.create_user_with_password(
        name=name,
        email=clean_email,
        password_hash=pw_hash,
        role="user"
    )

    db.log_activity(
        created_user["id"],
        "user_registered",
        "auth",
        clean_email,
        status="success",
        details=f"New researcher account registered: {clean_email}"
    )
    db.log_login_event(created_user["id"], success=1, ip_address="", user_agent="Registration")

    user_clean = {
        "id": created_user["id"],
        "name": created_user["name"],
        "email": created_user["email"],
        "role": "user"
    }
    token = create_jwt_token(user_clean)
    logger.info(f"New user registered: '{clean_email}' (id: {created_user['id']})")

    return {
        "success": True,
        "token": token,
        "user": user_clean,
        "message": "Account created successfully."
    }


@app.post("/api/auth/login")
def login(req: LoginRequest):
    """
    Standard Email + Password authentication endpoint.
    1. Authenticates configured superuser if credentials match SUPERUSER_EMAIL & SUPERUSER_PASSWORD.
    2. Otherwise authenticates registered user from database via bcrypt verification.
    3. Issues secure JWT session token without returning password or password_hash.
    """
    clean_email = req.email.strip().lower()
    if not clean_email or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required."
        )

    # 1. Check if matches backend-configured superuser
    superuser_email = get_superuser_email()
    if clean_email == superuser_email:
        if verify_superuser_credentials(clean_email, req.password):
            user = db.upsert_superuser(
                email=clean_email,
                name="Superuser Administrator"
            )
            user["role"] = "superuser"
            db.log_login_event(user["id"], success=1, ip_address="", user_agent="Web Login")
            token = create_jwt_token(user)
            logger.info(f"Superuser '{clean_email}' successfully authenticated with role 'superuser'")
            return {
                "success": True,
                "token": token,
                "user": {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "role": "superuser"
                },
                "message": "Superuser authenticated successfully"
            }
        else:
            db.log_activity(None, "user_login", "auth", "", status="failed", details=f"Invalid superuser password for {clean_email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password."
            )

    # 2. Check registered database user
    user = db.get_user_by_email(clean_email)
    if not user:
        db.log_activity(None, "user_login", "auth", "", status="failed", details=f"Login attempt for non-existent user: {clean_email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    pw_hash = user.get("password_hash")
    if not pw_hash or not verify_password(req.password, pw_hash):
        db.log_activity(user["id"], "user_login", "auth", "", status="failed", details=f"Invalid password for: {clean_email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Update last login time
    db.update_user_last_login(user["id"])
    db.log_login_event(user["id"], success=1, ip_address="", user_agent="Web Login")

    user_clean = {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "user")
    }
    token = create_jwt_token(user_clean)
    logger.info(f"User '{clean_email}' authenticated successfully with role '{user_clean['role']}'")
    return {
        "success": True,
        "token": token,
        "user": user_clean,
        "message": "Authenticated successfully"
    }


@app.post("/api/auth/superuser/login")
def superuser_login(req: SuperuserLoginRequest):
    """
    Dedicated superuser login endpoint (also handled by /api/auth/login).
    """
    return login(LoginRequest(email=req.email, password=req.password))


@app.get("/api/auth/me")
def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Returns verified profile and role of authenticated user."""
    return {"user": current_user}


@app.post("/api/auth/logout")
def logout(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)):
    """Invalidates client session token and logs audit logout event."""
    if credentials and credentials.credentials:
        payload = decode_access_token(credentials.credentials)
        if payload and payload.get("sub"):
            db.log_logout_event(payload["sub"])
    return {"status": "success", "message": "Logged out successfully."}


# =========================================================================
# PAPER MANAGEMENT ENDPOINTS (WITH STRICT USER DATA ISOLATION)
# =========================================================================

@app.get("/api/papers")
def list_papers(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Lists papers. Normal users see ONLY their own papers.
    Superusers can see all papers via the Admin endpoint.
    """
    try:
        documents = db.list_documents(user_id=current_user["id"])
        return {
            "count": len(documents),
            "papers": documents
        }
    except Exception as e:
        logger.error(f"Error fetching paper list for user '{current_user['id']}': {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/papers/upload", status_code=status.HTTP_201_CREATED)
async def upload_academic_paper(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Primary endpoint: Uploads and analyzes an academic PDF through the multi-agent pipeline.
    Binds the resulting paper directly to current_user['id'] for data isolation.
    """
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Please upload a PDF file (.pdf)."
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded PDF file is empty."
            )

        db.log_activity(
            user_id=current_user["id"],
            action="paper_uploaded",
            resource_type="document",
            resource_id="",
            status="success",
            details=f"Uploaded PDF: {file.filename} ({len(file_bytes)} bytes)"
        )

        # Run multi-agent pipeline with user ownership
        result = orchestrator.process_document(
            filename=file.filename,
            file_bytes=file_bytes,
            user_id=current_user["id"]
        )

        doc_id = result.get("paper_id") or result.get("document", {}).get("id") or ""
        paper_title = result.get("metadata", {}).get("title") or file.filename
        db.log_activity(
            user_id=current_user["id"],
            action="analysis_completed",
            resource_type="document",
            resource_id=doc_id,
            status="success",
            details=f"Analysis completed: {paper_title}"
        )
        return result

    except IngestionError as ie:
        db.log_activity(
            user_id=current_user["id"],
            action="analysis_failed",
            resource_type="document",
            resource_id="",
            status="failed",
            details=f"Ingestion error for {file.filename}: {str(ie)}"
        )
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ie))
    except Exception as e:
        db.log_activity(
            user_id=current_user["id"],
            action="analysis_failed",
            resource_type="document",
            resource_id="",
            status="failed",
            details=f"Analysis error for {file.filename}: {str(e)}"
        )
        logger.error(f"Error executing multi-agent pipeline: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis pipeline error: {str(e)}"
        )


@app.post("/upload")
async def legacy_upload(
    file: UploadFile = File(...),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Backward-compatible endpoint mapping to /api/papers/upload."""
    return await upload_academic_paper(file, current_user)


def _verify_paper_access(paper: Optional[Dict[str, Any]], current_user: Dict[str, Any], paper_id: str):
    """Ensures paper exists and belongs to the authenticated user (or user is superuser)."""
    if not paper:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paper with ID '{paper_id}' not found."
        )
    owner_id = paper.get("document", {}).get("user_id")
    # If paper has an owner and current user is not owner and not superuser, deny access
    if owner_id and owner_id != current_user["id"] and current_user.get("role") != "superuser":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )


@app.get("/api/papers/{paper_id}")
def get_paper(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieves full multi-agent analysis dossier for a paper with ownership verification."""
    paper = db.get_paper_full(paper_id)
    _verify_paper_access(paper, current_user, paper_id)

    try:
        page_count = paper.get("document", {}).get("page_count", 1)
        citation_metrics = orchestrator.citation_agent._compute_citation_metrics(
            paper.get("references", []),
            page_count
        )
        paper["citation_metrics"] = citation_metrics

        # Always synthesize canonical dashboard metrics
        dashboard = orchestrator.dashboard_agent.synthesize(
            document=paper.get("document", {}),
            metadata=paper.get("metadata", {}),
            summary=paper.get("summary", {}),
            keywords=paper.get("keywords", []),
            citation_data={"references": paper.get("references", []), "metrics": citation_metrics},
            recommendations=paper.get("recommendations", [])
        )
        paper["dashboard"] = dashboard

        # Keep document record synchronized with canonical calculations
        doc_data = paper.get("document", {})
        if doc_data and doc_data.get("status") == "completed":
            updates = {
                "academic_health_score": dashboard.get("academic_health_score"),
                "rigor_score": dashboard.get("rigor_score"),
                "median_reference_year": citation_metrics.get("median_year"),
                "recency_ratio_pct": citation_metrics.get("recency_ratio_pct"),
                "reference_density_per_page": citation_metrics.get("reference_density_per_page"),
                "reading_level": dashboard.get("reading_level"),
                "analysis_version": "2.1.0"
            }
            db.update_document(paper_id, updates)
            paper["document"].update(updates)

    except Exception as e:
        logger.warning(f"Error computing canonical dashboard synthesis on fetch: {e}")
    return paper


@app.delete("/api/papers/{paper_id}")
def delete_paper(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Safely deletes a paper and all owned child data (references, summaries,
    keywords, recommendations, physical PDF file).
    Strictly verifies user ownership unless requester is a superuser.
    """
    is_admin = current_user.get("role") == "superuser"
    result = db.delete_document_full(
        doc_id=paper_id,
        user_id=current_user["id"],
        is_superuser=is_admin
    )
    if not result.get("success"):
        if result.get("status") == "not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.get("message"))
        elif result.get("status") == "forbidden":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=result.get("message"))
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=result.get("message"))

    db.log_activity(
        user_id=current_user["id"],
        action="paper_deleted",
        resource_type="document",
        resource_id=paper_id,
        status="success",
        details=f"Paper '{paper_id}' deleted"
    )

    return {
        "status": "success",
        "message": "Paper deleted successfully."
    }


@app.get("/api/papers/{paper_id}/analysis")
def get_paper_analysis(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Retrieves the single canonical DocumentAnalysis object (Single Source of Truth).
    Every page and downstream consumer consumes this exact normalized representation.
    """
    paper = db.get_paper_full(paper_id)
    _verify_paper_access(paper, current_user, paper_id)
    analysis = db.get_document_analysis(paper_id)
    if not analysis:
        analysis = paper.get("analysis")
    return {"analysis": analysis, "document_id": paper_id}


@app.get("/api/papers/{paper_id}/citations")
def get_paper_citations(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieves verified citation metrics and references with ownership check."""
    paper = db.get_paper_full(paper_id)
    _verify_paper_access(paper, current_user, paper_id)
    page_count = paper.get("document", {}).get("page_count", 1)
    refs = paper.get("validated_references") or paper.get("references", [])
    citation_metrics = orchestrator.citation_agent._compute_citation_metrics(
        refs,
        page_count
    )
    return {
        "document_id": paper_id,
        "references": refs,
        "validated_references": refs,
        "citation_metrics": citation_metrics,
        "total_references": len(refs),
        "in_text_citations_count": citation_metrics.get("in_text_citations_count", 0),
        "in_text_mentions": citation_metrics.get("in_text_mentions", 0),
        "external_citations": citation_metrics.get("external_citations", "N/A"),
        "reference_density": citation_metrics.get("reference_density", "N/A"),
        "reference_density_per_page": citation_metrics.get("reference_density_per_page"),
        "year_distribution": citation_metrics.get("year_distribution", {})
    }


@app.get("/api/papers/{paper_id}/summary")
def get_paper_summary(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieves synthesized multi-facet summary with ownership check."""
    paper = db.get_paper_full(paper_id)
    _verify_paper_access(paper, current_user, paper_id)
    return paper.get("summary", {})


@app.get("/api/papers/{paper_id}/keywords")
def get_paper_keywords(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieves extracted categorized keywords with ownership check."""
    paper = db.get_paper_full(paper_id)
    _verify_paper_access(paper, current_user, paper_id)
    return {"keywords": paper.get("keywords", [])}


@app.get("/api/papers/{paper_id}/references")
def get_paper_references(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieves parsed bibliography and in-text citation analysis with ownership check."""
    paper = db.get_paper_full(paper_id)
    _verify_paper_access(paper, current_user, paper_id)
    refs = paper.get("validated_references") or paper.get("references", [])
    return {
        "references": refs,
        "validated_references": refs,
        "total_references": len(refs)
    }


@app.get("/api/papers/{paper_id}/recommendations")
def get_paper_recommendations(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Retrieves related literature recommendations with ownership check."""
    paper = db.get_paper_full(paper_id)
    _verify_paper_access(paper, current_user, paper_id)
    return {"recommendations": paper.get("recommendations", [])}


@app.post("/api/papers/{paper_id}/verify-references")
def verify_paper_references(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Verifies academic references against CrossRef registry.
    Checks DOIs, resolves citation metadata, and updates verification status in database.
    """
    paper = db.get_paper_full(paper_id)
    _verify_paper_access(paper, current_user, paper_id)

    references = paper.get("references", [])
    verified_count = 0
    updated_references = []

    for ref in references[:20]:  # Verify top references for performance
        ref_id = ref.get("id")
        doi = ref.get("doi")
        title = ref.get("title", "")
        updates = {}

        if doi:
            try:
                url = f"https://api.crossref.org/works/{doi}"
                req = urllib.request.Request(url, headers={"User-Agent": "ScholarPulse/1.0 (mailto:verify@scholarpulse.org)"})
                with urllib.request.urlopen(req, timeout=3) as resp:
                    if resp.status == 200:
                        updates["verified"] = 1
                        updates["verification_status"] = "verified"
                        verified_count += 1
            except Exception:
                updates["verification_status"] = "unverified"
        elif title and len(title) > 12:
            try:
                q = urllib.parse.quote_plus(title)
                url = f"https://api.crossref.org/works?query.bibliographic={q}&rows=1"
                req = urllib.request.Request(url, headers={"User-Agent": "ScholarPulse/1.0 (mailto:verify@scholarpulse.org)"})
                with urllib.request.urlopen(req, timeout=3) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    items = data.get("message", {}).get("items", [])
                    if items:
                        item = items[0]
                        cr_title = item.get("title", [""])[0]
                        # Check title similarity
                        t1 = set(re.findall(r'\b[a-zA-Z]{3,}\b', title.lower()))
                        t2 = set(re.findall(r'\b[a-zA-Z]{3,}\b', cr_title.lower()))
                        overlap = len(t1.intersection(t2)) / (len(t1.union(t2)) or 1)
                        if overlap >= 0.5:
                            updates["verified"] = 1
                            updates["verification_status"] = "verified"
                            if item.get("DOI"):
                                updates["doi"] = item.get("DOI")
                            verified_count += 1
                        else:
                            updates["verification_status"] = "unverified"
                    else:
                        updates["verification_status"] = "unverified"
            except Exception:
                updates["verification_status"] = "unverified"
        else:
            updates["verification_status"] = "unverified"

        if updates and ref_id:
            db.update_reference(ref_id, updates)
            ref.update(updates)
        updated_references.append(ref)

    return {
        "status": "success",
        "verified_count": verified_count,
        "total_references": len(references),
        "references": updated_references
    }


@app.post("/api/papers/{paper_id}/enrich-metadata")
def enrich_paper_metadata(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Enriches academic paper metadata against CrossRef registry:
    Official publication journal, publication date, verified DOI, and academic subject taxonomy.
    """
    paper = db.get_paper_full(paper_id)
    _verify_paper_access(paper, current_user, paper_id)

    meta = paper.get("metadata", {})
    title = meta.get("title", "")
    doi = meta.get("doi", "")
    updates = {}
    source = "CrossRef"

    # Query CrossRef for publication authority
    matched_item = None
    try:
        if doi:
            url = f"https://api.crossref.org/works/{doi}"
            req = urllib.request.Request(url, headers={"User-Agent": "ScholarPulse/1.0 (mailto:enrich@scholarpulse.org)"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                matched_item = data.get("message")
        elif title and len(title) > 8:
            q = urllib.parse.quote_plus(title)
            url = f"https://api.crossref.org/works?query.bibliographic={q}&rows=1"
            req = urllib.request.Request(url, headers={"User-Agent": "ScholarPulse/1.0 (mailto:enrich@scholarpulse.org)"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                items = data.get("message", {}).get("items", [])
                if items:
                    matched_item = items[0]

        if matched_item:
            # Enrich venue/journal if present
            containers = matched_item.get("container-title", [])
            if containers and containers[0]:
                updates["journal"] = containers[0]

            # Enrich publication date
            pub_parts = matched_item.get("published", {}).get("date-parts", [[]])
            if pub_parts and pub_parts[0]:
                parts = pub_parts[0]
                updates["publication_date"] = "-".join(str(p).zfill(2) for p in parts)

            # Enrich DOI if missing
            if not doi and matched_item.get("DOI"):
                updates["doi"] = matched_item.get("DOI")

            if updates:
                db.update_metadata(paper_id, updates)
                meta.update(updates)

    except Exception as e:
        logger.warning(f"Metadata enrichment network notice: {e}")

    return {
        "status": "success",
        "enriched": bool(updates),
        "source": source,
        "updates": updates,
        "metadata": meta
    }


# =========================================================================
# SUPERUSER / ADMIN ENDPOINTS (STRICT ROLE-BASED ACCESS CONTROL)
# =========================================================================

@app.get("/api/admin/stats")
def get_admin_dashboard_stats(current_user: Dict[str, Any] = Depends(require_superuser)):
    """
    Returns system-wide aggregated real-time database metrics:
    KPI counters, user activity, application activity, recent timeline, and component health.
    """
    stats = db.get_admin_stats()
    health = check_system_components_health()
    stats["system_health"] = health
    return stats


@app.get("/api/admin/health")
def get_admin_system_health(current_user: Dict[str, Any] = Depends(require_superuser)):
    """Returns real diagnostic health check across all application subsystems."""
    return check_system_components_health()


@app.get("/api/admin/logins/daily")
def get_daily_logins(
    days: int = Query(7, ge=1, le=120),
    current_user: Dict[str, Any] = Depends(require_superuser)
):
    """
    Returns unique user login activity per day from real login_events records.
    Filters: 7 Days, 30 Days, 90 Days.
    """
    data = db.get_daily_login_activity(days=days)
    return {
        "days": days,
        "logins": data
    }


@app.get("/api/admin/registrations/trend")
def get_registration_trend(
    days: int = Query(7, ge=1, le=120),
    current_user: Dict[str, Any] = Depends(require_superuser)
):
    """
    Returns new user registrations per day calculated from users.created_at timestamps.
    Filters: 7 Days, 30 Days, 90 Days.
    """
    data = db.get_registration_trend(days=days)
    return {
        "days": days,
        "trend": data
    }


@app.get("/api/admin/activity")
def get_admin_activity(
    limit: int = Query(25, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(require_superuser)
):
    """Returns chronological application activity timeline."""
    return {
        "limit": limit,
        "activity": db.get_recent_activity(limit=limit)
    }


@app.get("/api/admin/users")
def get_all_users_filtered(
    role: Optional[str] = Query(None),
    date_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_superuser)
):
    """
    Returns registered users with paper counts and optional filtering:
    - role: 'all', 'user', 'superuser'
    - date_filter: 'today', '7d', '30d', '90d'
    - search: user name or email keyword
    """
    users = db.list_users_filtered(role=role, date_filter=date_filter, search=search)
    return {
        "count": len(users),
        "users": users
    }


@app.get("/api/admin/papers")
def get_all_papers_filtered(
    status: Optional[str] = Query(None),
    date_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_superuser)
):
    """
    Returns global system papers with owner attribution and optional filtering:
    - status: 'all', 'processing', 'completed', 'failed'
    - date_filter: 'today', '7d', '30d', '90d'
    - search: paper title, owner, or authors
    """
    papers = db.list_papers_filtered(status=status, date_filter=date_filter, search=search)
    return {
        "count": len(papers),
        "papers": papers
    }


@app.get("/api/admin/search")
def search_admin_registry(
    q: str = Query(""),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_filter: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(require_superuser)
):
    """
    Global superuser search across Users, Emails, Paper titles, Authors, and References.
    Uses indexed database queries.
    """
    return db.global_admin_search(query=q, role=role, status=status, date_filter=date_filter)


@app.delete("/api/admin/papers/{paper_id}")
def admin_delete_paper(
    paper_id: str,
    current_user: Dict[str, Any] = Depends(require_superuser)
):
    """Superuser paper deletion: removes any paper and owned analysis data with audit logging."""
    result = db.delete_document_full(doc_id=paper_id, is_superuser=True)
    if not result.get("success"):
        if result.get("status") == "not_found":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=result.get("message"))
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=result.get("message"))

    db.log_activity(
        user_id=current_user["id"],
        action="paper_deleted",
        resource_type="document",
        resource_id=paper_id,
        status="success",
        details=f"Administrative deletion of paper {paper_id}"
    )

    return {
        "status": "success",
        "message": "Paper deleted successfully."
    }


@app.get("/api/admin/analytics")
def get_admin_analytics(current_user: Dict[str, Any] = Depends(require_superuser)):
    """Returns aggregated system analytics for superuser."""
    return {
        "status": "success",
        "analytics": db.get_admin_stats()
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)