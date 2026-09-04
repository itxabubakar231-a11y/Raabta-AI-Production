import os
import asyncio

async def generate_voice(text):
    if os.environ.get("VERCEL"):
        # Serverless zero-disk: client browser executes speech confirmation via window.speechSynthesis
        return None

    try:
        import edge_tts
        output = "voice_reply.mp3"
        communicate = edge_tts.Communicate(
            text,
            "ur-PK-UzmaNeural"
        )
        await communicate.save(output)
        return output
    except Exception as e:
        print("[WARN] Local TTS generation failed:", e)
        return None

def text_to_speech(text):
    if os.environ.get("VERCEL"):
        return None
    return asyncio.run(generate_voice(text))