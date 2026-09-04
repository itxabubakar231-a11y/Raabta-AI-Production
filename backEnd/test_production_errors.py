import urllib.request
import urllib.error
import json
import io

BASE = "https://raabta-ai-production.vercel.app/api/voice-report"

def test_production_error_responses():
    print("Testing production error handling on:", BASE)

    # Test 1: Missing audio field -> Expect 400
    try:
        boundary = "----WebKitBoundaryMissingAudio"
        body = f"--{boundary}--\r\n".encode()
        req = urllib.request.Request(BASE, data=body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
        urllib.request.urlopen(req)
        assert False, "Should have failed with 400"
    except urllib.error.HTTPError as e:
        print("Test 1 (Missing Audio): Status =", e.code, "| Body =", e.read().decode())
        assert e.code == 400

    # Test 2: Empty/corrupt audio file (< 10 bytes) -> Expect 400
    try:
        boundary = "----WebKitBoundaryEmptyAudio"
        parts = [
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"audio\"; filename=\"empty.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode(),
            b"",
            f"\r\n--{boundary}--\r\n".encode()
        ]
        req = urllib.request.Request(BASE, data=b"".join(parts), headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
        urllib.request.urlopen(req)
        assert False, "Should have failed with 400"
    except urllib.error.HTTPError as e:
        print("Test 2 (Empty Audio): Status =", e.code, "| Body =", e.read().decode())
        assert e.code == 400

    # Test 3: Oversized audio file (> 10 MB) -> Expect HTTP 413
    try:
        boundary = "----WebKitBoundaryOversizedAudio"
        parts = [
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"audio\"; filename=\"huge.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode(),
            b"X" * (11 * 1024 * 1024),
            f"\r\n--{boundary}--\r\n".encode()
        ]
        req = urllib.request.Request(BASE, data=b"".join(parts), headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
        urllib.request.urlopen(req)
        assert False, "Should have failed with 413"
    except urllib.error.HTTPError as e:
        print("Test 3 (Oversized Audio > 10MB): Status =", e.code, "| Body =", e.read().decode())
        assert e.code == 413

    print("\n>>> ALL LIVE PRODUCTION ERROR RESPONSES (400, 413) VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_production_error_responses()
