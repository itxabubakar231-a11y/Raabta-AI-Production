import os
import io

def normalize_audio_mime_type(mime_type, filename=None):
    """
    Normalizes audio MIME type for Gemini Multimodal API.
    Strips browser parameter attributes like ';codecs=opus' or whitespace.
    """
    if mime_type:
        clean = mime_type.split(";")[0].strip().lower()
        mapping = {
            "audio/webm": "audio/webm",
            "audio/wav": "audio/wav",
            "audio/wave": "audio/wav",
            "audio/x-wav": "audio/wav",
            "audio/mp3": "audio/mp3",
            "audio/mpeg": "audio/mp3",
            "audio/ogg": "audio/ogg",
            "audio/oga": "audio/ogg",
            "audio/aac": "audio/aac",
            "audio/m4a": "audio/m4a",
            "audio/x-m4a": "audio/m4a",
            "audio/flac": "audio/flac",
            "video/webm": "audio/webm",  # Some browsers record in video/webm container with audio only
        }
        if clean in mapping:
            return mapping[clean]

    if filename:
        ext = os.path.splitext(filename)[1].lower()
        ext_map = {
            ".webm": "audio/webm",
            ".wav": "audio/wav",
            ".mp3": "audio/mp3",
            ".ogg": "audio/ogg",
            ".m4a": "audio/m4a",
            ".aac": "audio/aac",
            ".flac": "audio/flac"
        }
        if ext in ext_map:
            return ext_map[ext]

    return "audio/webm"


def transcribe_with_gemini(audio_bytes, mime_type="audio/webm"):
    """
    Zero-disk in-memory audio transcription using Google GenAI SDK.
    Uses Gemini 3.6 Flash multimodal audio processing directly from bytes.
    """
    from services.gemma_service import get_genai_client, get_model_name
    from google.genai import types

    client = get_genai_client()
    model = get_model_name()
    clean_mime = normalize_audio_mime_type(mime_type)

    prompt = (
        "You are an expert audio transcription assistant for Pakistani civic complaints (Raabta AI).\n"
        "Listen to this audio recording carefully.\n"
        "Transcribe exactly what was spoken by the user.\n"
        "The language may be Urdu, Roman Urdu, or English.\n"
        "Return ONLY the verbatim transcript text. Do NOT include quotes, explanations, prefixes, or commentary.\n"
        "If the audio is completely silent, empty, or incomprehensible noise, return: [UNCLEAR]"
    )

    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text=prompt),
                types.Part.from_bytes(data=audio_bytes, mime_type=clean_mime)
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
    elif hasattr(response, "candidates") and response.candidates:
        for c in response.candidates:
            if c.content and c.content.parts:
                text += "".join(p.text for p in c.content.parts if hasattr(p, "text") and p.text)
        text = text.strip()

    if text == "[UNCLEAR]" or not text:
        return {"language": "ur", "text": ""}

    return {
        "language": "ur",
        "text": text
    }


def speech_to_text(audio_source, mime_type="audio/webm"):
    """
    Zero-disk serverless audio transcription pipeline.
    
    ON VERCEL:
      Strict zero-disk processing via Gemini 3.6 Flash.
      Whisper model downloading to /tmp is completely bypassed.
      No temp files, no /tmp storage used.
      
    LOCAL:
      In-memory Gemini preferred; in-memory Whisper fallback if offline/no key.
    """
    from services.gemma_service import _load_environment
    _load_environment()

    # 1. Normalize audio input into in-memory bytes
    if isinstance(audio_source, (bytes, bytearray)):
        audio_bytes = bytes(audio_source)
    elif isinstance(audio_source, io.BytesIO):
        audio_bytes = audio_source.getvalue()
    elif hasattr(audio_source, "read"):
        audio_bytes = audio_source.read()
    elif isinstance(audio_source, str) and os.path.exists(audio_source):
        with open(audio_source, "rb") as f:
            audio_bytes = f.read()
    else:
        raise ValueError("Invalid audio source provided.")

    if not audio_bytes or len(audio_bytes) < 10:
        raise ValueError("Audio data is empty or too short to be processed.")

    clean_mime = normalize_audio_mime_type(mime_type)
    is_vercel = bool(os.environ.get("VERCEL"))

    # 2. Check for GOOGLE_API_KEY
    api_key = os.environ.get("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY")

    if is_vercel:
        # VERCEL PRODUCTION: STRICT ZERO-DISK
        # Whisper model download into /tmp (512MB limit) is strictly forbidden.
        if not api_key:
            raise ValueError(
                "GOOGLE_API_KEY is not configured in Vercel Environment Variables. "
                "Serverless audio transcription requires GOOGLE_API_KEY for zero-disk in-memory processing."
            )

        print("[INFO] Vercel serverless audio: transcribing in-memory with Gemini...")
        return transcribe_with_gemini(audio_bytes, mime_type=clean_mime)

    # LOCAL DEVELOPMENT
    if api_key:
        try:
            print("[INFO] Local development: attempting in-memory Gemini transcription...")
            return transcribe_with_gemini(audio_bytes, mime_type=clean_mime)
        except Exception as gemini_err:
            print(f"[WARN] Local Gemini audio transcription error: {gemini_err}. Trying local Whisper fallback...")

    # Offline local fallback: Whisper (in-memory buffer)
    try:
        from faster_whisper import WhisperModel
        print("[INFO] Running local Whisper in-memory fallback...")
        model = WhisperModel("base", device="cpu", compute_type="int8")
        segments, info = model.transcribe(io.BytesIO(audio_bytes), language="ur", beam_size=5)
        text = " ".join(s.text for s in segments).strip()
        return {
            "language": getattr(info, "language", "ur"),
            "text": text
        }
    except Exception as whisper_err:
        raise RuntimeError(f"Audio transcription failed: {whisper_err}") from whisper_err