"""
Raabta AI - Authentication Routes
Endpoints for user registration, authentication, profile inspection, and session management.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import uuid

from database import get_db, serialize_doc
from auth import (
    hash_password,
    verify_password,
    generate_token,
    token_required
)

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.route("/signup", methods=["POST"], strict_slashes=False)
def signup():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    role = (data.get("role") or "citizen").strip().lower()
    department_id = data.get("department_id") or data.get("department") or None

    if not email or "@" not in email:
        return jsonify({"success": False, "error": "Invalid email address."}), 400

    if not password or len(password) < 6:
        return jsonify({"success": False, "error": "Password must be at least 6 characters long."}), 400

    if not full_name:
        return jsonify({"success": False, "error": "Full name is required."}), 400

    if role not in ["citizen", "officer", "admin"]:
        role = "citizen"

    db = get_db()
    existing = db.users.find_one({"email": email})
    if existing:
        return jsonify({"success": False, "error": "An account with this email already exists."}), 409

    hashed = hash_password(password)
    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "_id": user_id,
        "id": user_id,
        "email": email,
        "password_hash": hashed,
        "full_name": full_name,
        "phone": phone,
        "role": role,
        "department_id": department_id if role in ["officer", "admin"] else None,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }

    db.users.insert_one(user_doc)

    # Create welcome notification
    db.notifications.insert_one({
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": "Welcome to Raabta AI",
        "message": f"Welcome {full_name}! Your account has been registered with {role.upper()} privileges.",
        "type": "welcome",
        "is_read": False,
        "created_at": now
    })

    # Log audit event
    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": user_id,
        "actor_role": role,
        "action": "USER_SIGNUP",
        "details": {"email": email, "role": role},
        "timestamp": now
    })

    token = generate_token(user_id, role, email)
    safe_user = serialize_doc(user_doc)
    safe_user.pop("password_hash", None)

    return jsonify({
        "success": True,
        "message": "Account registered successfully.",
        "token": token,
        "user": safe_user
    }), 201


@auth_bp.route("/login", methods=["POST"], strict_slashes=False)
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"success": False, "error": "Email and password are required."}), 400

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"success": False, "error": "Invalid email or password."}), 401

    if not verify_password(password, user.get("password_hash", "")):
        return jsonify({"success": False, "error": "Invalid email or password."}), 401

    if not user.get("is_active", True):
        return jsonify({"success": False, "error": "Account is deactivated. Contact administration."}), 403

    user_id = str(user.get("_id", user.get("id")))
    role = user.get("role", "citizen")
    token = generate_token(user_id, role, email)

    safe_user = serialize_doc(user)
    safe_user.pop("password_hash", None)

    # Log audit event
    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": user_id,
        "actor_role": role,
        "action": "USER_LOGIN",
        "details": {"email": email},
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "token": token,
        "user": safe_user
    }), 200


@auth_bp.route("/me", methods=["GET"], strict_slashes=False)
@token_required
def get_current_user():
    user = dict(request.current_user)
    user.pop("password_hash", None)

    db = get_db()
    user_id = str(user.get("id", user.get("_id")))
    unread_notifications = db.notifications.count_documents({"user_id": user_id, "is_read": False})
    user["unread_notifications"] = unread_notifications

    # Attach department info if officer
    if user.get("department_id"):
        dept = db.departments.find_one({"code": user["department_id"]}) or db.departments.find_one({"_id": user["department_id"]})
        if dept:
            user["department"] = serialize_doc(dept)

    return jsonify({
        "success": True,
        "user": user
    }), 200


@auth_bp.route("/logout", methods=["POST"], strict_slashes=False)
def logout():
    return jsonify({
        "success": True,
        "message": "Logged out successfully."
    }), 200
