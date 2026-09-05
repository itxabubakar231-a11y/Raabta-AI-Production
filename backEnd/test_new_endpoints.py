import os
import sys
import json

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app import app
from database import get_db

client = app.test_client()

print("--- Testing POST /api/reports/analyze ---")
res = client.post(
    "/api/reports/analyze",
    json={
        "text": "Bohot bara gaddha hai main road pe near F-8 Markaz school, traffic jam ho raha hai",
        "address": "F-8 Markaz, Islamabad",
        "latitude": 33.712,
        "longitude": 73.045
    }
)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.data}"
data = res.get_json()
assert data.get("success") is True
analysis = data.get("analysis", {})
print("  PASS: analyze endpoint returned 200 OK")
print(f"  Detected Issue: {analysis.get('detected_issue')}")
print(f"  Department: {analysis.get('department', {}).get('department_name')}")
print(f"  Priority Score: {analysis.get('priority_score')}/100 ({analysis.get('priority_level')})")
print(f"  Follow-up Questions: {len(analysis.get('follow_up_questions', []))}")
assert analysis.get("priority_score") > 0

# Test department override and request-info
print("\n--- Testing Officer Login & Override ---")
login_res = client.post("/api/auth/login", json={"email": "officer@raabta.gov.pk", "password": "Password123!"})
assert login_res.status_code == 200
token = login_res.get_json()["token"]
headers = {"Authorization": f"Bearer {token}"}

db = get_db()
report = db.civic_reports.find_one({})
report_id = str(report.get("_id", report.get("id")))

override_res = client.post(
    f"/api/departments/reports/{report_id}/override",
    headers=headers,
    json={
        "department_id": "IESCO",
        "severity": "CRITICAL",
        "priority": 95,
        "reason": "Direct visual inspection revealed live high-voltage arcing wire touching school boundary."
    }
)
assert override_res.status_code == 200, f"Override failed: {override_res.data}"
print("  PASS: Officer override with mandatory reason succeeded")

# Test override without reason fails with 400
bad_override = client.post(
    f"/api/departments/reports/{report_id}/override",
    headers=headers,
    json={"department_id": "CDA"}
)
assert bad_override.status_code == 400
print("  PASS: Override without mandatory reason correctly rejected with 400")

# Test request-info
info_res = client.post(
    f"/api/departments/reports/{report_id}/request-info",
    headers=headers,
    json={"note": "Please specify whether the wire is inside or outside the school boundary."}
)
assert info_res.status_code == 200
print("  PASS: Officer request-info succeeded, notification created")

print("\nALL NEW BACKEND ENDPOINTS VERIFIED SUCCESSFULLY!")
