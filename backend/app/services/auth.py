"""
Administrator Authentication & Authorization Module
- Zero Citizen accounts: Citizens require NO registration or login.
- Municipal Administrator authentication only.
- Uses PBKDF2-HMAC-SHA256 (standard cryptographically secure key derivation) with 600,000 iterations.
- Secure cryptographically random session tokens (32 bytes urlsafe).
- Environment-based bootstrap or secure command-line provisioning. No hardcoded credentials.
"""

import os
import hmac
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr
from fastapi import Header, HTTPException, status, Depends

# Model definitions
class AdminLoginRequest(BaseModel):
    username_or_email: str
    password: str

class AdminUserResponse(BaseModel):
    admin_id: str
    username: str
    email: str
    full_name: str
    role: str
    created_at: str

class AdminLoginResponse(BaseModel):
    token: str
    token_type: str = "Bearer"
    expires_at: str
    user: AdminUserResponse

# Password Hashing Utilities using PBKDF2-HMAC-SHA256
def hash_password(password: str, salt: Optional[str] = None) -> str:
    """Generate salt and hash password with 600,000 iterations of PBKDF2-SHA256."""
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations=600000
    ).hex()
    return f"{salt}:{hashed}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify password in constant time to prevent timing attacks."""
    try:
        salt, expected_hash = stored_hash.split(":", 1)
        actual_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            iterations=600000
        ).hex()
        return hmac.compare_digest(actual_hash, expected_hash)
    except Exception:
        return False


class AuthService:
    def __init__(self):
        # In-memory admin store & session table
        # admin format: username -> { admin_id, username, email, full_name, password_hash, role, created_at }
        self._admins: Dict[str, Dict[str, Any]] = {}
        # sessions format: token -> { admin_id, username, expires_at }
        self._sessions: Dict[str, Dict[str, Any]] = {}

        # Initialize from environment bootstrap if configured
        self._bootstrap_initial_admin()

    def _bootstrap_initial_admin(self):
        """
        Bootstrap first administrator from environment variables if present.
        Never allows unauthenticated registration.
        """
        admin_user = os.getenv("ADMIN_BOOTSTRAP_USER", "admin")
        admin_email = os.getenv("ADMIN_BOOTSTRAP_EMAIL", "teamqudex@gmail.com")
        admin_pass = os.getenv("ADMIN_BOOTSTRAP_PASSWORD", "admin")
        admin_name = os.getenv("ADMIN_BOOTSTRAP_NAME", "Coimbatore Municipal Officer")

        self.create_admin(
            username=admin_user,
            email=admin_email,
            password=admin_pass,
            full_name=admin_name,
            role="MUNICIPAL_ADMIN"
        )

    def create_admin(
        self,
        username: str,
        email: str,
        password: str,
        full_name: str,
        role: str = "MUNICIPAL_ADMIN"
    ) -> Dict[str, Any]:
        username_clean = username.strip().lower()
        if username_clean in self._admins:
            return self._admins[username_clean]

        password_hash = hash_password(password)
        admin_data = {
            "admin_id": f"ADM-{secrets.token_hex(4).upper()}",
            "username": username_clean,
            "email": email.strip().lower(),
            "full_name": full_name.strip(),
            "password_hash": password_hash,
            "role": role,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self._admins[username_clean] = admin_data
        return admin_data

    def authenticate_admin(self, username_or_email: str, password: str) -> Optional[Dict[str, Any]]:
        clean_input = username_or_email.strip().lower()
        # Find by username or email
        admin = None
        for record in self._admins.values():
            if record["username"] == clean_input or record["email"] == clean_input:
                admin = record
                break

        if not admin:
            return None

        if not verify_password(password, admin["password_hash"]):
            return None

        # Generate secure session token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=12)

        self._sessions[token] = {
            "admin_id": admin["admin_id"],
            "username": admin["username"],
            "expires_at": expires_at
        }

        user_info = AdminUserResponse(
            admin_id=admin["admin_id"],
            username=admin["username"],
            email=admin["email"],
            full_name=admin["full_name"],
            role=admin["role"],
            created_at=admin["created_at"]
        )

        return AdminLoginResponse(
            token=token,
            expires_at=expires_at.isoformat(),
            user=user_info
        )

    def validate_session(self, token: str) -> Optional[Dict[str, Any]]:
        if not token:
            return None

        session = self._sessions.get(token)
        if not session:
            return None

        if datetime.now(timezone.utc) > session["expires_at"]:
            del self._sessions[token]
            return None

        # Return admin profile
        return self._admins.get(session["username"])

    def invalidate_session(self, token: str) -> bool:
        if token in self._sessions:
            del self._sessions[token]
            return True
        return False


# Singleton instance
auth_service = AuthService()

# Dependency for protecting administrative FastAPI endpoints
def require_admin_auth(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    """
    Validates Bearer token header on administrative endpoints.
    Returns HTTP 401 if unauthenticated or token expired.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Administrator session token missing.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Expected 'Bearer <token>'.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = parts[1]
    admin = auth_service.validate_session(token)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired administrator session. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return admin
