"""
Raabta AI - Authentication and RBAC Module
Handles bcrypt password hashing, JWT token lifecycle, and role decorators.
Roles supported: 'citizen', 'officer', 'admin'.
"""

import os
import datetime
from functools import wraps
from flask import request, jsonify
import bcrypt
import jwt
from database import get_db, serialize_doc, find_user

JWT_SECRET = os.environ.get("JWT_SECRET", "raabta-ai-civic-intelligence-jwt-secret-key-2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72


def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verifies a plaintext password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def generate_token(user_id: str, role: str, email: str) -> str:
    """Generates a signed JWT authentication token."""
    payload = {
        "sub": str(user_id),
        "role": role,
        "email": email,
        "iat": datetime.datetime.now(datetime.timezone.utc),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decodes and validates a JWT token."""
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


def get_token_from_request() -> str:
    """Extracts JWT token from Authorization header or cookies."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return request.cookies.get("token", "")


def token_required(f):
    """Decorator ensuring a valid JWT is present and user exists."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        if not token:
            return jsonify({
                "success": False,
                "error": "Authentication required",
                "message": "Authorization token missing. Please log in."
            }), 401

        try:
            payload = decode_token(token)
            user_id = payload.get("sub")
            db = get_db()
            user = find_user(db, user_id)
            if not user:
                return jsonify({
                    "success": False,
                    "error": "User not found",
                    "message": "The authenticated user account no longer exists."
                }), 401

            request.current_user = serialize_doc(user)
        except jwt.ExpiredSignatureError:
            return jsonify({
                "success": False,
                "error": "Token expired",
                "message": "Your session has expired. Please log in again."
            }), 401
        except Exception as e:
            return jsonify({
                "success": False,
                "error": "Invalid token",
                "message": f"Token validation failed: {str(e)}"
            }), 401

        return f(*args, **kwargs)
    return decorated


def optional_auth(f):
    """Decorator that attaches current_user if token is valid, otherwise sets to None."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = get_token_from_request()
        request.current_user = None
        if token:
            try:
                payload = decode_token(token)
                user_id = payload.get("sub")
                db = get_db()
                user = find_user(db, user_id)
                if user:
                    request.current_user = serialize_doc(user)
            except Exception:
                request.current_user = None
        return f(*args, **kwargs)
    return decorated


def role_required(*allowed_roles):
    """Decorator ensuring user belongs to one of the specified roles."""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, "current_user") or not request.current_user:
                return jsonify({
                    "success": False,
                    "error": "Unauthorized",
                    "message": "Authentication required."
                }), 401

            user_role = request.current_user.get("role", "citizen")
            if user_role not in allowed_roles:
                return jsonify({
                    "success": False,
                    "error": "Forbidden",
                    "message": f"Access denied. Required role: {', '.join(allowed_roles)}. Your role: {user_role}."
                }), 403

            return f(*args, **kwargs)
        return decorated
    return decorator
