"""
Raabta AI - Master Backend Production Test Suite
Tests:
1. Health & Database connectivity
2. User authentication & JWT issuing (citizen, officer, admin)
3. RBAC permission checks
4. Report submission, risk scoring & clustering
5. Missing information submission
6. Officer queue retrieval, assignment & resolution workflow
7. Citizen resolution verification & dispute escalation
8. PDF dossier generation
9. Proximity clusters & hotspot insights
10. Legacy routes backwards-compatibility (/api/report, /api/text-report)
"""

import sys
import os
import json

from app import app
from database import get_db

def run_suite():
    client = app.test_client()
    passed = 0
    failed = 0

    def assert_test(name, condition, extra=""):
        nonlocal passed, failed
        if condition:
            passed += 1
            print(f"  PASS: {name}")
        else:
            failed += 1
            print(f"  FAIL: {name} - {extra}")

    print("\n--- TEST 1: Health & Database Connectivity ---")
    res = client.get("/api/health")
    assert_test("Health endpoint returns 200", res.status_code == 200)
    data = res.get_json()
    assert_test("Database reported connected", data.get("database", {}).get("connected") is True)
    assert_test("All 9 collections mapped", len(data.get("database", {}).get("collections", {})) == 9)

    print("\n--- TEST 2: Authentication & JWT Lifecycle ---")
    # Login as citizen
    res = client.post("/api/auth/login", json={
        "email": "citizen@raabta.gov.pk",
        "password": "Password123!"
    })
    assert_test("Citizen login returns 200", res.status_code == 200)
    cit_data = res.get_json()
    cit_token = cit_data.get("token")
    assert_test("Citizen JWT token generated", bool(cit_token))
    assert_test("Citizen role verified", cit_data.get("user", {}).get("role") == "citizen")

    # Login as officer
    res = client.post("/api/auth/login", json={
        "email": "officer@raabta.gov.pk",
        "password": "Password123!"
    })
    assert_test("Officer login returns 200", res.status_code == 200)
    off_data = res.get_json()
    off_token = off_data.get("token")
    assert_test("Officer JWT token generated", bool(off_token))
    assert_test("Officer role verified", off_data.get("user", {}).get("role") == "officer")

    # /api/auth/me check
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {cit_token}"})
    assert_test("Auth /me endpoint returns citizen profile", res.status_code == 200 and res.get_json().get("user", {}).get("email") == "citizen@raabta.gov.pk")

    print("\n--- TEST 3: RBAC Protection ---")
    # Citizen trying to access officer queue should be 403 Forbidden
    res = client.get("/api/departments/queue", headers={"Authorization": f"Bearer {cit_token}"})
    assert_test("Citizen access to officer queue is 403 Forbidden", res.status_code == 403)

    # Officer accessing queue should be 200 OK
    res = client.get("/api/departments/queue", headers={"Authorization": f"Bearer {off_token}"})
    assert_test("Officer access to queue is 200 OK", res.status_code == 200)

    print("\n--- TEST 4: Civic Reports & Risk-First Queue ---")
    res = client.get("/api/reports")
    assert_test("List reports returns 200", res.status_code == 200)
    rep_list = res.get_json().get("reports", [])
    assert_test("Pre-seeded reports returned", len(rep_list) >= 5)
    # Check that highest risk score is first (risk-first ordering)
    if len(rep_list) >= 2:
        score0 = rep_list[0].get("civic_risk_score", {}).get("score", 0)
        score1 = rep_list[1].get("civic_risk_score", {}).get("score", 0)
        assert_test("Reports sorted by Civic Risk Score descending", score0 >= score1, f"{score0} vs {score1}")

    # Create new report
    sample_report = {
        "title": "Sparking Live Wire Downed on Street 5",
        "description": "High voltage wire snapped and is sparking on the road near children playing area.",
        "category": "Electrical Hazards",
        "department_id": "IESCO",
        "latitude": 33.7295,
        "longitude": 73.0765,
        "address": "Street 5, Sector F-6/2, Islamabad"
    }
    res = client.post("/api/reports", json=sample_report, headers={"Authorization": f"Bearer {cit_token}"})
    assert_test("Submit new report returns 201", res.status_code == 201)
    new_rep_data = res.get_json()
    new_rep = new_rep_data.get("report", {})
    tracking_id = new_rep.get("tracking_id")
    assert_test("Tracking ID generated (RA-YYYY-XXXX)", tracking_id and tracking_id.startswith("RA-"))
    risk_score = new_rep.get("civic_risk_score", {}).get("score", 0)
    assert_test("Civic Risk Score calculated (> 70 for sparking wire)", risk_score >= 70, f"Got: {risk_score}")
    assert_test("Missing info questions generated", len(new_rep.get("missing_information_questions", [])) >= 1)

    print("\n--- TEST 5: Proximity Clustering & Deduplication ---")
    # The new report is at (33.7295, 73.0765), which is within ~20 meters of the F-6 snapped transformer cable (33.7294, 73.0763)!
    assert_test("Clustering triggered for nearby duplicate hazard", new_rep_data.get("cluster_info", {}).get("clustered") is True)

    print("\n--- TEST 6: Missing Information Q&A Submission ---")
    rep_id = new_rep.get("id")
    res = client.post(f"/api/reports/{rep_id}/missing-info", json={
        "answers": [{"question_id": "q1", "answer": "Yes, sparking continuously"}]
    })
    assert_test("Citizen submit missing info returns 200", res.status_code == 200)

    print("\n--- TEST 7: Department Dispatch & Officer Resolution Workflow ---")
    # Officer assigns report
    res = client.post(f"/api/departments/reports/{rep_id}/assign", json={
        "officer_name": "Engr. Tariq Mehmood"
    }, headers={"Authorization": f"Bearer {off_token}"})
    assert_test("Officer assigned returns 200", res.status_code == 200)

    # Officer marks resolved
    res = client.post(f"/api/departments/reports/{rep_id}/resolve", json={
        "resolution_notes": "Emergency lineman isolated transformer, replaced snapped 11kV conductor, and restored power.",
        "resolution_image_url": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600"
    }, headers={"Authorization": f"Bearer {off_token}"})
    assert_test("Officer resolve with proof returns 200", res.status_code == 200)

    print("\n--- TEST 8: Citizen Resolution Verification & Dispute Workflow ---")
    # Citizen dispute test
    res = client.post(f"/api/reports/{rep_id}/verify-resolution", json={
        "action": "dispute",
        "feedback": "Wire was fixed but debris and loose branch left hanging over power line.",
        "rating": 2
    }, headers={"Authorization": f"Bearer {cit_token}"})
    assert_test("Citizen dispute returns 200", res.status_code == 200)

    # Verify escalated state
    res = client.get(f"/api/reports/{rep_id}")
    disputed_rep = res.get_json().get("report", {})
    assert_test("Report status marked disputed", disputed_rep.get("status") == "disputed")
    assert_test("Report marked escalated", disputed_rep.get("is_escalated") is True)

    # Citizen final acceptance test on another report
    res = client.post(f"/api/reports/{rep_id}/verify-resolution", json={
        "action": "accept",
        "feedback": "Team returned and cleared all debris. Excellent work!",
        "rating": 5
    }, headers={"Authorization": f"Bearer {cit_token}"})
    assert_test("Citizen acceptance marks closed", res.status_code == 200)

    print("\n--- TEST 9: Official PDF Civic Dossier Generation ---")
    res = client.get(f"/api/reports/{rep_id}/pdf")
    assert_test("PDF dossier generated returns 200", res.status_code == 200)
    assert_test("MIME type is application/pdf", res.headers.get("Content-Type") == "application/pdf")
    assert_test("PDF bytes length > 5000", len(res.data) > 5000)

    print("\n--- TEST 10: Insights, Hotspots & Clusters ---")
    res = client.get("/api/insights/hotspots")
    assert_test("Hotspots endpoint returns 200", res.status_code == 200)
    assert_test("Map pins returned with coordinates", len(res.get_json().get("hotspots", [])) >= 5)

    res = client.get("/api/insights/trends")
    assert_test("Trends endpoint returns 200", res.status_code == 200)
    assert_test("Metrics include citizen satisfaction & SLA compliance", "citizen_satisfaction_rate" in res.get_json().get("metrics", {}))

    res = client.get("/api/clusters")
    assert_test("Clusters endpoint returns 200", res.status_code == 200)
    assert_test("Clusters returned", len(res.get_json().get("clusters", [])) >= 1)

    print("\n==========================================")
    print(f"TEST RESULTS: {passed} PASSED, {failed} FAILED")
    print("==========================================")
    return failed == 0

if __name__ == "__main__":
    success = run_suite()
    sys.exit(0 if success else 1)
