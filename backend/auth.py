import os
import time
import json
import hmac
import hashlib
import base64
import logging
from typing import Optional, Dict, Any
import bcrypt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def _load_env():
    env_file = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_file):
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'\"")
                if k not in os.environ or not os.environ[k]:
                    os.environ[k] = v

_load_env()

from database import db

logger = logging.getLogger("scholarpulse.auth")

SECRET_KEY = os.environ.get("SECRET_KEY", "scholarpulse-super-secret-jwt-key-2026-production")
TOKEN_EXPIRY_SECONDS = 7 * 24 * 3600  # 7 days

security_bearer = HTTPBearer(auto_error=False)


# =========================================================================
# SECURE PASSWORD HASHING (BCRYPT)
# =========================================================================

def hash_password(password: str) -> str:
    """
    Hashes a plain-text password using bcrypt with a generated salt.
    Passwords are never stored in plain text.
    """
    if not password:
        raise ValueError("Password cannot be empty.")
    # bcrypt max length is 72 bytes
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain-text password against a stored bcrypt hash.
    Safe against timing attacks.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False


# =========================================================================
# SUPERUSER CONFIGURATION & CREDENTIALS
# =========================================================================

def get_superuser_email() -> str:
    """Retrieves the configured superuser email from backend environment variables."""
    return os.environ.get("SUPERUSER_EMAIL", "admin@scholarpulse.org").strip().lower()


def get_superuser_password() -> str:
    """Retrieves the configured superuser password from backend environment variables."""
    return os.environ.get("SUPERUSER_PASSWORD", "")


def verify_superuser_credentials(email: str, password: str) -> bool:
    """
    Cryptographically verifies submitted superuser credentials against backend environment.
    Uses constant-time string comparison to prevent timing attacks.
    """
    configured_email = get_superuser_email()
    configured_password = get_superuser_password()

    if not configured_email or not configured_password:
        logger.error("SUPERUSER_EMAIL or SUPERUSER_PASSWORD is not configured in backend/.env")
        return False

    if not email or not password:
        return False

    email_clean = email.strip().lower()
    email_match = hmac.compare_digest(email_clean.encode("utf-8"), configured_email.encode("utf-8"))
    pass_match = hmac.compare_digest(password.encode("utf-8"), configured_password.encode("utf-8"))

    return email_match and pass_match


# =========================================================================
# JWT SESSION TOKEN GENERATION & VERIFICATION (HMAC-SHA256)
# =========================================================================

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')


def _base64url_decode(data_str: str) -> bytes:
    padding = '=' * (4 - (len(data_str) % 4))
    return base64.urlsafe_b64decode(data_str + padding)


def create_access_token(user_id: str, email: str, role: str) -> str:
    """
    Creates an HMAC-SHA256 signed JWT token containing user identity, role, and expiration.
    Uses pure Python standard library to ensure 100% platform independence.
    """
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user_id),
        "email": email.strip().lower(),
        "role": role,
        "exp": int(time.time()) + TOKEN_EXPIRY_SECONDS,
        "iat": int(time.time())
    }

    header_b64 = _base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = _base64url_encode(json.dumps(payload).encode('utf-8'))

    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    sig_b64 = _base64url_encode(signature)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


def create_jwt_token(user: Dict[str, Any]) -> str:
    """Convenience helper to create token from a user dict."""
    return create_access_token(
        user_id=str(user["id"]),
        email=user["email"],
        role=user.get("role", "user")
    )


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies signature and expiration of an access token.
    Returns decoded payload if valid, None otherwise.
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None

        header_b64, payload_b64, sig_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()

        if not hmac.compare_digest(sig_b64, _base64url_encode(expected_sig)):
            return None

        payload_bytes = _base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))

        if payload.get("exp") and payload["exp"] < int(time.time()):
            return None

        return payload
    except Exception as e:
        logger.warning(f"Error decoding access token: {e}")
        return None


# =========================================================================
# FASTAPI DEPENDENCIES & ROLE-BASED ACCESS CONTROL
# =========================================================================

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)
) -> Dict[str, Any]:
    """
    FastAPI dependency to extract and authenticate the current user.
    Raises 401 if unauthenticated or token is invalid.
    Strictly verifies role integrity against backend configuration.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Role enforcement:
    # Role 'superuser' is granted IF AND ONLY IF token has role 'superuser'
    # AND user email matches the configured SUPERUSER_EMAIL.
    token_role = payload.get("role", "user")
    configured_superuser = get_superuser_email()

    if token_role == "superuser" and user["email"].strip().lower() == configured_superuser:
        user["role"] = "superuser"
    else:
        user["role"] = "user"

    return user


async def require_superuser(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    FastAPI dependency ensuring the authenticated user possesses superuser privileges.
    Raises 403 Forbidden with 'Access denied.' if user is not a superuser.
    """
    if current_user.get("role") != "superuser":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
    return current_user
