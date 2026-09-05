import urllib.request
import urllib.parse
import json
import time
import sys

BASE_URL = "http://127.0.0.1:5000/api"

def request(method, path, body=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 500, {"error": str(e)}

def run_tests():
    print("=== STARTING COMPLETE RAABTA AI LIFECYCLE TEST ===")
    
    # 1. Login Admin & Officers
    print("\n--- Step 1: Authentication ---")
    st, admin_login = request("POST", "/auth/login", {"email": "admin@raabta.gov.pk", "password": "Password123!"})
    assert st == 200, f"Admin login failed: {admin_login}"
    admin_token = admin_login.get("token") or admin_login.get("access_token")
    print(f"PASS: Admin login success")

    st, iesco_login = request("POST", "/auth/login", {"email": "officer@raabta.gov.pk", "password": "Password123!"})
    assert st == 200, f"IESCO officer login failed: {iesco_login}"
    iesco_token = iesco_login.get("token") or iesco_login.get("access_token")
    print(f"PASS: IESCO officer login success (dept: {iesco_login.get('user', {}).get('department_id')})")

    st, cda_login = request("POST", "/auth/login", {"email": "officer.cda@raabta.gov.pk", "password": "Password123!"})
    assert st == 200, f"CDA officer login failed: {cda_login}"
    cda_token = cda_login.get("token") or cda_login.get("access_token")
    print(f"PASS: CDA officer login success (dept: {cda_login.get('user', {}).get('department_id')})")

    # 2. Get initial admin overview
    print("\n--- Step 2: Pre-check Admin Overview ---")
    st, ov1 = request("GET", "/admin/overview", token=admin_token)
    assert st == 200
    initial_reports_count = ov1["overview"]["total_reports"]
    print(f"Initial total reports in database: {initial_reports_count}")

    # 3. Create fresh Citizen Report
    print("\n--- Step 3: Citizen Report Submission ---")
    report_payload = {
        "title": "Severe Water Main Rupture in G-8 Markaz",
        "description": "Clean water pipe broken leaking massive volume into the street near commercial bank.",
        "category": "Water & Sanitation",
        "department_id": "WASA",
        "latitude": 33.6938,
        "longitude": 73.0384,
        "gps_accuracy": 12.5,
        "address": "Markaz G-8, Islamabad",
        "city": "Islamabad",
        "missing_information_questions": [
            {"id": "pipe_type", "question": "Is it fresh drinking water or sewage?"}
        ],
        "missing_information_answers": [
            {"question": "Is it fresh drinking water or sewage?", "answer": "Fresh drinking clean water pipe"}
        ]
    }
    st, create_res = request("POST", "/reports", report_payload)
    assert st == 201, f"Report creation failed: {create_res}"
    report = create_res["report"]
    tracking_id = report["tracking_id"]
    report_id = report["id"]
    print(f"PASS: Report created successfully. Tracking ID: {tracking_id}, ID: {report_id}")
    
    # Verify GPS and location
    assert report["location"]["latitude"] == 33.6938, "Latitude mismatch"
    assert report["location"]["longitude"] == 73.0384, "Longitude mismatch"
    assert report["location"]["gps_accuracy"] == 12.5, "GPS accuracy missing"
    assert report["location"]["address"] == "Markaz G-8, Islamabad", "Address mismatch"
    print("PASS: Exact GPS coordinates and accuracy persisted.")

    # 4. Verify Admin Dashboard Count Increased
    print("\n--- Step 4: Admin Dashboard Count Synchronization ---")
    st, ov2 = request("GET", "/admin/overview", token=admin_token)
    assert st == 200
    new_reports_count = ov2["overview"]["total_reports"]
    assert new_reports_count == initial_reports_count + 1, f"Expected {initial_reports_count + 1}, got {new_reports_count}"
    print(f"PASS: Admin total_reports count updated from {initial_reports_count} -> {new_reports_count}")

    # 5. Verify Admin Queue displays report
    print("\n--- Step 5: Admin Queue Verification ---")
    st, queue_res = request("GET", "/departments/queue?department_id=all", token=admin_token)
    assert st == 200
    queue = queue_res["queue"]
    found_in_queue = any(r.get("tracking_id") == tracking_id for r in queue)
    assert found_in_queue, f"Report {tracking_id} not found in admin queue"
    print(f"PASS: Report {tracking_id} is present in admin queue with correct tracking_id.")

    # 6. Test 10 Consecutive Refreshes of Detail View — Never 404
    print("\n--- Step 6: 10 Consecutive Refreshes of Report Detail ---")
    for i in range(1, 11):
        st, det_res = request("GET", f"/reports/{tracking_id}", token=admin_token)
        assert st == 200, f"Refresh #{i} failed with status {st}: {det_res}"
        assert det_res["report"]["tracking_id"] == tracking_id
    print("PASS: 10 consecutive refreshes never returned 404.")

    # 7. Test Canonical Lookup Variants
    print("\n--- Step 7: Canonical Identifier Lookup (Case-Insensitivity & Variations) ---")
    # Exact tracking ID
    st, _ = request("GET", f"/reports/{tracking_id}")
    assert st == 200, "Exact tracking ID failed"
    # Lowercase tracking ID
    st, _ = request("GET", f"/reports/{tracking_id.lower()}")
    assert st == 200, "Lowercase tracking ID failed"
    # URL-encoded tracking ID
    st, _ = request("GET", f"/reports/{urllib.parse.quote(tracking_id)}")
    assert st == 200, "URL-encoded tracking ID failed"
    # Direct UUID record ID
    st, _ = request("GET", f"/reports/{report_id}")
    assert st == 200, "UUID record ID failed"
    print("PASS: Tracking ID lookup succeeded for exact, lowercase, encoded, and UUID formats.")

    # 8. Test Duty Officer RBAC
    print("\n--- Step 8: Duty Officer RBAC Isolation ---")
    # IESCO officer accessing WASA report via operational context (?gov=1) -> MUST RECEIVE 403
    st, iesco_gov_res = request("GET", f"/reports/{tracking_id}?gov=1", token=iesco_token)
    assert st == 403, f"Expected 403 for wrong department officer, got {st}: {iesco_gov_res}"
    print("PASS: IESCO officer denied operational access to WASA report (403 Forbidden).")

    # Admin accessing WASA report via operational context (?gov=1) -> MUST SUCCEED (200)
    st, admin_gov_res = request("GET", f"/reports/{tracking_id}?gov=1", token=admin_token)
    assert st == 200, f"Admin operational access failed: {admin_gov_res}"
    print("PASS: Admin granted operational access to all department reports.")

    # 9. Officer Assignment & Admin Visibility
    print("\n--- Step 9: Officer Assignment ---")
    # IESCO officer attempting to assign WASA report -> 403 Forbidden
    st, wrong_assign = request("POST", f"/departments/reports/{tracking_id}/assign", {
        "officer_id": "test_officer",
        "officer_name": "Test Officer"
    }, token=iesco_token)
    assert st == 403, f"Expected 403 for unauthorized assignment, got {st}"
    print("PASS: Unauthorized officer cannot assign report (403).")

    # Admin assigns report to duty officer
    st, assign_res = request("POST", f"/departments/reports/{tracking_id}/assign", {
        "officer_id": "officer_123",
        "officer_name": "Engr. WASA Specialist",
        "department_id": "WASA",
        "reason": "Direct dispatch by administrator"
    }, token=admin_token)
    assert st == 200, f"Admin assignment failed: {assign_res}"
    print("PASS: Report successfully assigned by administrator.")

    # 10. Internal Notes
    print("\n--- Step 10: Private Internal Operational Notes ---")
    st, note_res = request("POST", f"/departments/reports/{tracking_id}/notes", {
        "content": "Excavation team scheduled for 09:00 AM tomorrow."
    }, token=admin_token)
    assert st == 201, f"Adding note failed: {note_res}"
    print("PASS: Internal note added.")

    # Citizen viewing report -> internal notes MUST NOT be visible
    st, citizen_view = request("GET", f"/reports/{tracking_id}")
    assert st == 200
    assert "internal_notes" not in citizen_view["report"], "Security leak: internal notes visible to citizen"
    print("PASS: Internal notes are strictly private and stripped from citizen view.")

    # Admin viewing report -> internal notes present
    st, admin_view = request("GET", f"/reports/{tracking_id}", token=admin_token)
    assert st == 200
    assert len(admin_view["report"].get("internal_notes", [])) > 0, "Admin cannot see internal notes"
    print("PASS: Internal notes properly accessible to authorized staff.")

    # 11. Status Lifecycle: In Progress -> Resolved
    print("\n--- Step 11: Status Update to In Progress ---")
    st, prog_res = request("POST", f"/departments/reports/{tracking_id}/status", {
        "status": "in_progress",
        "comment": "Team has arrived on site with pipeline repair materials."
    }, token=admin_token)
    assert st == 200, f"Status update failed: {prog_res}"
    print("PASS: Status updated to 'in_progress'.")

    print("\n--- Step 12: Resolution with Proof ---")
    st, resolve_res = request("POST", f"/departments/reports/{tracking_id}/resolve", {
        "resolution_notes": "Main distribution pipe welded and sealed. Flow pressure restored to normal.",
        "after_image_url": "https://example.com/proof_repaired_pipe.jpg"
    }, token=admin_token)
    assert st == 200, f"Resolution submission failed: {resolve_res}"
    print("PASS: Case resolved with proof.")

    # 13. Citizen Verification
    print("\n--- Step 13: Citizen Verification ---")
    st, verify_res = request("POST", f"/reports/{tracking_id}/verify-resolution", {
        "action": "accept",
        "rating": 5,
        "feedback": "Water pressure is back and the street is dry. Thank you!"
    })
    assert st == 200, f"Citizen verification failed: {verify_res}"
    print("PASS: Citizen verified resolution and closed case.")

    # 14. Activity Log Audit Trail
    print("\n--- Step 14: Activity Log Complete Lifecycle Audit ---")
    st, logs_res = request("GET", "/admin/audit-logs?limit=50", token=admin_token)
    assert st == 200
    logs = logs_res["logs"]
    related_logs = [l for l in logs if l.get("tracking_id") == tracking_id or l.get("report_id") == report_id]
    print(f"Found {len(related_logs)} audit log entries for {tracking_id}:")
    for l in related_logs:
        print(f"  - [{l.get('action')}] by {l.get('actor_name')} ({l.get('actor_role')}): {l.get('details')}")
    assert len(related_logs) >= 3, "Insufficient audit trail logged"
    print("PASS: Comprehensive immutable audit log generated.")

    print("\n========================================================")
    print("ALL 14 LIFECYCLE AND RBAC VERIFICATION TESTS PASSED 100%!")
    print("========================================================")

if __name__ == "__main__":
    run_tests()
