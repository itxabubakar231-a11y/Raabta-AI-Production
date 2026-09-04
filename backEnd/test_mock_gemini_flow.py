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

if __name__ == "__main__":
    test_model_resolution()
    test_end_to_end_image_complaint_flow()
    test_flask_image_report_endpoint()
    test_flask_text_report_endpoint()
    print("\n==========================================")
    print("ALL GEMINI 3.6 FLASH FLOW TESTS PASSED!")
    print("==========================================")
