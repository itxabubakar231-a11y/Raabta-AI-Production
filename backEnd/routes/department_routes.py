"""
Raabta AI - Department Operations Command Center Routes
Provides departmental workflow:
- Risk-first dispatch queues
- Officer assignment & status transitions
- Resolution submissions with AI before/after verification
- Internal collaboration notes & audit logs
"""

import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify

from database import get_db, serialize_doc
from auth import token_required, role_required
from services.ai_service import verify_resolution_ai

department_bp = Blueprint("department_bp", __name__)


DEFAULT_DEPARTMENTS = [
    {
        "code": "CDA",
        "name": "Capital Development Authority (CDA)",
        "category": "Roads & Infrastructure",
        "contact_email": "operations@cda.gov.pk",
        "sla_hours": 48,
        "active_officers_count": 14
    },
    {
        "code": "IESCO",
        "name": "Islamabad Electric Supply Company (IESCO)",
        "category": "Electrical Hazards",
        "contact_email": "dispatch@iesco.com.pk",
        "sla_hours": 12,
        "active_officers_count": 22
    },
    {
        "code": "SNGPL",
        "name": "Sui Northern Gas Pipelines Limited (SNGPL)",
        "category": "Gas Leaks & Pipelines",
        "contact_email": "emergency@sngpl.com.pk",
        "sla_hours": 6,
        "active_officers_count": 18
    },
    {
        "code": "WASA",
        "name": "Water and Sanitation Agency (WASA)",
        "category": "Water & Sanitation",
        "contact_email": "helpline@wasa.gov.pk",
        "sla_hours": 24,
        "active_officers_count": 16
    },
    {
        "code": "IWMB",
        "name": "Waste Management & Cleanliness (IWMC)",
        "category": "Garbage & Waste",
        "contact_email": "sanitation@iwmc.gov.pk",
        "sla_hours": 36,
        "active_officers_count": 12
    }
]


def ensure_departments_seeded(db):
    """Ensures baseline government departments exist in the database."""
    if db.departments.count_documents({}) == 0:
        now = datetime.now(timezone.utc).isoformat()
        for d in DEFAULT_DEPARTMENTS:
            doc = dict(d)
            doc["_id"] = str(uuid.uuid4())
            doc["id"] = doc["_id"]
            doc["created_at"] = now
            db.departments.insert_one(doc)


@department_bp.route("", methods=["GET"], strict_slashes=False)
def list_departments():
    db = get_db()
    ensure_departments_seeded(db)

    depts = list(db.departments.find({}))
    results = []
    for d in depts:
        d_code = d.get("code")
        d_name = d.get("name")
        active_reports = db.civic_reports.count_documents({
            "$or": [{"department_id": d_code}, {"department_name": d_name}],
            "status": {"$in": ["submitted", "in_review", "assigned", "in_progress"]}
        })
        critical_reports = db.civic_reports.count_documents({
            "$or": [{"department_id": d_code}, {"department_name": d_name}],
            "status": {"$in": ["submitted", "in_review", "assigned", "in_progress"]},
            "civic_risk_score.score": {"$gte": 75}
        })
        d_copy = serialize_doc(d)
        d_copy["active_reports_count"] = active_reports
        d_copy["critical_reports_count"] = critical_reports
        results.append(d_copy)

    return jsonify({"success": True, "departments": results}), 200


@department_bp.route("/queue", methods=["GET"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def get_operations_queue():
    """Returns risk-sorted operations queue for department officers and command staff."""
    db = get_db()
    current_user = request.current_user
    user_dept = current_user.get("department_id")

    query = {
        "status": {"$in": ["submitted", "in_review", "assigned", "in_progress", "disputed"]}
    }

    # Department filter
    dept_param = request.args.get("department_id") or request.args.get("department")
    if dept_param and dept_param != "all":
        query["$or"] = [
            {"department_id": {"$regex": f"^{dept_param}$", "$options": "i"}},
            {"department_id": dept_param},
            {"department_name": {"$regex": dept_param, "$options": "i"}}
        ]
    elif not dept_param and user_dept and current_user.get("role") != "admin":
        query["$or"] = [
            {"department_id": {"$regex": f"^{user_dept}$", "$options": "i"}},
            {"department_id": user_dept},
            {"department_name": {"$regex": user_dept, "$options": "i"}}
        ]

    # Additional filters
    status_filter = request.args.get("status")
    if status_filter and status_filter != "all":
        query["status"] = status_filter

    min_risk = request.args.get("min_risk")
    if min_risk:
        try:
            query["civic_risk_score.score"] = {"$gte": int(min_risk)}
        except ValueError:
            pass

    # Sort strictly by Civic Risk Score descending (highest risk first)
    reports = list(db.civic_reports.find(query).sort("civic_risk_score.score", -1).limit(50))

    return jsonify({
        "success": True,
        "count": len(reports),
        "queue": serialize_doc(reports)
    }), 200


@department_bp.route("/reports/<report_id>/status", methods=["POST"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def update_report_status(report_id):
    db = get_db()
    report = db.civic_reports.find_one({"_id": report_id}) or db.civic_reports.find_one({"id": report_id}) or db.civic_reports.find_one({"tracking_id": report_id})
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get("status")
    notes = data.get("notes", "")

    valid_statuses = ["submitted", "in_review", "assigned", "in_progress", "resolved", "disputed", "closed"]
    if new_status not in valid_statuses:
        return jsonify({"success": False, "error": f"Invalid status. Must be one of: {valid_statuses}"}), 400

    now = datetime.now(timezone.utc).isoformat()
    actor_name = request.current_user.get("full_name", "Officer")

    db.civic_reports.update_one(
        {"_id": report.get("_id")},
        {
            "$set": {"status": new_status, "updated_at": now},
            "$push": {
                "timeline": {
                    "action": f"STATUS_CHANGED_TO_{new_status.upper()}",
                    "actor_role": request.current_user.get("role", "officer").upper(),
                    "actor_name": actor_name,
                    "details": notes or f"Status updated to {new_status}",
                    "timestamp": now
                }
            }
        }
    )

    # Notify citizen
    if report.get("citizen_id"):
        db.notifications.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": report["citizen_id"],
            "title": f"Status Update: {report.get('tracking_id')}",
            "message": f"Your report is now '{new_status}'. Officer: {actor_name}.",
            "type": "status_update",
            "report_id": str(report.get("_id")),
            "is_read": False,
            "created_at": now
        })

    return jsonify({
        "success": True,
        "message": f"Report status updated to '{new_status}'."
    }), 200


@department_bp.route("/reports/<report_id>/assign", methods=["POST"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def assign_report(report_id):
    db = get_db()
    report = db.civic_reports.find_one({"_id": report_id}) or db.civic_reports.find_one({"id": report_id}) or db.civic_reports.find_one({"tracking_id": report_id})
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    data = request.get_json(silent=True) or {}
    officer_id = data.get("officer_id") or request.current_user.get("id")
    officer_name = data.get("officer_name") or request.current_user.get("full_name")

    now = datetime.now(timezone.utc).isoformat()
    db.civic_reports.update_one(
        {"_id": report.get("_id")},
        {
            "$set": {
                "assigned_to": officer_id,
                "assigned_officer_name": officer_name,
                "status": "assigned",
                "updated_at": now
            },
            "$push": {
                "timeline": {
                    "action": "OFFICER_ASSIGNED",
                    "actor_role": "DISPATCH",
                    "actor_name": request.current_user.get("full_name"),
                    "details": f"Assigned to Duty Officer {officer_name}.",
                    "timestamp": now
                }
            }
        }
    )

    return jsonify({
        "success": True,
        "message": f"Report assigned to {officer_name}."
    }), 200


@department_bp.route("/reports/<report_id>/resolve", methods=["POST"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def mark_resolved_with_proof(report_id):
    """Officer marks report resolved with proof photo and resolution statement."""
    db = get_db()
    report = db.civic_reports.find_one({"_id": report_id}) or db.civic_reports.find_one({"id": report_id}) or db.civic_reports.find_one({"tracking_id": report_id})
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    data = request.get_json(silent=True) or {}
    notes = (data.get("resolution_notes") or data.get("notes") or "").strip()
    after_image_url = data.get("resolution_image_url") or data.get("after_image_url")

    now = datetime.now(timezone.utc).isoformat()
    officer_name = request.current_user.get("full_name", "Duty Officer")

    # Run AI resolution verification
    ai_check = verify_resolution_ai(
        before_image_bytes=None,
        after_image_bytes=None,
        issue_description=report.get("description", ""),
        officer_resolution_notes=notes
    )

    resolution_data = {
        "resolved_by": request.current_user.get("id"),
        "officer_name": officer_name,
        "resolution_notes": notes,
        "after_image_url": after_image_url,
        "ai_confidence_score": ai_check.get("confidence_score", 0.85),
        "ai_summary": ai_check.get("summary"),
        "resolved_at": now
    }

    db.civic_reports.update_one(
        {"_id": report.get("_id")},
        {
            "$set": {
                "status": "resolved",
                "resolution": resolution_data,
                "updated_at": now
            },
            "$push": {
                "timeline": {
                    "action": "WORK_COMPLETED_PENDING_VERIFICATION",
                    "actor_role": "OFFICER",
                    "actor_name": officer_name,
                    "details": f"Officer resolved issue. AI Quality Check: {int(ai_check.get('confidence_score', 0.85)*100)}%. Sent to citizen for verification.",
                    "timestamp": now
                }
            }
        }
    )

    # Notify citizen that their confirmation is needed
    if report.get("citizen_id"):
        db.notifications.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": report["citizen_id"],
            "title": f"Action Required: Confirm Resolution for {report.get('tracking_id')}",
            "message": f"Duty Officer {officer_name} completed work. Please inspect and approve or dispute.",
            "type": "verification_requested",
            "report_id": str(report.get("_id")),
            "is_read": False,
            "created_at": now
        })

    return jsonify({
        "success": True,
        "message": "Report resolved and submitted to citizen for verification.",
        "ai_check": ai_check
    }), 200


@department_bp.route("/reports/<report_id>/notes", methods=["POST"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def add_internal_note(report_id):
    db = get_db()
    data = request.get_json(silent=True) or {}
    note_text = (data.get("note") or "").strip()
    if not note_text:
        return jsonify({"success": False, "error": "Note text is required."}), 400

    now = datetime.now(timezone.utc).isoformat()
    note_id = str(uuid.uuid4())
    doc = {
        "_id": note_id,
        "id": note_id,
        "report_id": str(report_id),
        "officer_id": request.current_user.get("id"),
        "officer_name": request.current_user.get("full_name"),
        "note": note_text,
        "is_private": data.get("is_private", True),
        "created_at": now
    }
    db.internal_notes.insert_one(doc)

    return jsonify({
        "success": True,
        "message": "Internal collaboration note saved.",
        "note": serialize_doc(doc)
    }), 201


@department_bp.route("/reports/<report_id>/notes", methods=["GET"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def get_internal_notes(report_id):
    db = get_db()
    notes = list(db.internal_notes.find({"report_id": str(report_id)}).sort("created_at", -1))
    return jsonify({
        "success": True,
        "count": len(notes),
        "notes": serialize_doc(notes)
    }), 200



@department_bp.route("/reports/<report_id>/override", methods=["POST"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def override_report(report_id):
    """
    Allows officer/admin to override AI recommendations with a mandatory reason.
    Records OFFICER_OVERRIDE in timeline and audit log.
    """
    db = get_db()
    report = db.civic_reports.find_one({"_id": report_id}) or db.civic_reports.find_one({"id": report_id}) or db.civic_reports.find_one({"tracking_id": report_id})
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    data = request.get_json(silent=True) or {}
    reason = (data.get("reason") or "").strip()
    if not reason:
        return jsonify({"success": False, "error": "A clear mandatory reason is required to override AI recommendation."}), 400

    new_dept = data.get("department_id") or data.get("department")
    new_severity = data.get("severity")
    new_priority = data.get("priority") or data.get("risk_score")

    now = datetime.now(timezone.utc).isoformat()
    actor_name = request.current_user.get("full_name", "Officer")
    actor_id = request.current_user.get("id")

    update_fields = {"updated_at": now}
    override_details = {"actor_id": actor_id, "actor_name": actor_name, "reason": reason, "timestamp": now}

    if new_dept:
        update_fields["department_id"] = new_dept
        update_fields["department_name"] = new_dept
        override_details["new_department"] = new_dept
    if new_severity:
        update_fields["severity"] = new_severity
        override_details["new_severity"] = new_severity
    if new_priority is not None:
        try:
            p_val = int(new_priority)
            p_level = "CRITICAL" if p_val >= 75 else "HIGH" if p_val >= 50 else "MEDIUM" if p_val >= 25 else "LOW"
            update_fields["civic_risk_score.score"] = p_val
            update_fields["civic_risk_score.level"] = p_level
            override_details["new_priority"] = p_val
        except (ValueError, TypeError):
            pass

    db.civic_reports.update_one(
        {"_id": report.get("_id")},
        {
            "$set": update_fields,
            "$push": {
                "timeline": {
                    "action": "OFFICER_OVERRIDE",
                    "actor_role": request.current_user.get("role", "officer").upper(),
                    "actor_name": actor_name,
                    "details": f"Officer override: {reason}. {', '.join(f'{k}: {v}' for k, v in override_details.items() if k not in ['actor_id', 'actor_name', 'timestamp', 'reason'])}",
                    "timestamp": now
                }
            }
        }
    )

    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": actor_id,
        "actor_role": request.current_user.get("role", "officer").upper(),
        "action": "OFFICER_OVERRIDE",
        "report_id": str(report.get("_id")),
        "details": override_details,
        "timestamp": now
    })

    return jsonify({
        "success": True,
        "message": "AI recommendation override recorded successfully."
    }), 200


@department_bp.route("/reports/<report_id>/request-info", methods=["POST"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def request_more_info(report_id):
    """
    Officer requests additional information/clarification from the citizen.
    """
    db = get_db()
    report = db.civic_reports.find_one({"_id": report_id}) or db.civic_reports.find_one({"id": report_id}) or db.civic_reports.find_one({"tracking_id": report_id})
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    data = request.get_json(silent=True) or {}
    note = (data.get("note") or data.get("question") or "").strip()
    if not note:
        return jsonify({"success": False, "error": "Information request note is required."}), 400

    now = datetime.now(timezone.utc).isoformat()
    actor_name = request.current_user.get("full_name", "Duty Officer")

    db.civic_reports.update_one(
        {"_id": report.get("_id")},
        {
            "$set": {
                "status": "in_review",
                "needs_citizen_response": True,
                "citizen_info_request": {
                    "requested_by": actor_name,
                    "note": note,
                    "requested_at": now
                },
                "updated_at": now
            },
            "$push": {
                "timeline": {
                    "action": "INFORMATION_REQUESTED",
                    "actor_role": "OFFICER",
                    "actor_name": actor_name,
                    "details": f"Officer requested more information: {note}",
                    "timestamp": now
                }
            }
        }
    )

    if report.get("citizen_id"):
        db.notifications.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": report["citizen_id"],
            "title": f"Information Needed: {report.get('tracking_id')}",
            "message": f"The department needs more information about your report: '{note}'",
            "type": "info_requested",
            "report_id": str(report.get("_id")),
            "is_read": False,
            "created_at": now
        })

    updated_rep = db.civic_reports.find_one({"_id": report.get("_id")})
    return jsonify({
        "success": True,
        "message": "Information request sent to citizen.",
        "report": serialize_doc(updated_rep)
    }), 200

