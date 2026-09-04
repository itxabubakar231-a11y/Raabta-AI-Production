import io
import json
import pytest
from unittest.mock import patch, MagicMock

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from services.gemma_service import GeminiQuotaError, GeminiConfigError

def create_dummy_webm():
    # Valid header bytes for webm
    return io.BytesIO(b"\x1a\x45\xdf\xa3" + b"dummy_webm_audio_content_for_in_memory_testing_1234567890")

def test_missing_audio():
    client = app.test_client()
    response = client.post("/api/voice-report", data={}, content_type="multipart/form-data")
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"] == "Audio recording is missing or invalid."
    assert data["pipeline_version"] == "gemini-voice-v2"

def test_empty_audio():
    client = app.test_client()
    empty_buf = io.BytesIO(b"")
    response = client.post(
        "/api/voice-report",
        data={"audio": (empty_buf, "voice.webm", "audio/webm")},
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"] == "Audio recording is missing or invalid."

def test_corrupt_or_too_short_audio():
    client = app.test_client()
    short_buf = io.BytesIO(b"123")
    response = client.post(
        "/api/voice-report",
        data={"audio": (short_buf, "voice.webm", "audio/webm")},
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["success"] is False
    assert data["error"] == "Audio recording is missing or invalid."

def test_oversized_audio():
    client = app.test_client()
    oversized_buf = io.BytesIO(b"A" * (11 * 1024 * 1024))
    response = client.post(
        "/api/voice-report",
        data={"audio": (oversized_buf, "large.webm", "audio/webm")},
        content_type="multipart/form-data"
    )
    assert response.status_code == 413
    data = response.get_json()
    assert data["success"] is False
    assert "too large" in data["error"].lower()

def test_gemini_429_quota_exhausted_returns_429_not_502():
    client = app.test_client()
    audio_buf = create_dummy_webm()

    with patch("routes.voice_report.speech_to_text", side_effect=GeminiQuotaError("Quota exceeded")):
        response = client.post(
            "/api/voice-report",
            data={"audio": (audio_buf, "voice.webm", "audio/webm;codecs=opus")},
            content_type="multipart/form-data"
        )
        assert response.status_code == 429
        data = response.get_json()
        assert data["success"] is False
        assert data["error_code"] == "RESOURCE_EXHAUSTED"
        assert data["error"] == "AI speech recognition quota is temporarily exhausted. Please try again later."
        assert data["pipeline_version"] == "gemini-voice-v2"

def test_gemini_auth_error_returns_500():
    client = app.test_client()
    audio_buf = create_dummy_webm()

    with patch("routes.voice_report.speech_to_text", side_effect=GeminiConfigError("Invalid API key")):
        response = client.post(
            "/api/voice-report",
            data={"audio": (audio_buf, "voice.webm", "audio/webm")},
            content_type="multipart/form-data"
        )
        assert response.status_code == 500
        data = response.get_json()
        assert data["success"] is False
        assert data["error_code"] == "AI_CONFIG_ERROR"
        assert data["error"] == "AI service authentication is not configured correctly."

def test_gemini_upstream_failure_returns_502():
    client = app.test_client()
    audio_buf = create_dummy_webm()

    with patch("routes.voice_report.speech_to_text", side_effect=Exception("503 Service Unavailable: upstream connection timeout")):
        response = client.post(
            "/api/voice-report",
            data={"audio": (audio_buf, "voice.webm", "audio/webm")},
            content_type="multipart/form-data"
        )
        assert response.status_code == 502
        data = response.get_json()
        assert data["success"] is False
        assert data["error_code"] == "UPSTREAM_ERROR"
        assert "temporarily unavailable" in data["error"].lower()

def test_successful_voice_pipeline():
    client = app.test_client()
    audio_buf = create_dummy_webm()

    mock_stt_result = {"language": "ur", "text": "سڑک پر گٹر ابل رہا ہے"}
    mock_issue = {
        "issue": "Overflowing Drain",
        "reason": "سڑک پر گٹر ابل رہا ہے",
        "severity": "High",
        "department": "Water and Sanitation Agency (WASA)"
    }
    mock_complaint = {
        "complaint_subject": "Urgent Complaint Regarding Overflowing Drain",
        "complaint_body": "Respected Sir/Madam,\nPlease fix the drain."
    }

    with patch("routes.voice_report.speech_to_text", return_value=mock_stt_result):
        with patch("routes.voice_report.detect_issue_from_text", return_value=mock_issue):
            with patch("routes.voice_report.generate_complaint", return_value=mock_complaint):
                response = client.post(
                    "/api/voice-report",
                    data={"audio": (audio_buf, "voice.webm", "audio/webm;codecs=opus")},
                    content_type="multipart/form-data"
                )
                assert response.status_code == 200
                data = response.get_json()
                assert data["success"] is True
                assert data["pipeline_version"] == "gemini-voice-v2"
                assert data["transcription"] == "سڑک پر گٹر ابل رہا ہے"
                assert data["issue"]["issue"] == "Overflowing Drain"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
