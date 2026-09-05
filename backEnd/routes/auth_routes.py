"""
Raabta AI - Authentication Routes
Endpoints for user registration, authentication, profile inspection, and session management.
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone, timedelta
import os
import uuid
import secrets
import hashlib

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


def mask_email(email: str) -> str:
    """Masks an email for safe display (e.g. j***e@example.com)."""
    if not email or "@" not in email:
        return ""
    user_part, domain_part = email.split("@", 1)
    if len(user_part) <= 2:
        masked_user = user_part[0] + "*"
    else:
        masked_user = user_part[0] + "*" * (len(user_part) - 2) + user_part[-1]
    return f"{masked_user}@{domain_part}"


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Dispatches password reset instructions via SMTP or safe development fallback."""
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    mail_from = os.environ.get("MAIL_FROM", "no-reply@raabta.gov.pk")

    if smtp_host and smtp_user and smtp_pass:
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Raabta AI - Password Reset Request"
            msg["From"] = f"Raabta AI Security <{mail_from}>"
            msg["To"] = to_email

            text_body = (
                f"A password reset request was received for your Raabta AI account.\n\n"
                f"To set a new password, open this secure link:\n{reset_url}\n\n"
                f"This link expires in 1 hour. If you did not request this, please disregard this email."
            )
            html_body = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 540px; margin: 0 auto; padding: 32px 24px; color: #1e293b; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                <div style="margin-bottom: 24px;">
                    <span style="font-weight: 800; font-size: 20px; color: #1e3a8a; letter-spacing: -0.5px;">RAABTA AI</span>
                    <span style="display: block; font-size: 13px; color: #64748b; margin-top: 4px;">Civic Intelligence Platform</span>
                </div>
                <h3 style="color: #0f172a; margin: 0 0 12px 0;">Reset Your Password</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
                    We received a request to reset your password. Click the secure button below to choose a new password.
                </p>
                <div style="margin: 28px 0;">
                    <a href="{reset_url}" style="background: #1e40af; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(30, 64, 175, 0.2);">Reset Password</a>
                </div>
                <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                    This link expires in 60 minutes. If you did not request this reset, your account is secure and you can safely ignore this message.
                </p>
            </div>
            """
            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"[Email] Failed to send reset email: {e}")
            return False
    else:
        # Safe dev fallback without leaking secrets
        print(f"[Auth Security] Reset URL generated for {to_email}: {reset_url}")
        return True


@auth_bp.route("/forgot-password", methods=["POST"], strict_slashes=False)
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email or "@" not in email:
        return jsonify({"success": False, "error": "Please provide a valid email address."}), 400

    db = get_db()
    user = db.users.find_one({"email": email})
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()

    # Always return a neutral success message regardless of user existence to prevent account enumeration
    neutral_message = "If an account exists with that email, instructions to reset your password have been sent."

    if not user:
        return jsonify({"success": True, "message": neutral_message}), 200

    user_id = str(user.get("_id", user.get("id")))

    # Invalidate previous unused tokens for this user
    active_tokens = list(db.password_resets.find({"user_id": user_id, "used": False}))
    for tok in active_tokens:
        db.password_resets.update_one({"_id": tok["_id"]}, {"$set": {"used": True, "invalidated_at": now_iso}})

    # Generate cryptographically secure token
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    expires_at = (now_dt + timedelta(hours=1)).isoformat()

    reset_id = str(uuid.uuid4())
    db.password_resets.insert_one({
        "_id": reset_id,
        "id": reset_id,
        "user_id": user_id,
        "email": email,
        "token_hash": token_hash,
        "expires_at": expires_at,
        "used": False,
        "created_at": now_iso
    })

    # Determine base frontend URL
    frontend_url = os.environ.get("FRONTEND_URL", "").rstrip("/")
    if not frontend_url:
        host = request.headers.get("Host", "")
        if "vercel.app" in host:
            frontend_url = f"https://{host}"
        else:
            frontend_url = "http://localhost:5173"

    reset_link = f"{frontend_url}/reset-password?token={raw_token}"
    send_password_reset_email(email, reset_link)

    # Log audit event
    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": user_id,
        "actor_role": user.get("role", "citizen"),
        "action": "PASSWORD_RESET_REQUESTED",
        "details": {"email": email},
        "timestamp": now_iso
    })

    response_payload = {
        "success": True,
        "message": neutral_message
    }
    if os.environ.get("FLASK_ENV") == "development" or os.environ.get("DEV_EXPOSE_RESET_TOKEN") == "true":
        response_payload["_dev_reset_url"] = reset_link

    return jsonify(response_payload), 200


@auth_bp.route("/verify-reset-token", methods=["GET"], strict_slashes=False)
def verify_reset_token():
    raw_token = (request.args.get("token") or "").strip()
    if not raw_token:
        return jsonify({"success": False, "error": "Token is required."}), 400

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    db = get_db()
    reset_record = db.password_resets.find_one({"token_hash": token_hash, "used": False})

    if not reset_record:
        return jsonify({"success": False, "error": "Invalid or expired password reset link."}), 400

    try:
        expires_at = datetime.fromisoformat(reset_record["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return jsonify({"success": False, "error": "This reset link has expired. Please request a new one."}), 400
    except Exception:
        return jsonify({"success": False, "error": "Invalid token expiration format."}), 400

    return jsonify({
        "success": True,
        "message": "Token is valid.",
        "email": mask_email(reset_record.get("email", ""))
    }), 200


@auth_bp.route("/reset-password", methods=["POST"], strict_slashes=False)
def reset_password():
    data = request.get_json(silent=True) or {}
    raw_token = (data.get("token") or "").strip()
    new_password = data.get("password") or ""
    confirm_password = data.get("confirm_password") or ""

    if not raw_token:
        return jsonify({"success": False, "error": "Reset token is required."}), 400

    if not new_password or len(new_password) < 8:
        return jsonify({"success": False, "error": "Password must be at least 8 characters long."}), 400

    if confirm_password and new_password != confirm_password:
        return jsonify({"success": False, "error": "Passwords do not match."}), 400

    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    db = get_db()
    reset_record = db.password_resets.find_one({"token_hash": token_hash, "used": False})

    if not reset_record:
        return jsonify({"success": False, "error": "Invalid or expired password reset link."}), 400

    try:
        expires_at = datetime.fromisoformat(reset_record["expires_at"])
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            return jsonify({"success": False, "error": "This reset link has expired. Please request a new one."}), 400
    except Exception:
        return jsonify({"success": False, "error": "Invalid token timestamp."}), 400

    user_id = reset_record["user_id"]
    now_iso = datetime.now(timezone.utc).isoformat()
    new_hash = hash_password(new_password)

    db.users.update_one(
        {"_id": user_id},
        {"$set": {"password_hash": new_hash, "updated_at": now_iso}}
    )
    db.users.update_one(
        {"id": user_id},
        {"$set": {"password_hash": new_hash, "updated_at": now_iso}}
    )

    db.password_resets.update_one(
        {"_id": reset_record["_id"]},
        {"$set": {"used": True, "used_at": now_iso}}
    )

    # Invalidate any other active reset tokens for this user
    other_tokens = list(db.password_resets.find({"user_id": user_id, "used": False}))
    for tok in other_tokens:
        db.password_resets.update_one({"_id": tok["_id"]}, {"$set": {"used": True, "invalidated_at": now_iso}})

    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": user_id,
        "actor_role": "user",
        "action": "PASSWORD_RESET_COMPLETED",
        "details": {"email": reset_record.get("email")},
        "timestamp": now_iso
    })

    return jsonify({
        "success": True,
        "message": "Password has been successfully updated. You can now log in with your new password."
    }), 200


@auth_bp.route("/change-password", methods=["POST"], strict_slashes=False)
@token_required
def change_password():
    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""
    confirm_password = data.get("confirm_password") or ""

    if not current_password:
        return jsonify({"success": False, "error": "Current password is required."}), 400

    if not new_password or len(new_password) < 8:
        return jsonify({"success": False, "error": "New password must be at least 8 characters long."}), 400

    if new_password != confirm_password:
        return jsonify({"success": False, "error": "New passwords do not match."}), 400

    user = request.current_user
    user_id = str(user.get("id", user.get("_id")))
    db = get_db()
    user_doc = db.users.find_one({"_id": user_id}) or db.users.find_one({"id": user_id})

    if not user_doc:
        return jsonify({"success": False, "error": "User account not found."}), 404

    if not verify_password(current_password, user_doc.get("password_hash", "")):
        return jsonify({"success": False, "error": "Current password is incorrect."}), 400

    now_iso = datetime.now(timezone.utc).isoformat()
    new_hash = hash_password(new_password)

    db.users.update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": now_iso}}
    )

    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": user_id,
        "actor_role": user_doc.get("role", "citizen"),
        "action": "PASSWORD_CHANGED",
        "details": {"email": user_doc.get("email")},
        "timestamp": now_iso
    })

    return jsonify({
        "success": True,
        "message": "Your password has been changed successfully."
    }), 200


@auth_bp.route("/profile", methods=["PUT"], strict_slashes=False)
@token_required
def update_profile():
    data = request.get_json(silent=True) or {}
    user = request.current_user
    user_id = str(user.get("id", user.get("_id")))
    db = get_db()

    updates = {}
    if "full_name" in data and str(data["full_name"]).strip():
        updates["full_name"] = str(data["full_name"]).strip()
    if "phone" in data:
        updates["phone"] = str(data["phone"]).strip()
    if "preferences" in data and isinstance(data["preferences"], dict):
        updates["preferences"] = data["preferences"]

    if not updates:
        return jsonify({"success": False, "error": "No valid fields provided for update."}), 400

    now_iso = datetime.now(timezone.utc).isoformat()
    updates["updated_at"] = now_iso

    db.users.update_one({"_id": user_id}, {"$set": updates})
    db.users.update_one({"id": user_id}, {"$set": updates})

    updated_user = db.users.find_one({"_id": user_id}) or db.users.find_one({"id": user_id})
    safe_user = serialize_doc(updated_user)
    safe_user.pop("password_hash", None)

    return jsonify({
        "success": True,
        "message": "Profile updated successfully.",
        "user": safe_user
    }), 200

