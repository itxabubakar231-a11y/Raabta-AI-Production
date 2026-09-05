"""
Raabta AI - System Administration & Audit Routes
Accessible to administrators for system health, user role allocation, and audit trails.
"""

from flask import Blueprint, request, jsonify
from database import get_db, serialize_doc
from auth import token_required, role_required

admin_bp = Blueprint("admin_bp", __name__)


@admin_bp.route("/overview", methods=["GET"], strict_slashes=False)
@token_required
@role_required("admin")
def get_admin_overview():
    db = get_db()
    users_count = db.users.count_documents({})
    officers_count = db.users.count_documents({"role": "officer"})
    reports_count = db.civic_reports.count_documents({})
    critical_count = db.civic_reports.count_documents({"civic_risk_score.score": {"$gte": 75}})
    clusters_count = db.issue_clusters.count_documents({})

    return jsonify({
        "success": True,
        "overview": {
            "total_users": users_count,
            "active_officers": officers_count,
            "total_reports": reports_count,
            "critical_risk_incidents": critical_count,
            "active_clusters": clusters_count
        }
    }), 200


@admin_bp.route("/users", methods=["GET"], strict_slashes=False)
@token_required
@role_required("admin")
def list_users():
    db = get_db()
    users = list(db.users.find({}))
    safe_users = []
    for u in users:
        safe_u = serialize_doc(u)
        safe_u.pop("password_hash", None)
        safe_users.append(safe_u)

    return jsonify({"success": True, "users": safe_users}), 200


@admin_bp.route("/users/<user_id>/role", methods=["POST"], strict_slashes=False)
@token_required
@role_required("admin")
def update_user_role(user_id):
    db = get_db()
    data = request.get_json(silent=True) or {}
    new_role = (data.get("role") or "").lower()
    department_id = data.get("department_id")

    if new_role not in ["citizen", "officer", "admin"]:
        return jsonify({"success": False, "error": "Invalid role"}), 400

    update_payload = {"role": new_role}
    if department_id:
        update_payload["department_id"] = department_id

    db.users.update_one(
        {"_id": user_id},
        {"$set": update_payload}
    )

    return jsonify({"success": True, "message": f"User role updated to {new_role}."}), 200


@admin_bp.route("/audit-logs", methods=["GET"], strict_slashes=False)
@token_required
@role_required("admin")
def list_audit_logs():
    db = get_db()
    logs = list(db.audit_logs.find({}).sort("timestamp", -1).limit(100))
    return jsonify({"success": True, "logs": serialize_doc(logs)}), 200
