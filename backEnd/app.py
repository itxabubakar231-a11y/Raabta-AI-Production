import sys
import os

if sys.platform == "win32":
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from dotenv import load_dotenv

# Reliable environment loading
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_env = os.path.join(current_dir, ".env")
root_env = os.path.join(current_dir, "..", ".env")
legacy_env = os.path.join(current_dir, "config.env")

if os.path.exists(backend_env):
    load_dotenv(backend_env)
elif os.path.exists(root_env):
    load_dotenv(root_env)
elif os.path.exists(legacy_env):
    load_dotenv(legacy_env)
else:
    load_dotenv()

# Safe API key diagnostics (never print or expose the key)
if os.getenv("GOOGLE_API_KEY"):
    print("[OK] GOOGLE_API_KEY detected")
else:
    print("[WARNING] GOOGLE_API_KEY not detected")

from flask import Flask, jsonify, request
from flask_cors import CORS

from routes.report import report_bp
from routes.voice_report import voice_report_bp

# Create Flask application
app = Flask(__name__)

import re

# Configure CORS safely (supports local dev and all Vercel production/preview deployments)
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    re.compile(r"^https://.*\.vercel\.app$")
]

cors_env = os.getenv("CORS_ORIGINS", "")
if cors_env:
    for origin in cors_env.split(","):
        origin = origin.strip()
        if origin and origin not in allowed_origins:
            allowed_origins.append(origin)

CORS(
    app,
    resources={r"/*": {"origins": allowed_origins}},
    supports_credentials=True
)

# Register Blueprints for both /api prefix and root (supports all serverless rewrite modes)
app.register_blueprint(
    report_bp,
    url_prefix="/api",
    name="report_api"
)
app.register_blueprint(
    report_bp,
    url_prefix="",
    name="report_direct"
)

app.register_blueprint(
    voice_report_bp,
    url_prefix="/api",
    name="voice_report_api"
)
app.register_blueprint(
    voice_report_bp,
    url_prefix="",
    name="voice_report_direct"
)

# Home Route (gracefully handles any stripped POST requests without returning 405)
@app.route("/", methods=["GET", "POST"], strict_slashes=False)
def home():
    if request.method == "POST":
        return jsonify({
            "status": "error",
            "message": "Root endpoint does not accept complaints directly. Please call /api/text-report, /api/report, or /api/voice-report."
        }), 400
    return "Welcome to Raabta AI Backend!"

# Health Check Endpoint (supports both /api/health and /health)
@app.route("/api/health", methods=["GET"], strict_slashes=False)
@app.route("/health", methods=["GET"], strict_slashes=False)
def health():
    api_key = os.getenv("GOOGLE_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    return jsonify({
        "success": True,
        "service": "Raabta AI API",
        "status": "healthy",
        "ai_configured": bool(api_key),
        "model": model
    }), 200


# Fallback handler if Vercel routes to the internal function entrypoint
@app.route("/api/index.py", methods=["GET", "POST"], strict_slashes=False)
@app.route("/api/index", methods=["GET", "POST"], strict_slashes=False)
def vercel_entrypoint():
    if request.method == "GET":
        return health()
    return jsonify({
        "status": "error",
        "message": "Direct function entrypoint called. Please send requests to /api/report, /api/text-report, or /api/voice-report."
    }), 400


class VercelPathFixMiddleware:
    """
    WSGI middleware that restores the real requested path on Vercel.
    Ensures that API routes (/api/health, /api/report, /api/text-report, /api/voice-report)
    are matched accurately and prevents PATH_INFO from being overwritten with
    internal script names (/api/index.py).
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        current_path = environ.get("PATH_INFO", "")

        # If PATH_INFO is already a valid API endpoint, leave it intact
        if current_path and current_path.startswith(("/api/health", "/api/report", "/api/text-report", "/api/voice-report", "/health", "/report", "/text-report", "/voice-report")):
            return self.wsgi_app(environ, start_response)

        # If PATH_INFO is missing or collapsed to root, inspect candidate headers
        candidates = [
            environ.get("REQUEST_URI"),
            environ.get("RAW_URI"),
            environ.get("HTTP_X_FORWARDED_URI"),
            environ.get("HTTP_X_ORIGINAL_URL"),
            environ.get("HTTP_X_VERCEL_PATH"),
            environ.get("HTTP_X_MATCHED_PATH"),
        ]

        for cand in candidates:
            if cand:
                clean = cand.split("?")[0].strip()
                if clean and clean not in ("/", "", "/api", "/api/", "/index.py", "/api/index.py", "/api/index"):
                    if not clean.endswith(".py"):
                        environ["PATH_INFO"] = clean
                        break

        return self.wsgi_app(environ, start_response)


# Attach middleware to Flask WSGI callable
app.wsgi_app = VercelPathFixMiddleware(app.wsgi_app)

# Run Flask Server
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )