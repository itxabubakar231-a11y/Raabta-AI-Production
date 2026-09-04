import os
import io
import shutil
import tempfile
from faster_whisper import WhisperModel

_model = None

def cleanup_ephemeral_storage():
    """
    Aggressively cleans temporary caches and incomplete downloads in /tmp 
    to prevent 'IO Error: No space left on device (os error 28)' in serverless environments.
    """
    if not os.environ.get("VERCEL"):
        return

    cleanup_targets = [
        "/tmp/uploads",
        "/tmp/whisper/.incomplete",
        "/tmp/huggingface/hub/tmp",
        "/tmp/voice_reply.mp3"
    ]

    for target in cleanup_targets:
        try:
            if os.path.exists(target):
                if os.path.isdir(target):
                    shutil.rmtree(target, ignore_errors=True)
                else:
                    os.remove(target)
        except Exception:
            pass


def get_whisper_model():
    """
    Load Whisper model. On Vercel / serverless environments, defaults to 'tiny' 
    (~75MB) instead of 'base' (~145MB-290MB during reconstruction) to fit comfortably 
    within the 512MB ephemeral /tmp limit.
    """
    global _model
    if _model is None:
        cleanup_ephemeral_storage()
        print("Loading Whisper model...")
        model_size = "tiny" if os.environ.get("VERCEL") else "base"
        download_root = os.path.join("/tmp", "whisper") if os.environ.get("VERCEL") else None
        
        _model = WhisperModel(
            model_size,
            device="cpu",
            compute_type="int8",
            download_root=download_root
        )
        print(f"Whisper model ({model_size}) loaded successfully.")
    return _model


def transcribe_with_gemini(audio_bytes, mime_type="audio/webm"):
    """
    Zero-disk in-memory audio transcription using Gemini 3.6 Flash.
    Eliminates all local model downloading and ephemeral disk space limitations.
    """
    from services.gemma_service import get_genai_client, get_model_name
    from google.genai import types

    client = get_genai_client()
    model = get_model_name()

    prompt = (
        "You are an AI audio transcriber for a Pakistani civic complaint system (Raabta AI).\n"
        "Listen to the audio recording carefully and transcribe what the user says in Urdu, English, or Roman Urdu.\n"
        "Return ONLY the plain transcribed text. Do not include quotes, greetings, explanations, or metadata.\n"
        "If the audio is completely silent or unintelligible, reply with: [Unclear Speech]"
    )

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
                types.Part.from_bytes(data=audio_bytes, mime_type=mime_type or "audio/webm")
            ]
        )
    ]

    response = client.models.generate_content(
        model=model,
        contents=contents
    )

    text = ""
    if hasattr(response, "text") and response.text:
        text = response.text.strip()

    if text == "[Unclear Speech]":
        text = ""

    return {
        "language": "ur",
        "text": text
    }


def speech_to_text(audio_source, mime_type="audio/webm"):
    """
    Unified speech-to-text pipeline with in-memory buffer handling:
    1. Reads audio into memory (supports bytes, io.BytesIO, or file paths).
    2. Primary in serverless: Gemini in-memory audio transcription (0 MB disk footprint).
    3. Fallback: faster-whisper with ephemeral storage cleanup.
    """
    print("\n========== SPEECH TO TEXT ==========")

    # 1. Normalize audio to bytes
    audio_bytes = None
    file_path = None

    if isinstance(audio_source, str):
        file_path = audio_source
        if os.path.exists(audio_source):
            with open(audio_source, "rb") as f:
                audio_bytes = f.read()
    elif isinstance(audio_source, io.BytesIO):
        audio_bytes = audio_source.getvalue()
    elif isinstance(audio_source, (bytes, bytearray)):
        audio_bytes = bytes(audio_source)
    elif hasattr(audio_source, "read"):
        audio_bytes = audio_source.read()
    else:
        raise ValueError(f"Unsupported audio source type: {type(audio_source)}")

    if not audio_bytes or len(audio_bytes) < 10:
        raise ValueError("Audio file is empty or too short.")

    # 2. Attempt zero-disk Gemini transcription if API key is configured
    api_key = os.environ.get("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if api_key:
        try:
            print("[INFO] Transcribing audio with Gemini (zero disk footprint)...")
            gemini_result = transcribe_with_gemini(audio_bytes, mime_type=mime_type)
            if gemini_result and gemini_result.get("text"):
                text = gemini_result["text"]
                print("Gemini Transcription :", text[:100] if len(text) > 100 else text)
                print("====================================\n")
                return gemini_result
        except Exception as gemini_err:
            print(f"[WARN] Gemini audio transcription error: {gemini_err}. Falling back to Whisper...")

    # 3. Fallback: faster-whisper
    try:
        model = get_whisper_model()

        # If we have a file path, use it; otherwise use BytesIO buffer directly in-memory
        transcribe_input = file_path if (file_path and os.path.exists(file_path)) else io.BytesIO(audio_bytes)

        segments, info = model.transcribe(
            transcribe_input,
            language="ur",
            beam_size=5
        )

        text = ""
        for segment in segments:
            text += segment.text + " "

        text = text.strip()
        print("Detected Language :", getattr(info, "language", "unknown"))
        print("Transcription     :", text[:100] if len(text) > 100 else text)
        print("====================================\n")

        return {
            "language": getattr(info, "language", "ur"),
            "text": text
        }

    except Exception as whisper_err:
        err_msg = str(whisper_err)
        if "os error 28" in err_msg or "No space left on device" in err_msg:
            cleanup_ephemeral_storage()
            raise RuntimeError(
                "Disk space exhausted during audio processing in serverless environment. "
                "Ephemeral storage limit reached. Please verify GOOGLE_API_KEY is set in Vercel to use zero-disk in-memory audio processing."
            ) from whisper_err
        raise whisper_err