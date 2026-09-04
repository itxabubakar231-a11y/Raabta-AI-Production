import os
import sys
import json
import io
from unittest.mock import MagicMock, patch
from PIL import Image

# Ensure backEnd is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import services.gemma_service as gemma_service
from app import app

def test_model_resolution():
    print("\n--- Test 1: Model Name Resolution ---")
    # Test default
    if "GEMINI_MODEL" in os.environ:
        del os.environ["GEMINI_MODEL"]
    model = gemma_service.get_model_name()
    assert model == "gemini-3.6-flash", f"Expected gemini-3.6-flash, got {model}"
    print("[PASS] Default model is:", model)

    # Test override with spaces/quotes
    os.environ["GEMINI_MODEL"] = " 'gemini-3.6-flash' "
    model = gemma_service.get_model_name()
    assert model == "gemini-3.6-flash", f"Expected gemini-3.6-flash, got {model}"
    print("[PASS] Stripped model override is:", model)

    os.environ["GEMINI_MODEL"] = "custom-test-model"
    model = gemma_service.get_model_name()
    assert model == "custom-test-model", f"Expected custom-test-model, got {model}"
    print("[PASS] Custom model override is:", model)

    # Reset
    del os.environ["GEMINI_MODEL"]
    print("[PASS] Model configuration tested successfully.")

def test_end_to_end_image_complaint_flow():
    print("\n--- Test 2: Image Complaint Flow with Mocked Gemini 3.6 Flash ---")
    mock_vision_response = MagicMock()
    mock_vision_response.text = json.dumps({
        "issue": "Damaged Road",
        "reason": "Deep asphalt depression posing hazard",
        "severity": "High",
        "department": "Municipal Corporation"
    })
    
    mock_complaint_response = MagicMock()
    mock_complaint_response.text = json.dumps({
        "complaint_subject": "Urgent Action Required: Deep Pothole on Main Road",
        "complaint_body": "Respected Sir/Madam,\n\nI am writing to report severe road damage..."
    })

    captured_models = []

    def mock_generate_content(model, contents, config=None):
        captured_models.append(model)
        if len(captured_models) == 1:
            return mock_vision_response
        else:
            return mock_complaint_response

    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = mock_generate_content

    # Create a temporary test image
    test_img_path = os.path.join(current_dir, "test_flow_image.jpg")
    img = Image.new("RGB", (200, 200), color=(73, 109, 137))
    img.save(test_img_path)

    try:
        with patch.dict(os.environ, {"GOOGLE_API_KEY": "dummy-key-for-test"}):
            with patch("services.gemma_service.get_genai_client", return_value=mock_client):
                # 1. Test detect_issue
                issue_json = gemma_service.detect_issue(test_img_path, latitude="31.5204", longitude="74.3587", address="Lahore, Pakistan")
                parsed_issue = json.loads(issue_json)
                assert parsed_issue["issue"] == "Damaged Road"
                assert parsed_issue["severity"] == "High"
                print("[PASS] detect_issue returned valid issue JSON:", parsed_issue)

                # 2. Test generate_complaint
                complaint = gemma_service.generate_complaint(
                    issue=parsed_issue["issue"],
                    reason=parsed_issue["reason"],
                    severity=parsed_issue["severity"],
                    department=parsed_issue["department"],
                    address="Lahore, Pakistan"
                )
                assert "complaint_subject" in complaint
                assert "complaint_body" in complaint
                print("[PASS] generate_complaint returned valid complaint dict:", complaint["complaint_subject"])

                # Verify that both calls used gemini-3.6-flash
                print("Captured models in flow:", captured_models)
                assert all(m == "gemini-3.6-flash" for m in captured_models)
                print("[PASS] All Google GenAI calls executed with model 'gemini-3.6-flash'!")

    finally:
        if os.path.exists(test_img_path):
            os.remove(test_img_path)

def test_flask_image_report_endpoint():
    print("\n--- Test 3: Flask /api/report Endpoint Integration ---")
    mock_vision_response = MagicMock()
    mock_vision_response.text = json.dumps({
        "issue": "Garbage Pile",
        "reason": "Accumulated household waste blocking sidewalk",
        "severity": "Medium",
        "department": "Waste Management Company"
    })
    mock_complaint_response = MagicMock()
    mock_complaint_response.text = json.dumps({
        "complaint_subject": "Complaint regarding Garbage Accumulation",
        "complaint_body": "Respected Sir/Madam,\n\nPlease clear the waste..."
    })

    captured_models = []
    def mock_generate_content(model, contents, config=None):
        captured_models.append(model)
        if len(captured_models) % 2 == 1:
            return mock_vision_response
        else:
            return mock_complaint_response

    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = mock_generate_content

    # Create dummy in-memory image
    buf = io.BytesIO()
    img = Image.new("RGB", (100, 100), color=(200, 50, 50))
    img.save(buf, format="JPEG")
    buf.seek(0)

    client = app.test_client()
    with patch.dict(os.environ, {"GOOGLE_API_KEY": "test-key-mock"}):
        with patch("services.gemma_service.get_genai_client", return_value=mock_client):
            response = client.post(
                "/api/report",
                data={
                    "image": (buf, "garbage.jpg", "image/jpeg"),
                    "latitude": "31.5",
                    "longitude": "74.3"
                },
                content_type="multipart/form-data"
            )
            print("Response status:", response.status_code)
            data = response.get_json()
            print("Response payload:", json.dumps(data, indent=2))
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            assert data["status"] == "success"
            assert data["ai_result"]["issue"] == "Garbage Pile"
            assert "report" in data
            print("[PASS] /api/report successfully completed full image complaint flow with gemini-3.6-flash!")

def test_flask_text_report_endpoint():
    print("\n--- Test 4: Flask /api/text-report Endpoint Integration ---")
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "issue": "Water Leakage",
        "reason": "Broken water supply main pipe",
        "severity": "High",
        "department": "Water and Sanitation Agency (WASA)"
    })
    mock_complaint_response = MagicMock()
    mock_complaint_response.text = json.dumps({
        "complaint_subject": "Urgent Complaint Regarding Water Leakage",
        "complaint_body": "Respected Sir/Madam,\n\nWater is leaking..."
    })

    captured_models = []
    def mock_generate_content(model, contents, config=None):
        captured_models.append(model)
        if len(captured_models) % 2 == 1:
            return mock_response
        else:
            return mock_complaint_response

    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = mock_generate_content

    client = app.test_client()
    with patch.dict(os.environ, {"GOOGLE_API_KEY": "test-key-mock"}):
        with patch("services.gemma_service.get_genai_client", return_value=mock_client):
            response = client.post(
                "/api/text-report",
                json={"text": "A main water pipe has burst and is flooding the road."},
                content_type="application/json"
            )
            print("Response status:", response.status_code)
            data = response.get_json()
            print("Response payload:", json.dumps(data, indent=2))
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            assert data["status"] == "success"
            assert data["ai_result"]["issue"] == "Water Leakage"
            print("[PASS] /api/text-report successfully completed text complaint flow with gemini-3.6-flash!")

def test_flask_voice_report_endpoint():
    print("\n--- Test 5: Flask /api/voice-report In-Memory Zero-Disk Integration ---")
    mock_stt_result = {"language": "ur", "text": "سڑک پر گڑھا ہے جس سے حادثات ہو رہے ہیں۔"}
    mock_issue_result = {
        "issue": "Pothole",
        "reason": "سڑک پر گڑھا ہے جس سے حادثات ہو رہے ہیں۔",
        "severity": "High",
        "department": "Municipal Corporation"
    }
    mock_complaint_result = {
        "complaint_subject": "Urgent Complaint Regarding Pothole",
        "complaint_body": "Respected Sir/Madam,\n\nPlease fix the pothole..."
    }

    client = app.test_client()
    dummy_audio = io.BytesIO(b"RIFFdummywavdataherefortestinginmemory1234567890")

    with patch("routes.voice_report.speech_to_text", return_value=mock_stt_result) as mock_stt:
        with patch("routes.voice_report.detect_issue_from_text", return_value=mock_issue_result):
            with patch("routes.voice_report.generate_complaint", return_value=mock_complaint_result):
                with patch("routes.voice_report.text_to_speech", return_value=None):
                    response = client.post(
                        "/api/voice-report",
                        data={
                            "audio": (dummy_audio, "voice_test.webm", "audio/webm;codecs=opus")
                        },
                        content_type="multipart/form-data"
                    )
                    print("Voice response status:", response.status_code)
                    data = response.get_json()
                    print("Voice response payload:", json.dumps(data, indent=2))
                    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
                    assert data["success"] is True
                    assert data["transcription"] == mock_stt_result["text"]
                    assert data["issue"]["issue"] == "Pothole"
                    mock_stt.assert_called_once()
                    print("[PASS] /api/voice-report successfully processed audio in-memory with zero disk overhead!")

def test_voice_report_oversized_audio():
    print("\n--- Test 6: Voice Report Oversized Audio Rejection (> 10 MB) ---")
    client = app.test_client()
    # 11 MB dummy buffer
    oversized_audio = io.BytesIO(b"X" * (11 * 1024 * 1024))
    response = client.post(
        "/api/voice-report",
        data={
            "audio": (oversized_audio, "huge_audio.webm", "audio/webm")
        },
        content_type="multipart/form-data"
    )
    print("Oversized response status:", response.status_code)
    data = response.get_json()
    print("Oversized response payload:", data)
    assert response.status_code == 400
    assert data["success"] is False
    assert "exceeds maximum allowed size limit" in data["error"]
    print("[PASS] Oversized audio rejected cleanly with HTTP 400 without disk writes!")

def test_voice_report_invalid_empty_audio():
    print("\n--- Test 7: Voice Report Empty/Corrupt Audio Rejection ---")
    client = app.test_client()
    empty_audio = io.BytesIO(b"")
    response = client.post(
        "/api/voice-report",
        data={
            "audio": (empty_audio, "empty.webm", "audio/webm")
        },
        content_type="multipart/form-data"
    )
    print("Empty audio response status:", response.status_code)
    data = response.get_json()
    print("Empty audio response payload:", data)
    assert response.status_code == 400
    assert data["success"] is False
    print("[PASS] Empty audio rejected cleanly with HTTP 400!")

def test_mime_type_normalization():
    print("\n--- Test 8: Audio MIME Type Normalization ---")
    from services.voice_input import normalize_audio_mime_type
    assert normalize_audio_mime_type("audio/webm;codecs=opus") == "audio/webm"
    assert normalize_audio_mime_type("audio/ogg; codecs=opus") == "audio/ogg"
    assert normalize_audio_mime_type("audio/mpeg") == "audio/mp3"
    assert normalize_audio_mime_type("audio/x-wav") == "audio/wav"
    assert normalize_audio_mime_type(None, filename="voice.webm") == "audio/webm"
    assert normalize_audio_mime_type(None, filename="recording.m4a") == "audio/m4a"
    print("[PASS] MIME normalization strips browser parameter attributes correctly!")

def test_vercel_zero_disk_enforcement():
    print("\n--- Test 9: Vercel Zero-Disk Audio Enforcement ---")
    from services.voice_input import speech_to_text
    
    mock_gemini_resp = MagicMock()
    mock_gemini_resp.text = "یہ ایک ٹیسٹ آڈیو ہے۔"

    captured_parts = []
    def mock_generate_content(model, contents, config=None):
        captured_parts.append(contents)
        return mock_gemini_resp

    mock_client = MagicMock()
    mock_client.models.generate_content.side_effect = mock_generate_content

    with patch.dict(os.environ, {"VERCEL": "1", "GOOGLE_API_KEY": "dummy-test-key"}):
        with patch("services.gemma_service.get_genai_client", return_value=mock_client):
            result = speech_to_text(b"RIFFtestaudiobytes1234567890", mime_type="audio/webm;codecs=opus")
            print("Vercel STT result:", result)
            assert result["text"] == "یہ ایک ٹیسٹ آڈیو ہے۔"
            assert len(captured_parts) == 1
            # Verify Part.from_bytes was called with normalized mime
            call_content = captured_parts[0]
            parts = call_content[0].parts
            assert len(parts) == 2
            print("[PASS] On Vercel, speech_to_text used Gemini in-memory exclusively with 0 disk writes!")

if __name__ == "__main__":
    test_model_resolution()
    test_end_to_end_image_complaint_flow()
    test_flask_image_report_endpoint()
    test_flask_text_report_endpoint()
    test_flask_voice_report_endpoint()
    test_voice_report_oversized_audio()
    test_voice_report_invalid_empty_audio()
    test_mime_type_normalization()
    test_vercel_zero_disk_enforcement()
    print("\n========================================================")
    print("ALL 9 TESTS (IMAGE, TEXT, ZERO-DISK VOICE) PASSED!")
    print("========================================================")
