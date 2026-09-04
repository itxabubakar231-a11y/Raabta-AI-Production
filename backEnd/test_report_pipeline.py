import io
import json
import pytest
from unittest.mock import patch
from PIL import Image

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from services.gemma_service import GeminiQuotaError, GeminiConfigError

def create_test_image(width=100, height=100, color="red", format="JPEG"):
    img = Image.new("RGB", (width, height), color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    buf.seek(0)
    return buf

def test_missing_image():
    client = app.test_client()
    response = client.post("/api/report", data={}, content_type="multipart/form-data")
    assert response.status_code == 400
    data = response.get_json()
    assert data["status"] == "error"
    assert "No image uploaded" in data["message"]
    assert data["pipeline_version"] == "gemini-report-v2"

def test_empty_image():
    client = app.test_client()
    empty_buf = io.BytesIO(b"")
    response = client.post(
        "/api/report",
        data={"image": (empty_buf, "empty.jpg", "image/jpeg")},
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["status"] == "error"
    assert "empty" in data["message"].lower()

def test_corrupt_image():
    client = app.test_client()
    corrupt_buf = io.BytesIO(b"NotAJpegFileAtAllJustRandomBytes1234567890")
    response = client.post(
        "/api/report",
        data={"image": (corrupt_buf, "corrupt.jpg", "image/jpeg")},
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    data = response.get_json()
    assert data["status"] == "error"
    assert "invalid or corrupt" in data["message"].lower()

def test_oversized_image():
    client = app.test_client()
    # 11 MB oversized buffer
    oversized_buf = io.BytesIO(b"X" * (11 * 1024 * 1024))
    response = client.post(
        "/api/report",
        data={"image": (oversized_buf, "large.jpg", "image/jpeg")},
        content_type="multipart/form-data"
    )
    assert response.status_code == 413
    data = response.get_json()
    assert data["status"] == "error"
    assert "too large" in data["message"].lower()

def test_gemini_quota_exhausted_returns_429():
    client = app.test_client()
    valid_img = create_test_image()

    with patch("routes.report.detect_issue", side_effect=GeminiQuotaError("Quota exceeded")):
        response = client.post(
            "/api/report",
            data={"image": (valid_img, "test.jpg", "image/jpeg")},
            content_type="multipart/form-data"
        )
        assert response.status_code == 429
        data = response.get_json()
        assert data["status"] == "error"
        assert data["error_code"] == "RESOURCE_EXHAUSTED"
        assert data["message"] == "AI analysis quota is temporarily exhausted. Please try again later."
        # Verify no raw google error JSON or stack trace exposed
        assert "generativelanguage.googleapis.com" not in data["message"]
        assert data["pipeline_version"] == "gemini-report-v2"

def test_gemini_config_error_returns_500():
    client = app.test_client()
    valid_img = create_test_image()

    with patch("routes.report.detect_issue", side_effect=GeminiConfigError("API key error")):
        response = client.post(
            "/api/report",
            data={"image": (valid_img, "test.jpg", "image/jpeg")},
            content_type="multipart/form-data"
        )
        assert response.status_code == 500
        data = response.get_json()
        assert data["status"] == "error"
        assert data["error_code"] == "AI_CONFIG_ERROR"
        assert data["message"] == "AI service authentication is not configured correctly."
        assert data["pipeline_version"] == "gemini-report-v2"

def test_successful_in_memory_image_report():
    client = app.test_client()
    valid_img = create_test_image()

    mock_issue_json = json.dumps({
        "issue": "Pothole",
        "reason": "Large pothole in road causing traffic disruption",
        "severity": "High",
        "department": "Municipal Corporation"
    })

    mock_complaint = {
        "complaint_subject": "Urgent Complaint Regarding Pothole",
        "complaint_body": "Respected Sir/Madam,\nPlease fix the pothole..."
    }

    with patch("routes.report.detect_issue", return_value=mock_issue_json):
        with patch("routes.report.generate_complaint", return_value=mock_complaint):
            response = client.post(
                "/api/report",
                data={
                    "image": (valid_img, "road.jpg", "image/jpeg"),
                    "latitude": "31.5204",
                    "longitude": "74.3587"
                },
                content_type="multipart/form-data"
            )
            assert response.status_code == 200
            data = response.get_json()
            assert data["status"] == "success"
            assert data["pipeline_version"] == "gemini-report-v2"
            assert data["ai_result"]["issue"] == "Pothole"
            assert data["complaint"]["subject"] == "Urgent Complaint Regarding Pothole"
            assert data["report"]["image_path"] == "road.jpg"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
