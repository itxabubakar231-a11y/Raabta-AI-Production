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

# Environment loading with priority:
# 1. System / Platform environment variables (e.g. Vercel Environment Variables: os.environ["GOOGLE_API_KEY"])
# 2. Local development file: backEnd/.env
# 3. Project root: .env
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_env = os.path.join(current_dir, ".env")
root_env = os.path.join(current_dir, "..", ".env")
legacy_env = os.path.join(current_dir, "config.env")

if not os.environ.get("GOOGLE_API_KEY"):
    if os.path.exists(backend_env):
        load_dotenv(backend_env)
    elif os.path.exists(root_env):
        load_dotenv(root_env)
    elif os.path.exists(legacy_env):
        load_dotenv(legacy_env)
    else:
        load_dotenv()

# Safe startup/configuration check (never prints the actual secret)
if os.environ.get("GOOGLE_API_KEY"):
    print("GOOGLE_API_KEY is configured")
else:
    print("GOOGLE_API_KEY is missing")

from flask import Flask, jsonify, request
from flask_cors import CORS
import re

# Database initialization
from database import get_db, get_db_status
from seed_demo import seed_demo_database

# Legacy routes (kept 100% backwards-compatible)
from routes.report import report_bp
from routes.voice_report import voice_report_bp

# Civic Intelligence Layer blueprints
from routes.auth_routes import auth_bp
from routes.reports_routes import reports_bp
from routes.department_routes import department_bp
from routes.cluster_routes import cluster_bp
from routes.insights_routes import insights_bp
from routes.notifications_routes import notifications_bp
from routes.admin_routes import admin_bp
from routes.demo_routes import demo_bp

# Create Flask application
app = Flask(__name__)

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

# -----------------------------
# Blueprint Registrations
# -----------------------------

# 1. Legacy Report Blueprints (Preserved)
app.register_blueprint(report_bp, url_prefix="/api", name="report_api")
app.register_blueprint(report_bp, url_prefix="", name="report_direct")

app.register_blueprint(voice_report_bp, url_prefix="/api", name="voice_report_api")
app.register_blueprint(voice_report_bp, url_prefix="", name="voice_report_direct")

# 2. Production Authentication Blueprints
app.register_blueprint(auth_bp, url_prefix="/api/auth", name="auth_api")
app.register_blueprint(auth_bp, url_prefix="/auth", name="auth_direct")

# 3. Multimodal Civic Reports & Triage Blueprints
app.register_blueprint(reports_bp, url_prefix="/api/reports", name="reports_api")
app.register_blueprint(reports_bp, url_prefix="/reports", name="reports_direct")

# 4. Department Operations Command Center Blueprints
app.register_blueprint(department_bp, url_prefix="/api/departments", name="departments_api")
app.register_blueprint(department_bp, url_prefix="/departments", name="departments_direct")

# 5. Proximity Clustering Blueprints
app.register_blueprint(cluster_bp, url_prefix="/api/clusters", name="clusters_api")
app.register_blueprint(cluster_bp, url_prefix="/clusters", name="clusters_direct")

# 6. Civic Hotspots & Trends Insights Blueprints
app.register_blueprint(insights_bp, url_prefix="/api/insights", name="insights_api")
app.register_blueprint(insights_bp, url_prefix="/insights", name="insights_direct")

# 7. In-App Notifications Blueprints
app.register_blueprint(notifications_bp, url_prefix="/api/notifications", name="notifications_api")
app.register_blueprint(notifications_bp, url_prefix="/notifications", name="notifications_direct")

# 8. Administration & Audit Blueprints
app.register_blueprint(admin_bp, url_prefix="/api/admin", name="admin_api")
app.register_blueprint(admin_bp, url_prefix="/admin", name="admin_direct")

# 9. Hackathon Demo Data Blueprints
app.register_blueprint(demo_bp, url_prefix="/api/demo", name="demo_api")
app.register_blueprint(demo_bp, url_prefix="/demo", name="demo_direct")

# Seed baseline demo data on initialization only in development or explicit flag
if os.environ.get("FLASK_ENV") == "development" or os.environ.get("ENABLE_DEMO_SEED") == "true":
    try:
        db = get_db()
        if db.civic_reports.count_documents({}) == 0:
            seed_demo_database(reset=False)
    except Exception as e:
        print(f"[Startup] Demo seeder skipped: {e}")

# Home Route
@app.route("/", methods=["GET", "POST"], strict_slashes=False)
def home():
    if request.method == "POST":
        return jsonify({
            "status": "error",
            "message": "Root endpoint does not accept complaints directly. Please call /api/reports, /api/report, /api/text-report, or /api/voice-report."
        }), 400
    return "Welcome to Raabta AI Civic Intelligence Platform!"

# Health Check Endpoint
@app.route("/api/health", methods=["GET"], strict_slashes=False)
@app.route("/health", methods=["GET"], strict_slashes=False)
def health():
    api_key = os.environ.get("GOOGLE_API_KEY") or os.getenv("GOOGLE_API_KEY")
    model = os.environ.get("GEMINI_MODEL") or os.getenv("GEMINI_MODEL")
    if model and model.strip():
        model = model.strip().strip("'\"")
    else:
        model = "gemini-3.6-flash"

    db_status = get_db_status()

    return jsonify({
        "success": True,
        "service": "Raabta AI Civic Intelligence Platform",
        "status": "healthy",
        "ai_configured": bool(api_key),
        "api_key_status": "GOOGLE_API_KEY is configured" if bool(api_key) else "GOOGLE_API_KEY is missing",
        "model": model,
        "database": db_status
    }), 200

# Fallback handler if Vercel routes to the internal function entrypoint
@app.route("/api/index.py", methods=["GET", "POST"], strict_slashes=False)
@app.route("/api/index", methods=["GET", "POST"], strict_slashes=False)
def vercel_entrypoint():
    if request.method == "GET":
        return health()
    return jsonify({
        "status": "error",
        "message": "Direct function entrypoint called. Please send requests to /api/reports, /api/report, /api/text-report, or /api/voice-report."
    }), 400

@app.errorhandler(Exception)
def handle_exception(e):
    from werkzeug.exceptions import HTTPException
    if isinstance(e, HTTPException):
        return jsonify({
            "status": "error",
            "error": e.description,
            "code": e.code
        }), e.code
    import traceback
    traceback.print_exc()
    return jsonify({
        "status": "error",
        "error": str(e),
        "type": type(e).__name__
    }), 500


class VercelPathFixMiddleware:
    """
    WSGI middleware that restores the real requested path on Vercel.
    Ensures that all API routes are matched accurately and prevents PATH_INFO
    from being overwritten with internal script names (/api/index.py).
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        current_path = environ.get("PATH_INFO", "")

        # If PATH_INFO is already a valid API endpoint, leave it intact
        if current_path and (current_path.startswith("/api/") or current_path in (
            "/health", "/report", "/text-report", "/voice-report",
            "/reports", "/auth", "/departments", "/clusters",
            "/insights", "/notifications", "/admin", "/demo"
        )):
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