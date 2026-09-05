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
    print("==================================================================")
    print("RAABTA AI — COMPREHENSIVE PRODUCTION SYSTEM VERIFICATION SUITE")
    print("==================================================================")
    
    ts = int(time.time())
    citizen_email = f"citizen_{ts}@raabta.gov.pk"
    citizen_password = "Password123!"
    citizen_name = f"Ahmad Khan {ts}"

    # -------------------------------------------------------------
    # 1. Citizen Registration
    # -------------------------------------------------------------
    print("\n--- 1. Citizen Registration & Database Persistence ---")
    st, reg_res = request("POST", "/auth/signup", {
        "email": citizen_email,
        "password": citizen_password,
        "full_name": citizen_name,
        "phone": "+923001122334",
        "role": "citizen"
    })
    assert st == 201, f"Citizen registration failed: {reg_res}"
    citizen_token = reg_res.get("token")
    citizen_id = reg_res.get("user", {}).get("id") or reg_res.get("user", {}).get("_id")
    assert citizen_token, "No token returned on registration"
    assert citizen_id, "No user ID returned on registration"
    print(f"PASS: Citizen registered successfully. ID: {citizen_id}, Email: {citizen_email}")

    # -------------------------------------------------------------
    # 2. Authoritative Current User (/api/auth/me) & Refresh Simulation
    # -------------------------------------------------------------
    print("\n--- 2. Authoritative Current User (/api/auth/me) & Refresh Simulation ---")
    st, me_res = request("GET", "/auth/me", token=citizen_token)
    assert st == 200, f"/api/auth/me failed: {me_res}"
    user_data = me_res.get("user", {})
    assert user_data.get("email") == citizen_email, f"Email mismatch: {user_data.get('email')}"
    assert user_data.get("role") == "citizen", f"Role mismatch: {user_data.get('role')}"
    print("PASS: Session validated against persistent database via /api/auth/me.")

    # Simulate 5 page refreshes
    for i in range(1, 6):
        st_ref, me_ref = request("GET", "/auth/me", token=citizen_token)
        assert st_ref == 200, f"Refresh #{i} failed with status {st_ref}"
        assert me_ref.get("user", {}).get("email") == citizen_email
    print("PASS: 5 consecutive simulated browser refreshes maintained valid authentication.")

    # -------------------------------------------------------------
    # 3. Staff & Command Authentication
    # -------------------------------------------------------------
    print("\n--- 3. Command Admin & Duty Officer Authentication ---")
    st, admin_login = request("POST", "/auth/login", {"email": "admin@raabta.gov.pk", "password": "Password123!"})
    assert st == 200, f"Admin login failed: {admin_login}"
    admin_token = admin_login.get("token")
    print("PASS: Admin authenticated.")

    st, iesco_login = request("POST", "/auth/login", {"email": "officer@raabta.gov.pk", "password": "Password123!"})
    assert st == 200, f"IESCO officer login failed: {iesco_login}"
    iesco_token = iesco_login.get("token")
    print(f"PASS: IESCO Officer authenticated (dept: {iesco_login.get('user', {}).get('department_id')}).")

    st, cda_login = request("POST", "/auth/login", {"email": "officer.cda@raabta.gov.pk", "password": "Password123!"})
    assert st == 200, f"CDA officer login failed: {cda_login}"
    cda_token = cda_login.get("token")
    print(f"PASS: CDA Officer authenticated (dept: {cda_login.get('user', {}).get('department_id')}).")

    # -------------------------------------------------------------
    # 4. Admin Overview Baseline
    # -------------------------------------------------------------
    print("\n--- 4. Pre-check Admin Overview Metrics ---")
    st, ov1 = request("GET", "/admin/overview", token=admin_token)
    assert st == 200
    baseline_total_reports = ov1["overview"]["total_reports"]
    print(f"Baseline database reports count: {baseline_total_reports}")

    # -------------------------------------------------------------
    # 5. Deterministic AI Priority Calculation Endpoint
    # -------------------------------------------------------------
    print("\n--- 5. Deterministic AI Priority Engine ---")
    priority_payload = {
        "title": "Severe Water Main Rupture in G-8 Markaz",
        "description": "Clean water pipe broken leaking massive volume into the street near commercial bank.",
        "category": "Water & Sanitation",
        "evidence_quality": "good",
        "evidence_score": 0.85,
        "address": "Markaz G-8, Islamabad",
        "latitude": 33.6938,
        "longitude": 73.0384,
        "answers": [
            {"question": "Is it fresh drinking water or sewage?", "answer": "Fresh drinking clean water pipe"}
        ]
    }
    st, prio_res = request("POST", "/reports/calculate-priority", priority_payload)
    assert st == 200, f"Priority calculation failed: {prio_res}"
    calculated_score = prio_res.get("priority_score")
    calculated_level = prio_res.get("priority_level")
    assert calculated_score is not None, "Missing priority score"
    print(f"PASS: Deterministic priority calculated: {calculated_score}/100 ({calculated_level}).")

    # -------------------------------------------------------------
    # 6. Citizen Report Submission
    # -------------------------------------------------------------
    print("\n--- 6. Citizen Report Submission (Authenticated) ---")
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
    st, create_res = request("POST", "/reports", report_payload, token=citizen_token)
    assert st == 201, f"Report creation failed: {create_res}"
    report = create_res["report"]
    tracking_id = report["tracking_id"]
    report_id = report["id"]
    print(f"PASS: Report created. Tracking ID: {tracking_id}, Record ID: {report_id}")

    # Verify that authenticated citizen was linked to report
    assert report.get("citizen_id") == citizen_id, f"Citizen ID mismatch: expected {citizen_id}, got {report.get('citizen_id')}"
    print(f"PASS: Server-side citizen ID correctly associated: {citizen_id}")

    # Verify exact GPS coordinates & accuracy
    assert report["location"]["latitude"] == 33.6938, "Latitude mismatch"
    assert report["location"]["longitude"] == 73.0384, "Longitude mismatch"
    assert report["location"]["gps_accuracy"] == 12.5, "GPS accuracy missing"
    assert report["location"]["address"] == "Markaz G-8, Islamabad", "Address mismatch"
    print("PASS: Exact GPS coordinates (33.6938, 73.0384) & accuracy (12.5m) persisted.")

    # -------------------------------------------------------------
    # 7. Citizen Portal "My Reports" (/api/reports/my)
    # -------------------------------------------------------------
    print("\n--- 7. Citizen My Reports Verification ---")
    st, my_res = request("GET", "/reports/my", token=citizen_token)
    assert st == 200, f"My reports failed: {my_res}"
    my_reports = my_res.get("reports", [])
    found_in_my = any(r.get("tracking_id") == tracking_id for r in my_reports)
    assert found_in_my, f"Report {tracking_id} not found in citizen's personal report list"
    print(f"PASS: Newly created report is immediately listed in citizen's portal.")

    # -------------------------------------------------------------
    # 8. Admin Dashboard Metric Synchronization
    # -------------------------------------------------------------
    print("\n--- 8. Admin Dashboard Count Synchronization ---")
    st, ov2 = request("GET", "/admin/overview", token=admin_token)
    assert st == 200
    updated_total_reports = ov2["overview"]["total_reports"]
    assert updated_total_reports == baseline_total_reports + 1, f"Expected {baseline_total_reports + 1}, got {updated_total_reports}"
    print(f"PASS: Total reports synchronized: {baseline_total_reports} -> {updated_total_reports}.")

    # -------------------------------------------------------------
    # 9. Admin Queue Listing & "Triage & Manage" Target
    # -------------------------------------------------------------
    print("\n--- 9. Admin Operations Queue Verification ---")
    st, queue_res = request("GET", "/departments/queue?department_id=all", token=admin_token)
    assert st == 200
    queue = queue_res["queue"]
    found_in_queue = any(r.get("tracking_id") == tracking_id for r in queue)
    assert found_in_queue, f"Report {tracking_id} missing from admin queue"
    print(f"PASS: Report {tracking_id} is present in admin queue.")

    # -------------------------------------------------------------
    # 10. 10 Consecutive Refreshes — Never 404
    # -------------------------------------------------------------
    print("\n--- 10. 10 Consecutive Refreshes on Report Detail ---")
    for i in range(1, 11):
        st, det_res = request("GET", f"/reports/{tracking_id}", token=admin_token)
        assert st == 200, f"Refresh #{i} returned {st}: {det_res}"
        assert det_res["report"]["tracking_id"] == tracking_id
    print("PASS: 10 consecutive refreshes never returned 404.")

    # -------------------------------------------------------------
    # 11. Universal Identifier Resolution Variations
    # -------------------------------------------------------------
    print("\n--- 11. Universal Identifier Lookup (Case-Insensitive & Varied) ---")
    for variant in [tracking_id, tracking_id.lower(), urllib.parse.quote(tracking_id), report_id]:
        st, var_res = request("GET", f"/reports/{variant}")
        assert st == 200, f"Variant '{variant}' lookup failed with {st}"
        assert var_res["report"]["tracking_id"] == tracking_id
    print("PASS: Report resolved across exact, lowercase, URL-encoded, and UUID formats.")

    # -------------------------------------------------------------
    # 12. Duty Officer RBAC Isolation (Server-Side)
    # -------------------------------------------------------------
    print("\n--- 12. Duty Officer RBAC Isolation ---")
    # IESCO officer accessing WASA report via operational view (?gov=1) -> MUST RECEIVE 403
    st, iesco_gov = request("GET", f"/reports/{tracking_id}?gov=1", token=iesco_token)
    assert st == 403, f"Expected 403 for unauthorized officer, got {st}: {iesco_gov}"
    print("PASS: IESCO officer denied operational access to WASA report (403 Forbidden).")

    # CDA officer assigning WASA report -> MUST RECEIVE 403
    st, wrong_assign = request("POST", f"/departments/reports/{tracking_id}/assign", {
        "officer_id": "test_officer",
        "officer_name": "Test Officer"
    }, token=cda_token)
    assert st == 403, f"Expected 403 for cross-department assignment, got {st}"
    print("PASS: CDA officer denied assignment of WASA report (403 Forbidden).")

    # Admin assigning report -> 200 OK
    st, assign_res = request("POST", f"/departments/reports/{tracking_id}/assign", {
        "officer_id": "officer_wasa_1",
        "officer_name": "Engr. WASA Specialist",
        "department_id": "WASA",
        "reason": "Direct dispatch by administrator"
    }, token=admin_token)
    assert st == 200, f"Admin assignment failed: {assign_res}"
    print("PASS: Admin successfully assigned duty officer to case.")

    # -------------------------------------------------------------
    # 13. Private Internal Operational Notes
    # -------------------------------------------------------------
    print("\n--- 13. Private Internal Operational Notes ---")
    st, note_res = request("POST", f"/departments/reports/{tracking_id}/notes", {
        "note": "Excavation crew deployed to G-8 Markaz."
    }, token=admin_token)
    assert st == 201, f"Adding internal note failed: {note_res}"
    print("PASS: Internal note added by authorized officer.")

    # Citizen viewing report -> internal notes MUST NOT be exposed
    st, citizen_view = request("GET", f"/reports/{tracking_id}", token=citizen_token)
    assert st == 200
    assert "internal_notes" not in citizen_view["report"], "Security leak: internal notes visible to citizen"
    print("PASS: Internal notes stripped from citizen response.")

    # -------------------------------------------------------------
    # 14. Operational Status Transitions & Resolution Proof
    # -------------------------------------------------------------
    print("\n--- 14. Status Transitions: in_progress -> resolved ---")
    st, prog_res = request("POST", f"/departments/reports/{tracking_id}/status", {
        "status": "in_progress",
        "comment": "Excavation team on site."
    }, token=admin_token)
    assert st == 200, f"Status update failed: {prog_res}"
    print("PASS: Status transition to 'in_progress' succeeded.")

    st, resolve_res = request("POST", f"/departments/reports/{tracking_id}/resolve", {
        "resolution_notes": "Main distribution pipe replaced and pressure tested.",
        "after_image_url": "https://example.com/proof_wasa_pipe.jpg"
    }, token=admin_token)
    assert st == 200, f"Resolution submission failed: {resolve_res}"
    print("PASS: Report marked 'resolved' with photo proof and notes.")

    # -------------------------------------------------------------
    # 15. Citizen Verification & Case Closure
    # -------------------------------------------------------------
    print("\n--- 15. Citizen Verification & Case Closure ---")
    st, verify_res = request("POST", f"/reports/{tracking_id}/verify-resolution", {
        "action": "accept",
        "rating": 5,
        "feedback": "Water service is fully restored. Thank you!"
    }, token=citizen_token)
    assert st == 200, f"Citizen verification failed: {verify_res}"
    print("PASS: Citizen verified resolution and closed case.")

    # Verify final closed status
    st, final_view = request("GET", f"/reports/{tracking_id}")
    assert st == 200
    assert final_view["report"]["status"] == "closed", f"Expected closed, got {final_view['report']['status']}"
    print("PASS: Report final status is confirmed 'closed'.")

    # -------------------------------------------------------------
    # 16. Immutable Audit Log Trail
    # -------------------------------------------------------------
    print("\n--- 16. Comprehensive Immutable Audit Log Trail ---")
    st, logs_res = request("GET", "/admin/audit-logs?limit=50", token=admin_token)
    assert st == 200
    logs = logs_res["logs"]
    case_logs = [l for l in logs if l.get("tracking_id") == tracking_id or l.get("report_id") == report_id]
    print(f"Recorded {len(case_logs)} audit events for {tracking_id}:")
    for l in case_logs:
        print(f"  - [{l.get('action')}] by {l.get('actor_name')} ({l.get('actor_role')}): {l.get('details')}")
    assert len(case_logs) >= 3, "Insufficient audit trail logged"
    print("PASS: Complete audit log history verified.")

    # -------------------------------------------------------------
    # 17. Citizen Re-login Test
    # -------------------------------------------------------------
    print("\n--- 17. Citizen Re-login & Session Persistence ---")
    st, relogin_res = request("POST", "/auth/login", {
        "email": citizen_email,
        "password": citizen_password
    })
    assert st == 200, f"Citizen re-login failed: {relogin_res}"
    new_token = relogin_res.get("token")
    assert new_token, "No token returned on re-login"

    st, relogin_my = request("GET", "/reports/my", token=new_token)
    assert st == 200
    assert any(r.get("tracking_id") == tracking_id for r in relogin_my.get("reports", []))
    print("PASS: Citizen can log out and log back in, accessing the exact same closed report.")

    print("\n==================================================================")
    print("ALL 17 PRODUCTION REQUIREMENTS & VERIFICATION TESTS PASSED 100%!")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
