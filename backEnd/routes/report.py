print("REPORT FILE LOADED")

from flask import Blueprint, request, jsonify
import os
import io
import json
from werkzeug.utils import secure_filename

from services.gemma_service import (
    detect_issue,
    generate_complaint,
    detect_issue_from_text,
    get_model_name,
    GeminiQuotaError,
    GeminiConfigError
)
from services.location_service import get_address
from models.report_model import Report


report_bp = Blueprint("report", __name__)

print("REPORT ROUTE FILE:", __file__)

MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit
REPORT_PIPELINE_VERSION = "gemini-report-v2"


@report_bp.route("/report", methods=["POST"], strict_slashes=False)
def test():
    print(">>> Image Report Request received")

    try:
        # -----------------------------
        # Check Image Upload Presence
        # -----------------------------
        if "image" not in request.files:
            return jsonify({
                "status": "error",
                "message": "No image uploaded.",
                "pipeline_version": REPORT_PIPELINE_VERSION
            }), 400

        image = request.files["image"]

        if not image or image.filename == "":
            return jsonify({
                "status": "error",
                "message": "No image selected.",
                "pipeline_version": REPORT_PIPELINE_VERSION
            }), 400

        # -----------------------------
        # Size Protection (HTTP 413)
        # -----------------------------
        if request.content_length and request.content_length > MAX_IMAGE_SIZE_BYTES:
            return jsonify({
                "status": "error",
                "message": "Image file is too large. Maximum allowed size is 10 MB.",
                "pipeline_version": REPORT_PIPELINE_VERSION
            }), 413

        # -----------------------------
        # Read Image In-Memory (Zero-Disk)
        # -----------------------------
        image_bytes = image.read(MAX_IMAGE_SIZE_BYTES + 1)

        if len(image_bytes) > MAX_IMAGE_SIZE_BYTES:
            return jsonify({
                "status": "error",
                "message": "Image file is too large. Maximum allowed size is 10 MB.",
                "pipeline_version": REPORT_PIPELINE_VERSION
            }), 413

        if not image_bytes or len(image_bytes) < 10:
            return jsonify({
                "status": "error",
                "message": "Image file is empty or corrupt.",
                "pipeline_version": REPORT_PIPELINE_VERSION
            }), 400

        # -----------------------------
        # Validate Image Integrity via PIL (In-Memory)
        # -----------------------------
        try:
            from PIL import Image as PILImage
            with PILImage.open(io.BytesIO(image_bytes)) as img:
                img.verify()
        except Exception as img_err:
            return jsonify({
                "status": "error",
                "message": f"Invalid or corrupt image file: {str(img_err)}",
                "pipeline_version": REPORT_PIPELINE_VERSION
            }), 400

        # Safe diagnostic logging (no secrets or sensitive image bytes logged)
        print(
            f"[REPORT] Route=/api/report | Version={REPORT_PIPELINE_VERSION} | "
            f"Image received=True | Size={len(image_bytes)} bytes | "
            f"MIME={image.content_type} | Model={get_model_name()}"
        )

        # -----------------------------
        # Get User Location
        # -----------------------------
        latitude = request.form.get("latitude")
        longitude = request.form.get("longitude")
        address = None

        if latitude and longitude:
            address = get_address(latitude, longitude)
            try:
                print("Latitude :", latitude)
                print("Longitude:", longitude)
                print("Address  :", address)
            except Exception:
                pass
        else:
            print("No location received.")

        # -----------------------------
        # Step 1 : Gemma Vision (In-Memory)
        # -----------------------------
        issue_response = detect_issue(
            image_source=image_bytes,
            latitude=latitude,
            longitude=longitude,
            address=address
        )

        try:
            issue_data = json.loads(issue_response.strip())
            issue = issue_data.get("issue", "Unknown")
            reason = issue_data.get("reason", "")
            severity = issue_data.get("severity", "Medium")
            department = issue_data.get("department", "Municipal Corporation")
        except Exception as e:
            print("JSON Parsing Error:", e)
            print("Gemma Raw Response:", issue_response)
            return jsonify({
                "status": "error",
                "message": "Failed to process AI response.",
                "pipeline_version": REPORT_PIPELINE_VERSION
            }), 500

        # -----------------------------
        # Step 2 : Complaint Generation
        # -----------------------------
        complaint_data = generate_complaint(
            issue=issue,
            reason=reason,
            severity=severity,
            department=department,
            latitude=latitude,
            longitude=longitude,
            address=address
        )

        complaint_subject = complaint_data.get("complaint_subject", "Civic Issue Complaint")
        complaint_body = complaint_data.get("complaint_body", "")

        # -----------------------------
        # Final Complaint Report
        # -----------------------------
        complaint = f"""Civic Complaint Report
================================

Subject:
{complaint_subject}

Issue:
{issue}

Reason:
{reason}

Severity:
{severity}

Responsible Department:
{department}

Location:
{address if address else "Location not provided"}

Complaint:

{complaint_body}

--------------------------------

Generated By:
Raabta AI
Powered by Google Gemma 4
"""
        print("Complaint generated successfully in-memory")

        # -----------------------------
        # Create Report Object
        # -----------------------------
        report = Report(
            issue,
            department,
            complaint,
            image.filename or "in-memory-image.jpg"
        )

        # -----------------------------
        # Response
        # -----------------------------
        print(
            f"[REPORT DIAGNOSTIC] Route=/api/report | Model={get_model_name()} | "
            f"Success=True | Status=200 | GeminiError=None | "
            f"Size={len(image_bytes)} bytes | Version={REPORT_PIPELINE_VERSION}"
        )

        return jsonify({
            "status": "success",
            "message": "Complaint generated successfully.",
            "pipeline_version": REPORT_PIPELINE_VERSION,
            "location": {
                "latitude": latitude if latitude else "",
                "longitude": longitude if longitude else "",
                "address": address if address else "Location not provided"
            },
            "ai_result": {
                "issue": issue,
                "reason": reason,
                "severity": severity,
                "department": department
            },
            "complaint": {
                "subject": complaint_subject,
                "body": complaint_body
            },
            "report": report.to_dict()
        })

    except GeminiQuotaError as q_err:
        print(
            f"[REPORT DIAGNOSTIC] Route=/api/report | Model={get_model_name()} | "
            f"Success=False | Status=429 | GeminiError=RESOURCE_EXHAUSTED (Quota Exhausted) | "
            f"Size={len(image_bytes) if 'image_bytes' in locals() else 0} bytes | "
            f"Version={REPORT_PIPELINE_VERSION}"
        )
        return jsonify({
            "status": "error",
            "error_code": "RESOURCE_EXHAUSTED",
            "message": "AI analysis quota is temporarily exhausted. Please try again later.",
            "pipeline_version": REPORT_PIPELINE_VERSION
        }), 429

    except (GeminiConfigError, ValueError) as cfg_err:
        print(
            f"[REPORT DIAGNOSTIC] Route=/api/report | Model={get_model_name()} | "
            f"Success=False | Status=500 | GeminiError=AUTH_CONFIG_ERROR | "
            f"Size={len(image_bytes) if 'image_bytes' in locals() else 0} bytes | "
            f"Version={REPORT_PIPELINE_VERSION}"
        )
        return jsonify({
            "status": "error",
            "error_code": "AI_CONFIG_ERROR",
            "message": "AI service authentication is not configured correctly.",
            "pipeline_version": REPORT_PIPELINE_VERSION
        }), 500

    except Exception as e:
        err_str = str(e)
        if any(code in err_str for code in ["429", "RESOURCE_EXHAUSTED", "Quota exceeded", "quota"]):
            print(
                f"[REPORT DIAGNOSTIC] Route=/api/report | Model={get_model_name()} | "
                f"Success=False | Status=429 | GeminiError=RESOURCE_EXHAUSTED | "
                f"Size={len(image_bytes) if 'image_bytes' in locals() else 0} bytes | "
                f"Version={REPORT_PIPELINE_VERSION}"
            )
            return jsonify({
                "status": "error",
                "error_code": "RESOURCE_EXHAUSTED",
                "message": "AI analysis quota is temporarily exhausted. Please try again later.",
                "pipeline_version": REPORT_PIPELINE_VERSION
            }), 429

        print(
            f"[REPORT DIAGNOSTIC] Route=/api/report | Model={get_model_name()} | "
            f"Success=False | Status=500 | GeminiError={type(e).__name__} | "
            f"Size={len(image_bytes) if 'image_bytes' in locals() else 0} bytes | "
            f"Version={REPORT_PIPELINE_VERSION}"
        )
        return jsonify({
            "status": "error",
            "message": "AI analysis service encountered an unexpected error.",
            "pipeline_version": REPORT_PIPELINE_VERSION
        }), 500


@report_bp.route("/text-report", methods=["POST"], strict_slashes=False)
def text_report():
    print(">>> Text Report Request received")

    # Get text description
    text = request.form.get("text")
    if not text:
        # Fallback to json if sent as application/json
        if request.is_json:
            text = request.json.get("text")
        
        if not text:
            return jsonify({
                "status": "error",
                "message": "No text complaint provided."
            }), 400

    # Get User Location (optional)
    latitude = request.form.get("latitude") or (request.json.get("latitude") if request.is_json else None)
    longitude = request.form.get("longitude") or (request.json.get("longitude") if request.is_json else None)
    address = request.form.get("location") or (request.json.get("location") if request.is_json else None)

    # Resolve address using get_address if coordinates are provided
    if latitude and longitude and not address:
        try:
            address = get_address(latitude, longitude)
            print("Resolved Address from Coordinates:", address)
        except Exception as e:
            print("Error resolving address:", e)

    try:
        # Step 1 : Gemma Text Analysis
        issue_data = detect_issue_from_text(text)
        
        issue = issue_data.get("issue", "General Civic Issue")
        reason = issue_data.get("reason", text)
        severity = issue_data.get("severity", "Medium")
        department = issue_data.get("department", "Municipal Corporation")

        # Step 2 : Complaint Generation
        complaint_data = generate_complaint(
            issue=issue,
            reason=reason,
            severity=severity,
            department=department,
            latitude=latitude,
            longitude=longitude,
            address=address
        )

        complaint_subject = complaint_data.get(
            "complaint_subject",
            "Civic Issue Complaint"
        )
        complaint_body = complaint_data.get(
            "complaint_body",
            ""
        )

        # Final Complaint Report Formatted String (for Report model / dict consistency)
        complaint_string = f"""Civic Complaint Report
================================

Subject:
{complaint_subject}

Issue:
{issue}

Reason:
{reason}

Severity:
{severity}

Responsible Department:
{department}

Location:
{address if address else "Location not provided"}

Complaint:

{complaint_body}

--------------------------------

Generated By:
Raabta AI
Powered by Google Gemma 4
"""

        print("Text complaint generated successfully")

        # Create Report Object
        report = Report(
            issue,
            department,
            complaint_string,
            None  # No image for text reports
        )

        return jsonify({
            "status": "success",
            "message": "Complaint generated successfully.",
            "location": {
                "latitude": latitude if latitude else "",
                "longitude": longitude if longitude else "",
                "address": address if address else "Location not provided"
            },
            "ai_result": {
                "issue": issue,
                "reason": reason,
                "severity": severity,
                "department": department
            },
            "complaint": {
                "subject": complaint_subject,
                "body": complaint_body
            },
            "report": report.to_dict()
        })

    except GeminiQuotaError as q_err:
        print(f"[TEXT REPORT] Gemini quota exceeded: {q_err}")
        return jsonify({
            "status": "error",
            "error_code": "RESOURCE_EXHAUSTED",
            "message": "AI analysis quota is temporarily exhausted or rate limit reached. Please try again shortly."
        }), 429

    except GeminiConfigError as c_err:
        print(f"[TEXT REPORT] Gemini config error: {c_err}")
        return jsonify({
            "status": "error",
            "error_code": "AI_CONFIG_ERROR",
            "message": str(c_err)
        }), 500

    except Exception as e:
        print("Error processing text report:", e)
        return jsonify({
            "status": "error",
            "message": f"Failed to process complaint: {str(e)}"
        }), 500
