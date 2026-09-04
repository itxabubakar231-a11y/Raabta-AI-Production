import urllib.request
import urllib.error
import json
import io
from PIL import Image

def test_live_production():
    print("==========================================")
    print("TESTING PRODUCTION: https://raabta-ai-production.vercel.app")
    print("==========================================")

    # 1. Health check
    print("\n1. Testing GET /api/health...")
    req = urllib.request.Request("https://raabta-ai-production.vercel.app/api/health")
    with urllib.request.urlopen(req) as res:
        health_data = json.loads(res.read().decode())
        print("Health Status:", res.status)
        print("Health Data:", json.dumps(health_data, indent=2))
        assert health_data["model"] == "gemini-3.6-flash"

    # 2. Text Report
    print("\n2. Testing POST /api/text-report...")
    text_payload = json.dumps({"text": "Deep pothole causing accidents near Gulberg main boulevard, Lahore."}).encode("utf-8")
    req = urllib.request.Request(
        "https://raabta-ai-production.vercel.app/api/text-report",
        data=text_payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as res:
            print("Text Report Status:", res.status)
            text_data = json.loads(res.read().decode())
            print("Text Report Response:", json.dumps(text_data, indent=2))
            print(">>> TEXT REPORT: SUCCESS!")
    except urllib.error.HTTPError as e:
        print("Text Report HTTP Error:", e.code)
        print("Body:", e.read().decode())

    # 3. Image Report (The exact failing flow!)
    print("\n3. Testing POST /api/report (Image Complaint Flow)...")
    img = Image.new("RGB", (256, 256), color=(80, 80, 80))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    img_bytes = buf.getvalue()

    boundary = "----WebKitFormBoundaryLiveGemini36Test"
    parts = [
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"civic_issue.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n".encode("utf-8"),
        img_bytes,
        f"\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"latitude\"\r\n\r\n31.5204\r\n".encode("utf-8"),
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"longitude\"\r\n\r\n74.3587\r\n".encode("utf-8"),
        f"--{boundary}--\r\n".encode("utf-8")
    ]
    body = b"".join(parts)

    req = urllib.request.Request(
        "https://raabta-ai-production.vercel.app/api/report",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )

    try:
        with urllib.request.urlopen(req) as res:
            print("Image Report Status:", res.status)
            image_data = json.loads(res.read().decode())
            print("Image Report Response:", json.dumps(image_data, indent=2))
            print(">>> IMAGE REPORT: SUCCESS!")
    except urllib.error.HTTPError as e:
        print("Image Report HTTP Error:", e.code)
        print("Body:", e.read().decode())

if __name__ == "__main__":
    test_live_production()
