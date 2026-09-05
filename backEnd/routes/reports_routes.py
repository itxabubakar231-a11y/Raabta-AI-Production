"""
Raabta AI - Civic Reports Routes
Handles comprehensive report lifecycle:
- Submission (multimodal: photo, audio, text, GPS)
- Risk scoring & proximity clustering
- Clarifying missing info Q&A
- Citizen resolution verification & dispute
- PDF dossier download
"""

import uuid
from datetime import datetime, timezone
import base64
from flask import Blueprint, request, jsonify, Response, send_file
import io

from database import get_db, serialize_doc
from auth import token_required, optional_auth, role_required
from services.risk_engine import calculate_civic_risk
from services.cluster_service import process_report_clustering
from services.ai_service import (
    assess_evidence_quality,
    generate_missing_information_questions,
    verify_resolution_ai
)
from services.gemma_service import detect_issue, detect_issue_from_text, generate_complaint
from services.pdf_service import generate_civic_dossier_pdf

reports_bp = Blueprint("reports_bp", __name__)


def generate_tracking_id() -> str:
    """Generates a clean human-readable tracking ID: RA-YYYY-XXXXX"""
    year = datetime.now().year
    rand_suffix = uuid.uuid4().hex[:5].upper()
    return f"RA-{year}-{rand_suffix}"


@reports_bp.route("", methods=["POST"], strict_slashes=False)
@optional_auth
def create_report():
    db = get_db()
    current_user = getattr(request, "current_user", None)
    citizen_id = current_user.get("id") if current_user else None
    citizen_name = current_user.get("full_name") if current_user else "Citizen"

    # Support JSON or multipart/form-data
    if request.is_json:
        data = request.get_json() or {}
        image_bytes = None
        if data.get("image_base64"):
            try:
                b64_str = data["image_base64"]
                if "," in b64_str:
                    b64_str = b64_str.split(",", 1)[1]
                image_bytes = base64.b64decode(b64_str)
            except Exception:
                image_bytes = None
    else:
        data = request.form.to_dict()
        image_file = request.files.get("image")
        image_bytes = image_file.read() if image_file else None

    title = (data.get("title") or "").strip()
    description = (data.get("description") or data.get("complaint_body") or "").strip()
    category = (data.get("category") or "").strip()
    department_id = data.get("department_id") or data.get("department") or ""

    lat = data.get("latitude")
    lon = data.get("longitude")
    address = data.get("address") or data.get("location_text") or ""
    city = data.get("city") or "Islamabad"

    try:
        lat_f = float(lat) if lat is not None and str(lat).strip() else None
        lon_f = float(lon) if lon is not None and str(lon).strip() else None
    except (ValueError, TypeError):
        lat_f = None
        lon_f = None

    # Step 1: AI Vision or Text Analysis if details missing
    ai_issue_data = {}
    if image_bytes and (not title or not category):
        try:
            detected_raw = detect_issue(image_bytes, latitude=lat_f, longitude=lon_f, address=address)
            import json
            ai_issue_data = json.loads(detected_raw)
            if not title:
                title = f"{ai_issue_data.get('issue', 'Civic Hazard')} at {address or city}"
            if not category:
                category = ai_issue_data.get("issue", "General")
            if not department_id:
                department_id = ai_issue_data.get("department", "Municipal Corporation")
        except Exception as e:
            print(f"[Reports] Vision AI error: {e}")

    if not title and description:
        try:
            detected_text = detect_issue_from_text(description)
            title = f"{detected_text.get('issue', 'Civic Issue')} Reported"
            if not category:
                category = detected_text.get("issue", "General")
            if not department_id:
                department_id = detected_text.get("department", "Municipal Corporation")
        except Exception as e:
            print(f"[Reports] Text AI error: {e}")

    if not title:
        title = "Reported Civic Incident"
    if not category:
        category = "Roads & Infrastructure"
    if not description:
        description = f"Reported {category} incident requiring municipal inspection."

    # Step 2: Evidence Quality Assessment
    has_audio = bool(data.get("audio_url") or "audio" in request.files)
    evidence_quality = assess_evidence_quality(
        image_bytes=image_bytes,
        text_length=len(description),
        has_audio=has_audio,
        has_gps=(lat_f is not None and lon_f is not None)
    )

    # Step 3: Civic Risk Score Calculation
    risk_data = calculate_civic_risk(
        category=category,
        title=title,
        description=description,
        evidence_quality=evidence_quality["quality_label"],
        evidence_score=evidence_quality["quality_score"],
        location_text=address,
        lat=lat_f,
        lon=lon_f
    )

    # Step 4: Missing Information Assistant
    missing_questions = generate_missing_information_questions(
        category=category,
        issue=title,
        description=description,
        location_text=address
    )

    # Step 5: Construct Report Document
    now = datetime.now(timezone.utc).isoformat()
    report_id = str(uuid.uuid4())
    tracking_id = generate_tracking_id()

    report_doc = {
        "_id": report_id,
        "id": report_id,
        "tracking_id": tracking_id,
        "citizen_id": citizen_id,
        "citizen_name": citizen_name,
        "citizen_phone": data.get("citizen_phone", ""),
        "title": title,
        "description": description,
        "category": category,
        "department_id": department_id,
        "department_name": department_id,
        "status": "submitted",
        "location": {
            "latitude": lat_f,
            "longitude": lon_f,
            "address": address,
            "city": city
        },
        "evidence": {
            "has_image": bool(image_bytes),
            "image_url": data.get("image_url", "/sample_evidence.jpg" if image_bytes else None),
            "image_base64": ("data:image/jpeg;base64," + base64.b64encode(image_bytes).decode("utf-8")) if image_bytes and len(image_bytes) < 300000 else None,
            "audio_url": data.get("audio_url"),
            "transcript": data.get("transcript"),
            "quality_label": evidence_quality["quality_label"],
            "quality_score": evidence_quality["quality_score"],
            "quality_reason": evidence_quality["reason"]
        },
        "civic_risk_score": risk_data,
        "sla_hours": risk_data.get("recommended_sla_hours", 48),
        "missing_information_questions": missing_questions,
        "missing_information_answers": [],
        "cluster_id": None,
        "is_duplicate": False,
        "timeline": [
            {
                "action": "REPORT_SUBMITTED",
                "actor_role": "CITIZEN",
                "details": f"Complaint filed via Raabta AI with {evidence_quality['quality_label']} evidence rating.",
                "timestamp": now
            }
        ],
        "created_at": now,
        "updated_at": now
    }

    db.civic_reports.insert_one(report_doc)

    # Step 6: Geospatial Proximity Clustering
    cluster_res = process_report_clustering(report_doc, db)
    if cluster_res.get("clustered"):
        report_doc["cluster_id"] = cluster_res.get("cluster_id")
        report_doc["is_duplicate"] = True
        # Recalculate risk score factoring duplicate surge
        duplicate_count = cluster_res.get("total_in_cluster", 1)
        updated_risk = calculate_civic_risk(
            category=category,
            title=title,
            description=description,
            evidence_quality=evidence_quality["quality_label"],
            evidence_score=evidence_quality["quality_score"],
            location_text=address,
            lat=lat_f,
            lon=lon_f,
            existing_duplicate_count=duplicate_count
        )
        db.civic_reports.update_one(
            {"_id": report_id},
            {"$set": {"civic_risk_score": updated_risk}}
        )
        report_doc["civic_risk_score"] = updated_risk

    # Step 7: Record Audit Log & Notification
    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": citizen_id or "ANONYMOUS",
        "actor_role": "CITIZEN",
        "action": "REPORT_CREATED",
        "details": {"tracking_id": tracking_id, "risk_score": report_doc["civic_risk_score"]["score"]},
        "timestamp": now
    })

    if citizen_id:
        db.notifications.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": citizen_id,
            "title": f"Report Received: {tracking_id}",
            "message": f"Your report '{title}' was logged. Civic Risk Score: {report_doc['civic_risk_score']['score']}/100.",
            "type": "report_submitted",
            "report_id": report_id,
            "is_read": False,
            "created_at": now
        })

    return jsonify({
        "success": True,
        "message": "Civic report submitted and triaged successfully.",
        "report": serialize_doc(report_doc),
        "cluster_info": cluster_res
    }), 201


@reports_bp.route("", methods=["GET"], strict_slashes=False)
def list_reports():
    db = get_db()
    query = {}

    status = request.args.get("status")
    if status and status != "all":
        query["status"] = status

    category = request.args.get("category")
    if category and category != "all":
        query["category"] = category

    department_id = request.args.get("department_id") or request.args.get("department")
    if department_id and department_id != "all":
        query["department_id"] = department_id

    min_risk = request.args.get("min_risk")
    if min_risk:
        try:
            query["civic_risk_score.score"] = {"$gte": int(min_risk)}
        except ValueError:
            pass

    search = request.args.get("search")
    if search:
        query["title"] = {"$regex": search, "$options": "i"}

    cluster_id = request.args.get("cluster_id")
    if cluster_id:
        query["cluster_id"] = cluster_id

    # Pagination
    try:
        page = max(1, int(request.args.get("page", 1)))
        limit = min(100, max(1, int(request.args.get("limit", 25))))
    except ValueError:
        page = 1
        limit = 25

    skip = (page - 1) * limit
    total_count = db.civic_reports.count_documents(query)

    # Default sort: Highest Civic Risk Score first (Risk-First Queue)
    reports_cursor = db.civic_reports.find(query).sort("civic_risk_score.score", -1).skip(skip).limit(limit)
    reports = [serialize_doc(r) for r in reports_cursor]

    return jsonify({
        "success": True,
        "total": total_count,
        "page": page,
        "limit": limit,
        "reports": reports
    }), 200


@reports_bp.route("/my", methods=["GET"], strict_slashes=False)
@token_required
def get_my_reports():
    db = get_db()
    user_id = request.current_user.get("id", request.current_user.get("_id"))
    reports = list(db.civic_reports.find({"citizen_id": user_id}).sort("created_at", -1))
    return jsonify({
        "success": True,
        "reports": serialize_doc(reports)
    }), 200


@reports_bp.route("/<report_id>", methods=["GET"], strict_slashes=False)
def get_report_detail(report_id):
    db = get_db()
    report = db.civic_reports.find_one({"_id": report_id}) or db.civic_reports.find_one({"id": report_id}) or db.civic_reports.find_one({"tracking_id": report_id})
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    # Fetch any cluster details if linked
    cluster_data = None
    if report.get("cluster_id"):
        cluster = db.issue_clusters.find_one({"_id": report["cluster_id"]}) or db.issue_clusters.find_one({"id": report["cluster_id"]})
        if cluster:
            cluster_data = serialize_doc(cluster)

    # Fetch internal notes if officer/admin or public resolution info
    internal_notes = []
    auth_header = request.headers.get("Authorization", "")
    if auth_header:
        # Check if officer
        try:
            from auth import decode_token
            token = auth_header.replace("Bearer ", "").strip()
            payload = decode_token(token)
            if payload.get("role") in ["officer", "admin"]:
                raw_notes = list(db.internal_notes.find({"report_id": str(report.get("_id", report.get("id")))}).sort("created_at", -1))
                internal_notes = serialize_doc(raw_notes)
        except Exception:
            pass

    res = serialize_doc(report)
    res["cluster"] = cluster_data
    res["internal_notes"] = internal_notes

    return jsonify({
        "success": True,
        "report": res
    }), 200


@reports_bp.route("/<report_id>/missing-info", methods=["POST"], strict_slashes=False)
def submit_missing_information(report_id):
    """Answers clarifying questions generated by the Missing Information Assistant."""
    db = get_db()
    report = db.civic_reports.find_one({"_id": report_id}) or db.civic_reports.find_one({"id": report_id}) or db.civic_reports.find_one({"tracking_id": report_id})
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    data = request.get_json(silent=True) or {}
    answers = data.get("answers") or []
    if not answers:
        return jsonify({"success": False, "error": "Answers array is required."}), 400

    now = datetime.now(timezone.utc).isoformat()
    db.civic_reports.update_one(
        {"_id": report.get("_id")},
        {
            "$set": {
                "missing_information_answers": answers,
                "evidence.quality_label": "Good",
                "evidence.quality_score": min(0.95, report.get("evidence", {}).get("quality_score", 0.7) + 0.15),
                "updated_at": now
            },
            "$push": {
                "timeline": {
                    "action": "ADDITIONAL_INFORMATION_PROVIDED",
                    "actor_role": "CITIZEN",
                    "details": f"Citizen answered {len(answers)} clarifying question(s).",
                    "timestamp": now
                }
            }
        }
    )

    return jsonify({
        "success": True,
        "message": "Clarifying information received and appended to civic dossier."
    }), 200


@reports_bp.route("/<report_id>/verify-resolution", methods=["POST"], strict_slashes=False)
@optional_auth
def verify_resolution(report_id):
    """Citizen accepts or disputes the municipal resolution."""
    db = get_db()
    report = db.civic_reports.find_one({"_id": report_id}) or db.civic_reports.find_one({"id": report_id}) or db.civic_reports.find_one({"tracking_id": report_id})
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    data = request.get_json(silent=True) or {}
    action = (data.get("action") or data.get("status") or "").lower()
    feedback = (data.get("feedback") or "").strip()
    rating = data.get("rating") or 5
    now = datetime.now(timezone.utc).isoformat()

    if action in ["accept", "accepted", "resolved", "close"]:
        new_status = "closed"
        details_msg = f"Citizen verified and approved resolution. Rating: {rating}/5 stars."
    elif action in ["dispute", "disputed", "reject"]:
        new_status = "disputed"
        details_msg = f"Citizen disputed resolution: '{feedback}'. Escrow/Escalation triggered."
        # Escalate risk score by 15 points
        current_score = report.get("civic_risk_score", {}).get("score", 50)
        db.civic_reports.update_one(
            {"_id": report.get("_id")},
            {"$set": {"civic_risk_score.score": min(100, current_score + 15), "is_escalated": True}}
        )
    else:
        return jsonify({"success": False, "error": "Invalid action. Must be 'accept' or 'dispute'."}), 400

    db.civic_reports.update_one(
        {"_id": report.get("_id")},
        {
            "$set": {
                "status": new_status,
                "citizen_verification": {
                    "status": new_status,
                    "feedback": feedback,
                    "rating": rating,
                    "verified_at": now
                },
                "updated_at": now
            },
            "$push": {
                "timeline": {
                    "action": f"RESOLUTION_{new_status.upper()}",
                    "actor_role": "CITIZEN",
                    "details": details_msg,
                    "timestamp": now
                }
            }
        }
    )

    return jsonify({
        "success": True,
        "message": f"Resolution successfully updated to {new_status}."
    }), 200


@reports_bp.route("/<report_id>/pdf", methods=["GET"], strict_slashes=False)
def download_pdf_dossier(report_id):
    """Generates and serves the official PDF Civic Dossier."""
    db = get_db()
    report = db.civic_reports.find_one({"_id": report_id}) or db.civic_reports.find_one({"id": report_id}) or db.civic_reports.find_one({"tracking_id": report_id})
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    events = report.get("timeline") or []
    pdf_bytes = generate_civic_dossier_pdf(report, events)

    filename = f"Raabta-Dossier-{report.get('tracking_id', 'RA')}.pdf"
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Content-Type": "application/pdf"
        }
    )
