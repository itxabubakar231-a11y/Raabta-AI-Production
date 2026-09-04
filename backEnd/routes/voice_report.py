from flask import Blueprint, request, jsonify
import os

from services.voice_input import speech_to_text, normalize_audio_mime_type
from services.voice_output import text_to_speech
from services.gemma_service import (
    detect_issue_from_text,
    generate_complaint
)

voice_report_bp = Blueprint(
    "voice_report",
    __name__
)

# 10 MB maximum audio size limit for serverless memory safety
MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024


@voice_report_bp.route("/voice-report", methods=["POST"], strict_slashes=False)
def voice_report():
    audio_bytes = None

    try:
        # --------------------------------
        # STEP 1 : In-Memory Audio Ingestion & Size Safety Check
        # --------------------------------
        if "audio" not in request.files:
            return jsonify({
                "success": False,
                "error": "Audio file missing."
            }), 400

        audio = request.files["audio"]

        if not audio or audio.filename == "":
            return jsonify({
                "success": False,
                "error": "No audio file selected."
            }), 400

        # Enforce maximum size from Content-Length header if present
        if request.content_length and request.content_length > MAX_AUDIO_SIZE_BYTES:
            return jsonify({
                "success": False,
                "error": "Audio file exceeds maximum allowed size limit of 10 MB."
            }), 400

        # Read directly into in-memory bytes with size cap
        audio_bytes = audio.read(MAX_AUDIO_SIZE_BYTES + 1)

        if not audio_bytes or len(audio_bytes) < 10:
            return jsonify({
                "success": False,
                "error": "Audio file is empty or too short."
            }), 400

        if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
            return jsonify({
                "success": False,
                "error": "Audio file exceeds maximum allowed size limit of 10 MB."
            }), 400

        mime_type = normalize_audio_mime_type(audio.mimetype, filename=audio.filename)
        print(f"\n[INFO] Audio received in-memory: {len(audio_bytes)} bytes | MIME: {mime_type} | Zero-disk mode")

        # --------------------------------
        # STEP 2 : Speech To Text (100% In-Memory)
        # --------------------------------
        try:
            voice_result = speech_to_text(audio_bytes, mime_type=mime_type)
            user_text = voice_result.get("text", "").strip()
        except Exception as stt_err:
            print(f"[ERROR] Audio transcription failed: {stt_err}")
            return jsonify({
                "success": False,
                "error": f"Audio processing error: {str(stt_err)}"
            }), 400
        finally:
            # Release memory buffer promptly
            audio_bytes = None

        try:
            print("\n========== TRANSCRIPTION ==========")
            print(user_text)
            print("===================================\n")
        except Exception:
            pass

        if not user_text:
            return jsonify({
                "success": False,
                "error": "Speech could not be recognized. Please speak clearly and try again."
            }), 400

        # --------------------------------
        # STEP 3 : Detect Issue (Gemini)
        # --------------------------------
        issue_data = detect_issue_from_text(user_text)

        try:
            print("\n========== ISSUE DATA ==========")
            print(issue_data)
            print("================================\n")
        except Exception:
            pass

        issue = issue_data.get(
            "issue",
            "General Civic Issue"
        )

        reason = issue_data.get(
            "reason",
            user_text
        )

        severity = issue_data.get(
            "severity",
            "Medium"
        )

        department = issue_data.get(
            "department",
            "Municipal Corporation"
        )

        # --------------------------------
        # STEP 4 : Generate Complaint (Gemini)
        # --------------------------------
        complaint = generate_complaint(
            issue=issue,
            reason=reason,
            severity=severity,
            department=department
        )

        if not isinstance(complaint, dict):
            complaint = {
                "complaint_subject": f"Complaint Regarding {issue}",
                "complaint_body": str(complaint)
            }

        print("\n========== COMPLAINT ==========")
        print(complaint)
        print("================================\n")

        # --------------------------------
        # STEP 5 : Generate Voice Response (Zero-Disk on Vercel)
        # --------------------------------
        voice_message = (
            f"Your complaint has been generated successfully. "
            f"The detected issue is {issue}. "
            f"It will be forwarded to {department}. "
            f"Thank you for using Raabta AI."
        )

        audio_file = None
        try:
            audio_file = text_to_speech(voice_message)
        except Exception as tts_err:
            print(f"[WARN] TTS generation skipped: {tts_err}")

        # --------------------------------
        # FINAL RESPONSE
        # --------------------------------
        return jsonify({
            "success": True,
            "transcription": user_text,
            "issue": issue_data,
            "department": department,
            "complaint": complaint,
            "voice_text": voice_message,
            "voice_file": audio_file
        }), 200

    except Exception as e:
        print("\n========== VOICE ROUTE ERROR ==========")
        print(e)
        print("=======================================\n")

        err_msg = str(e)
        if "AIza" in err_msg:
            err_msg = "Error connecting to AI service."

        return jsonify({
            "success": False,
            "error": err_msg
        }), 500