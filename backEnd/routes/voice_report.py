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
                "error": "Audio file is too large."
            }), 413

        # Read directly into in-memory bytes with size cap (no disk I/O)
        audio_bytes = audio.read(MAX_AUDIO_SIZE_BYTES + 1)

        if not audio_bytes or len(audio_bytes) < 10:
            return jsonify({
                "success": False,
                "error": "Invalid audio file: audio recording is empty or corrupt."
            }), 400

        if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
            return jsonify({
                "success": False,
                "error": "Audio file is too large."
            }), 413

        # Check API key configuration
        api_key = os.environ.get("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return jsonify({
                "success": False,
                "error": "AI service configuration error: GOOGLE_API_KEY is not configured in environment."
            }), 500

        mime_type = normalize_audio_mime_type(audio.mimetype, filename=audio.filename)
        print(f"\n[INFO] Audio received in-memory: {len(audio_bytes)} bytes | MIME: {mime_type} | Zero-disk mode")

        # --------------------------------
        # STEP 2 : Speech To Text (100% In-Memory)
        # --------------------------------
        try:
            voice_result = speech_to_text(audio_bytes, mime_type=mime_type)
            user_text = voice_result.get("text", "").strip()
        except ValueError as val_err:
            # Client error: invalid audio or unsupported format
            return jsonify({
                "success": False,
                "error": str(val_err)
            }), 400
        except Exception as stt_err:
            err_msg = str(stt_err)
            print(f"[ERROR] Audio transcription failed: {stt_err}")
            # Sanitize internal error details and API keys
            if "AIza" in err_msg or "api_key" in err_msg.lower():
                err_msg = "Error connecting to AI speech recognition service."
            elif "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                err_msg = "AI speech recognition service is temporarily busy. Please try again shortly."
            return jsonify({
                "success": False,
                "error": f"Audio processing error: {err_msg}"
            }), 502
        finally:
            # Release in-memory buffer immediately
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