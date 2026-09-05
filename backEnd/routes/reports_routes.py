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
from services.voice_input import speech_to_text
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


def get_department_recommendation(category: str = "", issue: str = "", text: str = "") -> dict:
    corpus = f"{category} {issue} {text}".lower()
    if any(k in corpus for k in ["electric", "wire", "spark", "transformer", "pole", "power", "iesco", "current", "shock", "voltage", "bijli"]):
        dept_info = {
            "department_id": "IESCO",
            "department_name": "Islamabad Electric Supply Company (IESCO)",
            "category": "Electrical Hazards",
            "sla_hours": 4
        }
    elif any(k in corpus for k in ["gas", "leak", "sngpl", "flame", "cylinder", "pipeline", "gas smell", "sui gas"]):
        dept_info = {
            "department_id": "SNGPL",
            "department_name": "Sui Northern Gas Pipelines Limited (SNGPL)",
            "category": "Gas Leaks & Pipelines",
            "sla_hours": 6
        }
    elif any(k in corpus for k in ["water", "sewage", "gutter", "drain", "manhole", "pipe burst", "wasa", "contamination", "pani"]):
        dept_info = {
            "department_id": "WASA",
            "department_name": "Water and Sanitation Agency (WASA)",
            "category": "Water & Sanitation",
            "sla_hours": 24
        }
    elif any(k in corpus for k in ["garbage", "trash", "waste", "dumping", "kura", "safai", "mci", "iwmb", "iwmc"]):
        dept_info = {
            "department_id": "IWMB",
            "department_name": "Waste Management & Cleanliness (IWMC)",
            "category": "Garbage & Waste",
            "sla_hours": 36
        }
    elif any(k in corpus for k in ["traffic", "signal", "chowk", "expressway", "itp", "challan", "warden", "jam"]):
        dept_info = {
            "department_id": "ITP",
            "department_name": "Islamabad Traffic Police (ITP)",
            "category": "Traffic & Road Safety",
            "sla_hours": 2
        }
    elif any(k in corpus for k in ["fire", "emergency", "1122", "burn", "ambulance", "rescue"]):
        dept_info = {
            "department_id": "RESCUE_1122",
            "department_name": "Rescue 1122 Emergency Services",
            "category": "Emergency Services",
            "sla_hours": 1
        }
    else:
        dept_info = {
            "department_id": "CDA",
            "department_name": "Capital Development Authority (CDA)",
            "category": "Roads & Infrastructure",
            "sla_hours": 48
        }
    dept_info["name"] = dept_info["department_name"]
    return dept_info


@reports_bp.route("/analyze", methods=["POST"], strict_slashes=False)
@optional_auth
def analyze_report():
    """
    Multimodal AI analysis endpoint for pre-submission citizen review.
    Does NOT save the report to the database.
    Returns:
      - title
      - detected_issue
      - category
      - description
      - transcript (if audio provided)
      - department recommendation
      - priority_score (0-100) & risk factors breakdown
      - evidence_quality (label, score, reason)
      - follow_up_questions (1-2 targeted questions)
    """
    image_bytes = None
    audio_bytes = None
    audio_mime = "audio/webm"
    text_input = ""
    lat_f = None
    lon_f = None
    address = ""

    if request.is_json:
        data = request.get_json() or {}
        text_input = (data.get("description") or data.get("text") or "").strip()
        address = (data.get("address") or data.get("location_text") or "").strip()
        lat = data.get("latitude")
        lon = data.get("longitude")
        if data.get("image_base64"):
            try:
                b64_str = data["image_base64"]
                if "," in b64_str:
                    b64_str = b64_str.split(",", 1)[1]
                image_bytes = base64.b64decode(b64_str)
            except Exception:
                image_bytes = None
        if data.get("audio_base64"):
            try:
                b64_audio = data["audio_base64"]
                if "," in b64_audio:
                    b64_audio = b64_audio.split(",", 1)[1]
                audio_bytes = base64.b64decode(b64_audio)
            except Exception:
                audio_bytes = None
    else:
        data = request.form.to_dict()
        text_input = (data.get("description") or data.get("text") or "").strip()
        address = (data.get("address") or data.get("location_text") or "").strip()
        lat = data.get("latitude")
        lon = data.get("longitude")
        image_file = request.files.get("image")
        if image_file:
            image_bytes = image_file.read()
        audio_file = request.files.get("audio")
        if audio_file:
            audio_bytes = audio_file.read()
            if audio_file.mimetype:
                audio_mime = audio_file.mimetype

    try:
        lat_f = float(lat) if lat is not None and str(lat).strip() else None
        lon_f = float(lon) if lon is not None and str(lon).strip() else None
    except (ValueError, TypeError):
        lat_f = None
        lon_f = None

    # Step 1: Voice transcription if audio provided
    transcript = ""
    if audio_bytes and len(audio_bytes) > 20:
        try:
            stt_result = speech_to_text(audio_bytes, mime_type=audio_mime)
            transcript = stt_result.get("text", "").strip()
            if not text_input and transcript:
                text_input = transcript
        except Exception as e:
            print(f"[Analyze] Voice STT fallback: {e}")
            transcript = "Citizen voice recording attached (Urdu / English observation)"
            if not text_input:
                text_input = transcript

    # Step 2: Vision or text AI understanding
    detected_issue = ""
    detected_severity = "Medium"
    detected_dept_raw = ""

    if image_bytes and len(image_bytes) > 20:
        try:
            raw_detected = detect_issue(image_bytes, latitude=lat_f, longitude=lon_f, address=address)
            import json
            parsed = json.loads(raw_detected)
            detected_issue = parsed.get("issue", "")
            detected_severity = parsed.get("severity", "Medium")
            detected_dept_raw = parsed.get("department", "")
        except Exception as e:
            print(f"[Analyze] Vision fallback: {e}")

    if not detected_issue and text_input:
        try:
            parsed_text = detect_issue_from_text(text_input)
            detected_issue = parsed_text.get("issue", "")
            detected_severity = parsed_text.get("severity", "Medium")
            detected_dept_raw = parsed_text.get("department", "")
        except Exception as e:
            print(f"[Analyze] Text AI fallback: {e}")

    # Heuristic issue fallback
    if not detected_issue:
        corpus = f"{text_input} {address}".lower()
        if any(k in corpus for k in ["pothole", "road", "gaddha", "cracked", "asphalt"]):
            detected_issue = "Road Damage / Pothole"
        elif any(k in corpus for k in ["wire", "spark", "bijli", "current", "transformer", "pole"]):
            detected_issue = "Exposed Electrical Cable / Hazard"
        elif any(k in corpus for k in ["gutter", "drain", "pani", "manhole", "sewage", "nala"]):
            detected_issue = "Drainage / Gutter Overflow"
        elif any(k in corpus for k in ["garbage", "trash", "kura", "debris", "waste"]):
            detected_issue = "Garbage & Waste Accumulation"
        elif any(k in corpus for k in ["streetlight", "light", "dark", "batti"]):
            detected_issue = "Broken Streetlight"
        elif any(k in corpus for k in ["water leak", "pipeline", "pipe", "pani supply"]):
            detected_issue = "Water Supply Leakage"
        else:
            detected_issue = "Civic Problem"

    title = f"{detected_issue} Reported"
    if address:
        first_loc = address.split(",")[0].strip()
        if first_loc:
            title = f"{detected_issue} — {first_loc}"

    # Step 3: Department Recommendation
    dept_rec = get_department_recommendation(
        category=detected_issue,
        issue=detected_issue,
        text=f"{text_input} {detected_dept_raw}"
    )

    # Step 4: Evidence Quality Assessment
    evidence_quality = assess_evidence_quality(
        image_bytes=image_bytes,
        text_length=len(text_input),
        has_audio=bool(audio_bytes),
        has_gps=(lat_f is not None and lon_f is not None)
    )

    # Follow-up answers if provided (for priority recalculation)
    provided_answers = data.get("answers") or data.get("missing_information_answers") or []

    # Step 5: Follow-up Questions (1-2 targeted questions)
    follow_up_questions = generate_missing_information_questions(
        category=dept_rec["category"],
        issue=detected_issue,
        description=text_input,
        location_text=address
    )
    needs_follow_up = len(follow_up_questions) > 0 and len(provided_answers) == 0

    # Step 6: Deterministic Civic Priority Score (0-100) factoring in any follow-up answers
    risk_data = calculate_civic_risk(
        category=dept_rec["category"],
        title=title,
        description=text_input or f"Observed {detected_issue} requiring inspection.",
        evidence_quality=evidence_quality["quality_label"],
        evidence_score=evidence_quality["quality_score"],
        location_text=address,
        lat=lat_f,
        lon=lon_f,
        follow_up_answers=provided_answers
    )

    return jsonify({
        "success": True,
        "analysis": {
            "title": title,
            "detected_issue": detected_issue,
            "category": dept_rec["category"],
            "description": text_input or f"Reported {detected_issue} incident at {address or 'Islamabad'}.",
            "transcript": transcript,
            "has_image": bool(image_bytes),
            "has_audio": bool(audio_bytes),
            "department": dept_rec,
            "department_recommendation": dept_rec.get("name"),
            "evidence_quality": evidence_quality,
            "needs_follow_up": needs_follow_up,
            "follow_up_questions": follow_up_questions,
            "priority_score": risk_data.get("score", 50),
            "priority_level": risk_data.get("level", "MEDIUM"),
            "priority_factors": risk_data.get("factors", {}),
            "civic_risk_score": risk_data,
            "recommended_sla_hours": risk_data.get("recommended_sla_hours", dept_rec.get("sla_hours", 48))
        }
    }), 200


@reports_bp.route("/calculate-priority", methods=["POST"], strict_slashes=False)
@optional_auth
def calculate_priority_endpoint():
    """
    Recalculates deterministic civic risk score AFTER follow-up questions are answered.
    Adheres strictly to the 5 canonical weights:
    - Safety Risk: 30%
    - Visible Severity: 25%
    - Public Impact: 20%
    - Location Context: 15%
    - Evidence Confidence: 10%
    """
    data = request.get_json(silent=True) or {}
    category = data.get("category") or "Roads & Infrastructure"
    title = data.get("title") or "Civic Incident"
    description = data.get("description") or ""
    evidence_quality = data.get("evidence_quality") or "good"
    if isinstance(evidence_quality, dict):
        evidence_label = evidence_quality.get("quality_label", "good")
        evidence_score = float(evidence_quality.get("quality_score", 0.85))
    else:
        evidence_label = str(evidence_quality)
        evidence_score = float(data.get("evidence_score", 0.85))

    location_text = data.get("address") or data.get("location_text") or ""
    try:
        lat = float(data["latitude"]) if data.get("latitude") is not None else None
        lon = float(data["longitude"]) if data.get("longitude") is not None else None
    except (ValueError, TypeError):
        lat, lon = None, None

    answers = data.get("answers") or data.get("missing_information_answers") or []

    risk_data = calculate_civic_risk(
        category=category,
        title=title,
        description=description,
        evidence_quality=evidence_label,
        evidence_score=evidence_score,
        location_text=location_text,
        lat=lat,
        lon=lon,
        follow_up_answers=answers
    )

    return jsonify({
        "success": True,
        "priority_score": risk_data["score"],
        "priority_level": risk_data["level"],
        "priority_factors": risk_data["factors"],
        "civic_risk_score": risk_data,
        "recommended_sla_hours": risk_data.get("recommended_sla_hours", 48)
    }), 200


@reports_bp.route("", methods=["POST"], strict_slashes=False)
@optional_auth
def create_report():
    db = get_db()
    current_user = getattr(request, "current_user", None)
    citizen_id = current_user.get("id") if current_user else None
    citizen_name = current_user.get("full_name") if current_user else "Citizen"

    # Support JSON or multipart/form-data
    audio_base64 = None
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
        audio_base64 = data.get("audio_base64")
    else:
        data = request.form.to_dict()
        image_file = request.files.get("image")
        image_bytes = image_file.read() if image_file else None
        audio_file = request.files.get("audio")
        if audio_file:
            audio_bytes = audio_file.read()
            if audio_bytes:
                audio_base64 = "data:audio/webm;base64," + base64.b64encode(audio_bytes).decode("utf-8")

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
    has_audio = bool(audio_base64 or data.get("audio_url") or "audio" in request.files)
    evidence_quality = assess_evidence_quality(
        image_bytes=image_bytes,
        text_length=len(description),
        has_audio=has_audio,
        has_gps=(lat_f is not None and lon_f is not None)
    )

    # Step 3: Civic Risk Score Calculation (factoring citizen follow-up answers)
    answers_list = data.get("missing_information_answers") or data.get("answers") or []
    risk_data = calculate_civic_risk(
        category=category,
        title=title,
        description=description,
        evidence_quality=evidence_quality["quality_label"],
        evidence_score=evidence_quality["quality_score"],
        location_text=address,
        lat=lat_f,
        lon=lon_f,
        follow_up_answers=answers_list
    )

    # Step 4: Missing Information Assistant Questions
    client_questions = data.get("missing_information_questions") or data.get("follow_up_questions")
    missing_questions = client_questions if (client_questions and isinstance(client_questions, list)) else generate_missing_information_questions(
        category=category,
        issue=title,
        description=description,
        location_text=address
    )

    # Step 5: Construct Report Document
    now = datetime.now(timezone.utc).isoformat()
    report_id = str(uuid.uuid4())
    tracking_id = generate_tracking_id()

    initial_timeline = [
        {
            "action": "REPORT_SUBMITTED",
            "actor_role": "CITIZEN",
            "details": f"Complaint filed via Raabta AI with {evidence_quality['quality_label']} evidence rating.",
            "timestamp": now
        }
    ]
    if len(answers_list) > 0:
        initial_timeline.append({
            "action": "ADDITIONAL_INFORMATION_PROVIDED",
            "actor_role": "CITIZEN",
            "details": f"Citizen provided {len(answers_list)} clarifying answer(s) during pre-submission review.",
            "timestamp": now
        })

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
            "has_image": bool(image_bytes or data.get("image_base64")),
            "image_url": data.get("image_url") or ("/sample_evidence.jpg" if image_bytes else None),
            "image_base64": data.get("image_base64") or (("data:image/jpeg;base64," + base64.b64encode(image_bytes).decode("utf-8")) if image_bytes and len(image_bytes) < 500000 else None),
            "has_audio": bool(audio_base64 or data.get("audio_url")),
            "audio_url": data.get("audio_url"),
            "audio_base64": audio_base64,
            "transcript": data.get("transcript"),
            "quality_label": evidence_quality["quality_label"],
            "quality_score": evidence_quality["quality_score"],
            "quality_reason": evidence_quality["reason"]
        },
        "civic_risk_score": risk_data,
        "sla_hours": risk_data.get("recommended_sla_hours", 48),
        "missing_information_questions": missing_questions,
        "missing_information_answers": answers_list,
        "cluster_id": None,
        "is_duplicate": False,
        "timeline": initial_timeline,
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
@optional_auth
def list_reports():
    db = get_db()
    query = {}

    and_conditions = []

    status = request.args.get("status")
    if status and status != "all":
        query["status"] = status

    category = request.args.get("category")
    if category and category != "all":
        query["category"] = category

    department_id = request.args.get("department_id") or request.args.get("department")
    if department_id and department_id != "all":
        and_conditions.append({
            "$or": [
                {"department_id": {"$regex": f"^{department_id}$", "$options": "i"}},
                {"department_id": department_id},
                {"department_name": {"$regex": department_id, "$options": "i"}}
            ]
        })

    min_risk = request.args.get("min_risk")
    if min_risk:
        try:
            query["civic_risk_score.score"] = {"$gte": int(min_risk)}
        except ValueError:
            pass

    priority = request.args.get("priority")
    if priority and priority != "all":
        query["civic_risk_score.level"] = priority.upper()

    area = request.args.get("area") or request.args.get("sector")
    if area and area != "all":
        query["location.address"] = {"$regex": area, "$options": "i"}

    repeated = request.args.get("repeated")
    if repeated in ["true", "repeated"]:
        query["is_duplicate"] = True
    elif repeated in ["false", "individual"]:
        query["is_duplicate"] = {"$ne": True}

    search = request.args.get("search")
    if search:
        and_conditions.append({
            "$or": [
                {"title": {"$regex": search, "$options": "i"}},
                {"tracking_id": {"$regex": search, "$options": "i"}},
                {"location.address": {"$regex": search, "$options": "i"}},
                {"location.city": {"$regex": search, "$options": "i"}},
                {"category": {"$regex": search, "$options": "i"}}
            ]
        })

    if and_conditions:
        if len(and_conditions) == 1:
            query.update(and_conditions[0])
        else:
            query["$and"] = and_conditions

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

    # Sort order
    sort_by = request.args.get("sort_by", "risk")
    if sort_by == "created_at_desc":
        reports_cursor = db.civic_reports.find(query).sort("created_at", -1).skip(skip).limit(limit)
    elif sort_by == "created_at_asc":
        reports_cursor = db.civic_reports.find(query).sort("created_at", 1).skip(skip).limit(limit)
    else:
        # Risk-First default sort (highest risk score first)
        reports_cursor = db.civic_reports.find(query).sort("civic_risk_score.score", -1).skip(skip).limit(limit)

    current_user = getattr(request, "current_user", None)
    is_privileged = current_user and current_user.get("role") in ["officer", "admin"]
    current_uid = str(current_user.get("id")) if current_user else None

    sanitized_reports = []
    for r in reports_cursor:
        doc = serialize_doc(r)
        # Privacy protection: mask phone and identity details for unprivileged non-owners
        is_owner = current_uid and str(doc.get("citizen_id")) == current_uid
        if not is_privileged and not is_owner:
            phone = doc.get("citizen_phone", "")
            if phone and len(phone) > 6:
                doc["citizen_phone"] = phone[:4] + "***" + phone[-3:]
            elif phone:
                doc["citizen_phone"] = "***"
            doc.pop("internal_notes", None)
        sanitized_reports.append(doc)

    return jsonify({
        "success": True,
        "total": total_count,
        "page": page,
        "limit": limit,
        "reports": sanitized_reports
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


@reports_bp.route("/<report_id>/respond-info", methods=["POST"], strict_slashes=False)
@optional_auth
def respond_to_officer_info(report_id):
    """Citizen provides direct response to an official Government Information Request."""
    db = get_db()
    report = db.civic_reports.find_one({"_id": report_id}) or db.civic_reports.find_one({"id": report_id}) or db.civic_reports.find_one({"tracking_id": report_id})
    if not report:
        return jsonify({"success": False, "error": "Report not found"}), 404

    data = request.get_json(silent=True) or {}
    response_text = (data.get("response") or data.get("note") or data.get("text") or "").strip()
    if not response_text:
        return jsonify({"success": False, "error": "Response text is required."}), 400

    now = datetime.now(timezone.utc).isoformat()
    current_request = report.get("citizen_info_request") or {}
    current_request["response"] = response_text
    current_request["responded_at"] = now

    # Resume previous active status (assigned or in_progress)
    next_status = "assigned" if report.get("assigned_officer") else "in_progress"
    if report.get("status") not in ["in_review", "submitted"]:
        next_status = report.get("status")

    citizen_response_entry = {
        "response": response_text,
        "created_at": now,
        "author": getattr(request, "current_user", {}).get("full_name", "Citizen") if getattr(request, "current_user", None) else "Citizen"
    }

    db.civic_reports.update_one(
        {"_id": report.get("_id")},
        {
            "$set": {
                "needs_citizen_response": False,
                "status": next_status,
                "citizen_info_request": current_request,
                "updated_at": now
            },
            "$push": {
                "citizen_responses": citizen_response_entry,
                "timeline": {
                    "action": "CITIZEN_PROVIDED_INFO",
                    "actor_role": "CITIZEN",
                    "actor_name": getattr(request, "current_user", {}).get("full_name", "Citizen") if getattr(request, "current_user", None) else "Citizen",
                    "details": f"Citizen responded to inquiry: '{response_text}'",
                    "timestamp": now
                }
            }
        }
    )

    updated_report = db.civic_reports.find_one({"_id": report.get("_id")})

    return jsonify({
        "success": True,
        "message": "Response successfully sent to the duty officer.",
        "report": serialize_doc(updated_report)
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

    # Immutable Audit Log
    citizen_user = getattr(request, "current_user", None)
    citizen_id = str(citizen_user.get("id")) if citizen_user else str(report.get("citizen_id") or "CITIZEN")
    citizen_name = citizen_user.get("full_name") if citizen_user else "Citizen"
    db.audit_logs.insert_one({
        "_id": str(uuid.uuid4()),
        "actor_id": citizen_id,
        "actor_role": "CITIZEN",
        "actor_name": citizen_name,
        "action": f"RESOLUTION_{new_status.upper()}",
        "tracking_id": report.get("tracking_id"),
        "report_id": str(report.get("_id")),
        "details": {
            "tracking_id": report.get("tracking_id"),
            "action": new_status,
            "feedback": feedback,
            "rating": rating,
            "citizen_name": citizen_name
        },
        "timestamp": now,
        "created_at": now
    })

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
