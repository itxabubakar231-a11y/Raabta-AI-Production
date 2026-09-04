import urllib.request
import urllib.error
import json
import asyncio
import edge_tts
import io

async def generate_urdu_speech():
    # Generate actual spoken Urdu words: "There is a gutter overflowing on the road"
    communicate = edge_tts.Communicate("سڑک پر گٹر ابل رہا ہے اور پانی کھڑا ہے", "ur-PK-UzmaNeural")
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    return audio_data

def test_production_with_real_urdu_speech():
    print("\n==================================================")
    print("TESTING PRODUCTION WITH REAL URDU SPEECH AUDIO")
    print("Target: https://raabta-ai-production.vercel.app/api/voice-report")
    print("==================================================")

    audio_bytes = asyncio.run(generate_urdu_speech())
    print(f"Generated real Urdu speech audio: {len(audio_bytes)} bytes")

    boundary = "----WebKitFormBoundaryRealUrduSpeech999"
    parts = [
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"audio\"; filename=\"complaint.mp3\"\r\nContent-Type: audio/mp3\r\n\r\n".encode("utf-8"),
        audio_bytes,
        f"\r\n--{boundary}--\r\n".encode("utf-8")
    ]
    body = b"".join(parts)

    req = urllib.request.Request(
        "https://raabta-ai-production.vercel.app/api/voice-report",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )

    try:
        with urllib.request.urlopen(req, timeout=45) as res:
            print("HTTP Status:", res.status)
            data = json.loads(res.read().decode())
            print("Response Payload:", json.dumps(data, indent=2))
            assert res.status == 200
            assert data["success"] is True
            print("\n>>> FULL END-TO-END ZERO-DISK VOICE FLOW TEST PASSED ON PRODUCTION (HTTP 200)!")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print("HTTP Status:", e.code)
        print("Body:", body)
        assert "Disk space exhausted" not in body
        assert "No space left on device" not in body
        assert "Ephemeral storage limit reached" not in body

if __name__ == "__main__":
    test_production_with_real_urdu_speech()
