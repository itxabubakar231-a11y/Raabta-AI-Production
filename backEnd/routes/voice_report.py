from flask import Blueprint, request, jsonify
import os

from services.voice_input import speech_to_text, normalize_audio_mime_type
from services.voice_output import text_to_speech
from services.gemma_service import (
    detect_issue_from_text,
    generate_complaint,
    get_model_name,
    GeminiQuotaError,
    GeminiConfigError
)

voice_report_bp = Blueprint(
    "voice_report",
    __name__
)

# 10 MB maximum audio size limit for serverless memory safety
MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024
VOICE_PIPELINE_VERSION = "gemini-voice-v2"


@voice_report_bp.route("/voice-report", methods=["POST"], strict_slashes=False)
def voice_report():
    audio_bytes = None
    model_name = get_model_name()

    # STAGE: RECEIVE
    print(f"[VOICE DIAGNOSTIC] Stage=RECEIVE | Route=/api/voice-report | Model={model_name} | Version={VOICE_PIPELINE_VERSION}")

    try:
        # --------------------------------
        # STAGE: VALIDATION (In-Memory Ingestion & Size Safety Check)
        # --------------------------------
        if "audio" not in request.files:
            print(f"[VOICE DIAGNOSTIC] Stage=VALIDATION | Success=False | Status=400 | Error=MISSING_AUDIO_FILE | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error": "Audio recording is missing or invalid.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 400

        audio = request.files["audio"]

        if not audio or audio.filename == "":
            print(f"[VOICE DIAGNOSTIC] Stage=VALIDATION | Success=False | Status=400 | Error=EMPTY_AUDIO_FILENAME | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error": "Audio recording is missing or invalid.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 400

        # Enforce maximum size from Content-Length header if present
        if request.content_length and request.content_length > MAX_AUDIO_SIZE_BYTES:
            print(f"[VOICE DIAGNOSTIC] Stage=VALIDATION | Success=False | Status=413 | Error=PAYLOAD_TOO_LARGE | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error": "Audio file is too large.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 413

        # Read directly into in-memory bytes with size cap (zero disk I/O)
        audio_bytes = audio.read(MAX_AUDIO_SIZE_BYTES + 1)

        if len(audio_bytes) > MAX_AUDIO_SIZE_BYTES:
            print(f"[VOICE DIAGNOSTIC] Stage=VALIDATION | Success=False | Status=413 | Error=STREAM_TOO_LARGE | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error": "Audio file is too large.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 413

        if not audio_bytes or len(audio_bytes) < 10:
            print(f"[VOICE DIAGNOSTIC] Stage=VALIDATION | Success=False | Status=400 | Error=EMPTY_OR_CORRUPT_BYTES | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error": "Audio recording is missing or invalid.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 400

        # Check API key configuration
        api_key = os.environ.get("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print(f"[VOICE DIAGNOSTIC] Stage=VALIDATION | Success=False | Status=500 | Error=AUTH_CONFIG_ERROR | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error_code": "AI_CONFIG_ERROR",
                "error": "AI service authentication is not configured correctly.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 500

        # --------------------------------
        # STAGE: MIME & FORMAT DETECTION
        # --------------------------------
        mime_type = normalize_audio_mime_type(audio.mimetype, filename=audio.filename)
        print(f"[VOICE DIAGNOSTIC] Stage=MIME | Size={len(audio_bytes)} bytes | RawMIME={audio.mimetype} | NormalizedMIME={mime_type} | Version={VOICE_PIPELINE_VERSION}")

        # --------------------------------
        # STAGE: AUDIO_PROCESSING & GEMINI TRANSCRIPTION (100% In-Memory)
        # --------------------------------
        print(f"[VOICE DIAGNOSTIC] Stage=GEMINI | Model={model_name} | Size={len(audio_bytes)} bytes | MIME={mime_type} | Version={VOICE_PIPELINE_VERSION}")

        try:
            voice_result = speech_to_text(audio_bytes, mime_type=mime_type)
            user_text = voice_result.get("text", "").strip()
        except GeminiQuotaError as q_err:
            print(f"[VOICE DIAGNOSTIC] Stage=GEMINI | ErrorCategory=RESOURCE_EXHAUSTED | Status=429 | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error_code": "RESOURCE_EXHAUSTED",
                "error": "AI speech recognition quota is temporarily exhausted. Please try again later.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 429
        except GeminiConfigError as cfg_err:
            print(f"[VOICE DIAGNOSTIC] Stage=GEMINI | ErrorCategory=AUTH_CONFIG_ERROR | Status=500 | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error_code": "AI_CONFIG_ERROR",
                "error": "AI service authentication is not configured correctly.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 500
        except ValueError as val_err:
            print(f"[VOICE DIAGNOSTIC] Stage=AUDIO_PROCESSING | ErrorCategory=INVALID_AUDIO | Status=400 | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error": "Audio recording is missing or invalid.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 400
        except Exception as stt_err:
            err_msg = str(stt_err)
            print(f"[VOICE DIAGNOSTIC] Stage=GEMINI | ErrorCategory=GENERIC_STT_ERROR | Details={type(stt_err).__name__} | Version={VOICE_PIPELINE_VERSION}")

            if any(code in err_msg for code in ["429", "RESOURCE_EXHAUSTED", "Quota exceeded", "quota"]):
                return jsonify({
                    "success": False,
                    "error_code": "RESOURCE_EXHAUSTED",
                    "error": "AI speech recognition quota is temporarily exhausted. Please try again later.",
                    "pipeline_version": VOICE_PIPELINE_VERSION
                }), 429

            if any(code in err_msg for code in ["401", "403", "API_KEY_INVALID", "auth"]):
                return jsonify({
                    "success": False,
                    "error_code": "AI_CONFIG_ERROR",
                    "error": "AI service authentication is not configured correctly.",
                    "pipeline_version": VOICE_PIPELINE_VERSION
                }), 500

            if any(code in err_msg for code in ["400", "INVALID_ARGUMENT", "unsupported"]):
                return jsonify({
                    "success": False,
                    "error": "Audio recording is missing or invalid.",
                    "pipeline_version": VOICE_PIPELINE_VERSION
                }), 400

            if any(code in err_msg for code in ["timeout", "timed out", "503", "504", "unavailable", "connection"]):
                return jsonify({
                    "success": False,
                    "error_code": "UPSTREAM_ERROR",
                    "error": "AI speech recognition service is temporarily unavailable. Please try again shortly.",
                    "pipeline_version": VOICE_PIPELINE_VERSION
                }), 502

            return jsonify({
                "success": False,
                "error": "AI voice analysis encountered an unexpected error.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 500
        finally:
            audio_bytes = None

        if not user_text:
            print(f"[VOICE DIAGNOSTIC] Stage=GEMINI | Success=False | Status=400 | Error=UNCLEAR_SPEECH | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error": "Speech could not be recognized. Please speak clearly and try again.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 400

        # --------------------------------
        # STAGE: DETECT ISSUE & GENERATE COMPLAINT (Gemini)
        # --------------------------------
        issue_data = detect_issue_from_text(user_text)
        issue = issue_data.get("issue", "General Civic Issue")
        reason = issue_data.get("reason", user_text)
        severity = issue_data.get("severity", "Medium")
        department = issue_data.get("department", "Municipal Corporation")

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

        # --------------------------------
        # STAGE: RESPONSE GENERATION (Zero-Disk on Vercel)
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
        except Exception:
            pass

        print(f"[VOICE DIAGNOSTIC] Stage=RESPONSE | Success=True | Status=200 | TranscriptionLength={len(user_text)} | Version={VOICE_PIPELINE_VERSION}")

        return jsonify({
            "success": True,
            "pipeline_version": VOICE_PIPELINE_VERSION,
            "transcription": user_text,
            "issue": issue_data,
            "department": department,
            "complaint": complaint,
            "voice_text": voice_message,
            "voice_file": audio_file
        }), 200

    except GeminiQuotaError as q_err:
        print(f"[VOICE DIAGNOSTIC] Stage=GEMINI | ErrorCategory=RESOURCE_EXHAUSTED | Status=429 | Version={VOICE_PIPELINE_VERSION}")
        return jsonify({
            "success": False,
            "error_code": "RESOURCE_EXHAUSTED",
            "error": "AI speech recognition quota is temporarily exhausted. Please try again later.",
            "pipeline_version": VOICE_PIPELINE_VERSION
        }), 429

    except GeminiConfigError as cfg_err:
        print(f"[VOICE DIAGNOSTIC] Stage=GEMINI | ErrorCategory=AUTH_CONFIG_ERROR | Status=500 | Version={VOICE_PIPELINE_VERSION}")
        return jsonify({
            "success": False,
            "error_code": "AI_CONFIG_ERROR",
            "error": "AI service authentication is not configured correctly.",
            "pipeline_version": VOICE_PIPELINE_VERSION
        }), 500

    except Exception as e:
        err_msg = str(e)
        if any(code in err_msg for code in ["429", "RESOURCE_EXHAUSTED", "Quota exceeded", "quota"]):
            print(f"[VOICE DIAGNOSTIC] Stage=GEMINI | ErrorCategory=RESOURCE_EXHAUSTED | Status=429 | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error_code": "RESOURCE_EXHAUSTED",
                "error": "AI speech recognition quota is temporarily exhausted. Please try again later.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 429

        if any(code in err_msg for code in ["timeout", "timed out", "503", "504", "unavailable"]):
            print(f"[VOICE DIAGNOSTIC] Stage=UPSTREAM | Status=502 | Version={VOICE_PIPELINE_VERSION}")
            return jsonify({
                "success": False,
                "error_code": "UPSTREAM_ERROR",
                "error": "AI speech recognition service is temporarily unavailable. Please try again shortly.",
                "pipeline_version": VOICE_PIPELINE_VERSION
            }), 502

        print(f"[VOICE DIAGNOSTIC] Stage=UNEXPECTED | Status=500 | Error={type(e).__name__} | Version={VOICE_PIPELINE_VERSION}")
        return jsonify({
            "success": False,
            "error": "AI voice analysis encountered an unexpected error.",
            "pipeline_version": VOICE_PIPELINE_VERSION
        }), 500