"""
Raabta AI - Department Operations Command Center Routes
Provides departmental workflow:
- Risk-first dispatch queues
- Officer assignment & status transitions
- Resolution submissions with AI before/after verification
- Internal collaboration notes & audit logs
"""

import uuid
import re
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify

from database import get_db, serialize_doc, find_report
from auth import token_required, role_required, hash_password
from services.ai_service import verify_resolution_ai

department_bp = Blueprint("department_bp", __name__)


def _check_officer_permission(report, current_user):
    """Verifies that a Duty Officer can only manage reports for their assigned department or assigned to them."""
    if current_user.get("role") == "admin":
        return True
    user_dept = current_user.get("department_id")
    rep_dept = report.get("department_id")
    user_id = str(current_user.get("id"))
    rep_officer = str(report.get("assigned_officer_id") or report.get("assigned_to") or "")
    if user_dept and rep_dept and rep_dept.upper() == user_dept.upper():
        return True
    if rep_officer and rep_officer == user_id:
        return True
    return False


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

DEFAULT_OFFICERS = [
    {
        "email": "officer@raabta.gov.pk",
        "full_name": "Engr. Tariq Mehmood",
        "phone": "+923001234567",
        "role": "officer",
        "department_id": "IESCO",
        "department_name": "Islamabad Electric Supply Company (IESCO)"
    },
    {
        "email": "officer.cda@raabta.gov.pk",
        "full_name": "Engr. Usman Qureshi",
        "phone": "+923007654321",
        "role": "officer",
        "department_id": "CDA",
        "department_name": "Capital Development Authority (CDA)"
    },
    {
        "email": "officer.wasa@raabta.gov.pk",
        "full_name": "Asim Riaz",
        "phone": "+923019876543",
        "role": "officer",
        "department_id": "WASA",
        "department_name": "Water and Sanitation Agency (WASA)"
    },
    {
        "email": "officer.sngpl@raabta.gov.pk",
        "full_name": "Hamza Abbasi",
        "phone": "+923021122334",
        "role": "officer",
        "department_id": "SNGPL",
        "department_name": "Sui Northern Gas Pipelines Limited (SNGPL)"
    },
    {
        "email": "officer.iwmb@raabta.gov.pk",
        "full_name": "Malik Nadeem",
        "phone": "+923035566778",
        "role": "officer",
        "department_id": "IWMB",
        "department_name": "Waste Management & Cleanliness (IWMC)"
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


def ensure_officers_seeded(db):
    """Ensures departmental field duty officers exist in the user database."""
    now = datetime.now(timezone.utc).isoformat()
    for o in DEFAULT_OFFICERS:
        existing = db.users.find_one({"email": o["email"]})
        if not existing:
            user_id = str(uuid.uuid4())
            db.users.insert_one({
                "_id": user_id,
                "id": user_id,
                "email": o["email"],
                "password_hash": hash_password("Password123!"),
                "full_name": o["full_name"],
                "phone": o["phone"],
                "role": o["role"],
                "department_id": o["department_id"],
                "department_name": o["department_name"],
                "is_verified": True,
                "created_at": now
            })


@department_bp.route("", methods=["GET"], strict_slashes=False)
def list_departments():
    db = get_db()
    ensure_departments_seeded(db)
    ensure_officers_seeded(db)

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


@department_bp.route("/officers", methods=["GET"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def list_officers():
    """Returns roster of active duty officers across all civic departments."""
    db = get_db()
    ensure_officers_seeded(db)

    dept_filter = request.args.get("department_id") or request.args.get("department")
    query = {"role": "officer"}
    if dept_filter and dept_filter != "all":
        query["$or"] = [
            {"department_id": dept_filter},
            {"department_id": {"$regex": f"^{dept_filter}$", "$options": "i"}},
            {"department_name": {"$regex": dept_filter, "$options": "i"}}
        ]

    officers = list(db.users.find(query))
    officers_list = []
    for off in officers:
        oid = str(off.get("_id") or off.get("id"))
        active_cases = db.civic_reports.count_documents({
            "assigned_to": oid,
            "status": {"$in": ["assigned", "in_progress"]}
        })
        officers_list.append({
            "id": oid,
            "email": off.get("email"),
            "full_name": off.get("full_name"),
            "phone": off.get("phone"),
            "department_id": off.get("department_id"),
            "department_name": off.get("department_name"),
            "active_cases": active_cases
        })

    return jsonify({"success": True, "count": len(officers_list), "officers": officers_list}), 200


@department_bp.route("/queue", methods=["GET"], strict_slashes=False)
@department_bp.route("/operations-queue", methods=["GET"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def get_operations_queue():
    """Returns risk-sorted operations queue for department officers and command staff."""
    db = get_db()
    current_user = request.current_user
    user_dept = current_user.get("department_id")
    user_id = str(current_user.get("id"))

    conditions = [
        {"status": {"$in": ["submitted", "in_review", "assigned", "in_progress", "disputed"]}}
    ]

    # Department filter: allow 'all' or explicit ID, or default to officer's department if non-admin
    dept_param = request.args.get("department_id") or request.args.get("department")
    if current_user.get("role") != "admin":
        if user_dept:
            dept_param = user_dept

    if dept_param and dept_param != "all":
        conditions.append({
            "$or": [
                {"department_id": {"$regex": f"^{re.escape(dept_param)}$", "$options": "i"}},
                {"department_id": dept_param},
                {"department_name": {"$regex": re.escape(dept_param), "$options": "i"}}
            ]
        })
    elif not dept_param and user_dept and current_user.get("role") != "admin":
        conditions.append({
            "$or": [
                {"department_id": {"$regex": f"^{re.escape(user_dept)}$", "$options": "i"}},
                {"department_id": user_dept},
                {"department_name": {"$regex": re.escape(user_dept), "$options": "i"}}
            ]
        })

    # Status filter
    status_filter = request.args.get("status")
    if status_filter and status_filter != "all":
        conditions.append({"status": status_filter})

    # Assignment filter
    assigned_to = request.args.get("assigned_to") or request.args.get("officer_id")
    if assigned_to:
        if assigned_to in ["me", "mine"]:
            conditions.append({
                "$or": [
                    {"assigned_to": user_id},
                    {"assigned_officer_id": user_id}
                ]
            })
        elif assigned_to == "unassigned":
            conditions.append({
                "$or": [
                    {"assigned_to": {"$exists": False}},
                    {"assigned_to": None},
                    {"assigned_to": ""},
                    {"assigned_officer_id": {"$exists": False}},
                    {"assigned_officer_id": None},
                    {"assigned_officer_id": ""}
                ]
            })
        elif assigned_to != "all":
            conditions.append({
                "$or": [
                    {"assigned_to": assigned_to},
                    {"assigned_officer_id": assigned_to}
                ]
            })

    min_risk = request.args.get("min_risk")
    if min_risk:
        try:
            conditions.append({"civic_risk_score.score": {"$gte": int(min_risk)}})
        except ValueError:
            pass

    query = {"$and": conditions} if len(conditions) > 1 else conditions[0]

    # Fetch and sort strictly by Civic Risk Score descending, then created_at ascending
    raw_reports = list(db.civic_reports.find(query))
    def queue_sort_key(r):
        score = (r.get("civic_risk_score") or {}).get("score") or 0
        created = r.get("created_at") or ""
        return (-score, created)

    raw_reports.sort(key=queue_sort_key)
    reports = raw_reports[:100]

    # Calculate real operational queue statistics
    stats = {
        "total": len(raw_reports),
        "pending": sum(1 for r in raw_reports if r.get("status") in ["submitted", "in_review"]),
        "waiting_action": sum(1 for r in raw_reports if r.get("status") in ["submitted", "in_review"] or not r.get("assigned_officer_id")),
        "in_progress": sum(1 for r in raw_reports if r.get("status") in ["assigned", "in_progress"]),
        "resolved": sum(1 for r in raw_reports if r.get("status") in ["resolved", "closed"]),
        "disputed": sum(1 for r in raw_reports if r.get("status") == "disputed"),
        "critical": sum(1 for r in raw_reports if ((r.get("civic_risk_score") or {}).get("score") or 0) >= 75)
    }

    serialized_reports = serialize_doc(reports)
    return jsonify({
        "success": True,
        "count": len(reports),
        "stats": stats,
        "queue": serialized_reports,
        "reports": serialized_reports
    }), 200


@department_bp.route("/reports/<report_id>/status", methods=["POST"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def update_report_status(report_id):
    db = get_db()
    report = find_report(db, report_id)
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    if not _check_officer_permission(report, request.current_user):
        return jsonify({
            "success": False,
            "error": "Unauthorized: Officer cannot modify reports outside assigned department."
        }), 403

    data = request.get_json(silent=True) or {}
    new_status = (data.get("status") or "").lower().strip()
    current_status = (report.get("status") or "submitted").lower()

    valid_statuses = ["submitted", "in_review", "assigned", "in_progress", "resolved", "closed", "disputed"]
    if new_status not in valid_statuses:
        return jsonify({"success": False, "error": f"Invalid status: {new_status}"}), 400

    # Operational lifecycle validation for duty officers
    if request.current_user.get("role") != "admin":
        valid_transitions = {
            "submitted": ["in_review", "assigned", "in_progress"],
            "in_review": ["assigned", "in_progress", "submitted"],
            "assigned": ["in_progress", "in_review", "resolved"],
            "in_progress": ["resolved", "assigned", "in_review"],
            "disputed": ["in_progress", "assigned", "resolved"],
            "resolved": ["closed", "disputed", "in_progress"],
            "closed": ["disputed"]
        }
        if current_status in valid_transitions and new_status not in valid_transitions[current_status]:
            return jsonify({
                "success": False,
                "error": f"Invalid operational status transition from {current_status.upper()} to {new_status.upper()}."
            }), 400

    notes = (data.get("notes") or data.get("reason") or "").strip()
    now = datetime.now(timezone.utc).isoformat()
    actor_name = request.current_user.get("full_name", "Officer")
    actor_role = request.current_user.get("role", "officer").upper()

    db.civic_reports.update_one(
        {"_id": report.get("_id")},
        {
            "$set": {"status": new_status, "updated_at": now},
            "$push": {
                "timeline": {
                    "action": f"STATUS_CHANGED_TO_{new_status.upper()}",
                    "actor_role": actor_role,
                    "actor_name": actor_name,
                    "details": notes or f"Status updated to {new_status}",
                    "timestamp": now
                }
            }
        }
    )

    # Immutable Audit Log
    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": str(request.current_user.get("id")),
        "actor_role": actor_role,
        "actor_name": actor_name,
        "action": f"STATUS_{new_status.upper()}",
        "tracking_id": report.get("tracking_id"),
        "report_id": str(report.get("_id")),
        "details": {
            "tracking_id": report.get("tracking_id"),
            "old_status": report.get("status"),
            "new_status": new_status,
            "notes": notes
        },
        "timestamp": now,
        "created_at": now
    })

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

    updated = find_report(db, report_id)
    return jsonify({
        "success": True,
        "message": f"Report status updated to '{new_status}'.",
        "report": serialize_doc(updated)
    }), 200


@department_bp.route("/reports/<report_id>/assign", methods=["POST"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def assign_report(report_id):
    db = get_db()
    report = find_report(db, report_id)
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    if not _check_officer_permission(report, request.current_user):
        return jsonify({
            "success": False,
            "error": "Unauthorized: Officer cannot reassign reports outside assigned department."
        }), 403

    data = request.get_json(silent=True) or {}
    officer_id = data.get("officer_id") or request.current_user.get("id")
    officer_name = data.get("officer_name") or request.current_user.get("full_name")
    department_id = data.get("department_id")
    department_name = data.get("department_name")
    handover_reason = (data.get("reason") or data.get("notes") or "").strip()

    now = datetime.now(timezone.utc).isoformat()
    actor_role = request.current_user.get("role", "officer").upper()
    actor_name = request.current_user.get("full_name", "Duty Officer")

    update_fields = {
        "assigned_to": str(officer_id),
        "assigned_officer_id": str(officer_id),
        "assigned_officer_name": officer_name,
        "updated_at": now
    }

    # If current status is submitted or in_review, advance to assigned
    if report.get("status") in ["submitted", "in_review"]:
        update_fields["status"] = "assigned"

    dept_changed = False
    old_dept = report.get("department_name") or report.get("department_id") or "Unassigned"
    if department_id and department_id != report.get("department_id"):
        dept_changed = True
        update_fields["department_id"] = department_id
        if department_name:
            update_fields["department_name"] = department_name

    action_type = "DEPARTMENT_REASSIGNED" if dept_changed else "OFFICER_ASSIGNED"
    if dept_changed:
        timeline_details = f"Reassigned from {old_dept} to {department_name or department_id} (Duty Officer: {officer_name})."
        if handover_reason:
            timeline_details += f" Handover Reason: {handover_reason}"
    else:
        timeline_details = f"Assigned to Duty Officer {officer_name}."
        if handover_reason:
            timeline_details += f" Notes: {handover_reason}"

    db.civic_reports.update_one(
        {"_id": report.get("_id")},
        {
            "$set": update_fields,
            "$push": {
                "timeline": {
                    "action": action_type,
                    "actor_role": actor_role,
                    "actor_name": actor_name,
                    "details": timeline_details,
                    "timestamp": now
                }
            }
        }
    )

    # Immutable Audit Log
    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": str(request.current_user.get("id")),
        "actor_role": actor_role,
        "actor_name": actor_name,
        "action": action_type,
        "tracking_id": report.get("tracking_id"),
        "report_id": str(report.get("_id")),
        "details": {
            "tracking_id": report.get("tracking_id"),
            "officer_id": str(officer_id),
            "officer_name": officer_name,
            "department_id": department_id or report.get("department_id"),
            "old_department": old_dept,
            "handover_reason": handover_reason
        },
        "timestamp": now,
        "created_at": now
    })

    updated = find_report(db, report_id)
    return jsonify({
        "success": True,
        "message": f"Report assigned to {officer_name}.",
        "report": serialize_doc(updated)
    }), 200


@department_bp.route("/reports/<report_id>/resolve", methods=["POST"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def mark_resolved_with_proof(report_id):
    """Officer marks report resolved with proof photo and resolution statement."""
    db = get_db()
    report = find_report(db, report_id)
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    if not _check_officer_permission(report, request.current_user):
        return jsonify({
            "success": False,
            "error": "Unauthorized: Officer cannot resolve reports outside assigned department."
        }), 403

    data = request.get_json(silent=True) or {}
    notes = (data.get("resolution_notes") or data.get("notes") or "").strip()
    after_image_url = data.get("resolution_image_url") or data.get("after_image_url")
    after_image_base64 = data.get("resolution_image_base64") or data.get("after_image_base64")

    if not notes:
        return jsonify({"success": False, "error": "Resolution description/notes are required."}), 400

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
        "after_image_base64": after_image_base64,
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
                "resolution_evidence": resolution_data,
                "updated_at": now
            },
            "$push": {
                "timeline": {
                    "action": "WORK_COMPLETED_PENDING_VERIFICATION",
                    "actor_role": "OFFICER",
                    "actor_name": officer_name,
                    "details": f"Officer resolved issue with field proof. AI Quality Check: {int(ai_check.get('confidence_score', 0.85)*100)}%. Sent to citizen for verification.",
                    "timestamp": now
                }
            }
        }
    )

    # Immutable Audit Log
    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": str(request.current_user.get("id")),
        "actor_role": "OFFICER",
        "actor_name": officer_name,
        "action": "OFFICER_RESOLVED",
        "tracking_id": report.get("tracking_id"),
        "report_id": str(report.get("_id")),
        "details": {
            "tracking_id": report.get("tracking_id"),
            "officer_name": officer_name,
            "notes": notes,
            "has_proof_photo": bool(after_image_url or after_image_base64),
            "ai_confidence": ai_check.get("confidence_score", 0.85)
        },
        "timestamp": now,
        "created_at": now
    })

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

    updated = find_report(db, report_id)
    return jsonify({
        "success": True,
        "message": "Report resolved and submitted to citizen for verification.",
        "ai_check": ai_check,
        "report": serialize_doc(updated)
    }), 200


@department_bp.route("/reports/<report_id>/notes", methods=["POST"], strict_slashes=False)
@token_required
@role_required("officer", "admin")
def add_internal_note(report_id):
    db = get_db()
    report = find_report(db, report_id)
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    if not _check_officer_permission(report, request.current_user):
        return jsonify({"success": False, "error": "Unauthorized: Officer cannot annotate external reports."}), 403

    data = request.get_json(silent=True) or {}
    note_text = (data.get("note") or data.get("content") or "").strip()
    if not note_text:
        return jsonify({"success": False, "error": "Note text is required."}), 400

    now = datetime.now(timezone.utc).isoformat()
    note_id = str(uuid.uuid4())
    doc = {
        "_id": note_id,
        "id": note_id,
        "report_id": str(report.get("_id") or report.get("id")),
        "tracking_id": report.get("tracking_id"),
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
    report = find_report(db, report_id)
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    if not _check_officer_permission(report, request.current_user):
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    rep_id = str(report.get("_id") or report.get("id"))
    track_id = str(report.get("tracking_id") or "")
    note_q = [{"report_id": rep_id}]
    if track_id and track_id != rep_id:
        note_q.append({"report_id": track_id})

    notes = list(db.internal_notes.find({"$or": note_q} if len(note_q) > 1 else note_q[0]).sort("created_at", -1))
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
    report = find_report(db, report_id)
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    if not _check_officer_permission(report, request.current_user):
        return jsonify({"success": False, "error": "Unauthorized"}), 403

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
    override_details = {
        "tracking_id": report.get("tracking_id"),
        "actor_id": actor_id,
        "actor_name": actor_name,
        "reason": reason,
        "timestamp": now
    }

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
        "actor_id": str(actor_id),
        "actor_role": request.current_user.get("role", "officer").upper(),
        "actor_name": actor_name,
        "action": "OFFICER_OVERRIDE",
        "tracking_id": report.get("tracking_id"),
        "report_id": str(report.get("_id")),
        "details": override_details,
        "timestamp": now,
        "created_at": now
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
    report = find_report(db, report_id)
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    if not _check_officer_permission(report, request.current_user):
        return jsonify({"success": False, "error": "Unauthorized"}), 403

    data = request.get_json(silent=True) or {}
    note = (data.get("note") or data.get("question") or "").strip()
    if not note:
        return jsonify({"success": False, "error": "Information request note is required."}), 400

    now = datetime.now(timezone.utc).isoformat()
    actor_name = request.current_user.get("full_name", "Duty Officer")
    actor_role = request.current_user.get("role", "officer").upper()

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
                    "actor_role": actor_role,
                    "actor_name": actor_name,
                    "details": f"Officer requested more information: {note}",
                    "timestamp": now
                }
            }
        }
    )

    # Immutable Audit Log
    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": str(request.current_user.get("id")),
        "actor_role": actor_role,
        "actor_name": actor_name,
        "action": "CITIZEN_INFO_REQUESTED",
        "tracking_id": report.get("tracking_id"),
        "report_id": str(report.get("_id")),
        "details": {
            "tracking_id": report.get("tracking_id"),
            "officer_name": actor_name,
            "note": note
        },
        "timestamp": now,
        "created_at": now
    })

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

