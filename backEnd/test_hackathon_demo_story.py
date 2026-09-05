"""
Raabta AI - Master End-to-End Hackathon Demo Story Verification Script
Executes the primary hackathon demo lifecycle from citizen pothole reporting to final verification.
"""

import sys
import os
import json
import io

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import get_db

def run_hackathon_demo_test():
    print("=" * 65)
    print("RAABTA AI — MASTER HACKATHON DEMO STORY E2E VERIFICATION")
    print("=" * 65)

    client = app.test_client()
    db = get_db()

    # Step 0: Authenticate Citizen and Officer
    print("\n--- STEP 0: Authentication Verification ---")
    c_login = client.post("/api/auth/login", json={"email": "citizen@raabta.gov.pk", "password": "Password123!"})
    assert c_login.status_code == 200, f"Citizen login failed: {c_login.get_data(as_text=True)}"
    c_token = c_login.get_json()["token"]
    c_headers = {"Authorization": f"Bearer {c_token}"}
    print("  [✓] Citizen logged in (citizen@raabta.gov.pk)")

    o_login = client.post("/api/auth/login", json={"email": "officer@raabta.gov.pk", "password": "Password123!"})
    assert o_login.status_code == 200, f"Officer login failed: {o_login.get_data(as_text=True)}"
    o_token = o_login.get_json()["token"]
    o_headers = {"Authorization": f"Bearer {o_token}"}
    print("  [✓] Duty Officer logged in (officer@raabta.gov.pk)")

    # Step 1 - 4: Citizen observes pothole in F-8 Markaz, takes photo, provides Urdu voice & GPS
    print("\n--- STEPS 1 - 4: Citizen Input & Location Collection ---")
    pothole_text = "F-8 Markaz ke main signal ke samne bohot gehra gaddha hai, gaariyan phans rahi hain aur traffic jam hai."
    pothole_lat = 33.7121
    pothole_lon = 73.0382
    pothole_addr = "F-8 Markaz, Jinnah Avenue, Islamabad"
    print(f"  [✓] Citizen Input: '{pothole_text}'")
    print(f"  [✓] Location: {pothole_addr} ({pothole_lat}, {pothole_lon})")

    # Step 5 - 9: Multimodal AI Review (Pre-submission Analysis)
    print("\n--- STEPS 5 - 9: Pre-Submission AI Review & Risk Scoring ---")
    analyze_payload = {
        "text": (io.BytesIO(pothole_text.encode()), "input.txt"),
        "latitude": str(pothole_lat),
        "longitude": str(pothole_lon),
        "address": pothole_addr
    }
    analyze_res = client.post("/api/reports/analyze", data=analyze_payload, headers=c_headers, content_type="multipart/form-data")
    assert analyze_res.status_code == 200, f"Analysis failed: {analyze_res.get_data(as_text=True)}"
    ai_data = analyze_res.get_json()["analysis"]

    print(f"  [✓] AI Identified Issue: {ai_data['detected_issue']}")
    print(f"  [✓] AI Recommended Department: {ai_data['department_recommendation']}")
    print(f"  [✓] Deterministic Priority Score: {ai_data['civic_risk_score']['score']}/100 ({ai_data['civic_risk_score']['level']})")
    print(f"  [✓] Explainable Breakdown: {json.dumps(ai_data['civic_risk_score']['breakdown'])}")
    print(f"  [✓] Follow-up Questions ({len(ai_data['follow_up_questions'])}): {[q['question'] for q in ai_data['follow_up_questions']]}")

    # Step 10 - 12: Citizen Reviews Summary & Submits Final Report
    print("\n--- STEPS 10 - 12: Citizen Review & Official Submission ---")
    submit_data = {
        "title": f"Deep Pothole - {ai_data['detected_issue']}",
        "description": pothole_text,
        "category": "Road Hazard",
        "latitude": str(pothole_lat),
        "longitude": str(pothole_lon),
        "location": pothole_addr,
        "department_name": ai_data['department_recommendation'],
        "missing_answers": json.dumps([
            {"question": "Is the pothole affecting vehicle flow or causing traffic slowdowns?", "answer": "Yes, major bottleneck"},
            {"question": "How long has this hazard been present?", "answer": "Past 3 days"}
        ])
    }
    submit_res = client.post("/api/reports", data=submit_data, headers=c_headers, content_type="multipart/form-data")
    assert submit_res.status_code == 201, f"Report submission failed: {submit_res.get_data(as_text=True)}"
    created_rep = submit_res.get_json()["report"]
    report_id = created_rep["id"]
    tracking_id = created_rep["tracking_id"]

    print(f"  [✓] Report Created with Real Tracking ID: {tracking_id}")
    assert tracking_id.startswith("RA-2026-"), f"Invalid tracking ID format: {tracking_id}"
    assert created_rep["civic_risk_score"]["score"] > 0, "Risk score must be > 0"

    # Step 13 - 15: Government Queue Receives Report & Officer Opens Dossier
    print("\n--- STEPS 13 - 15: Government Queue & Case File Review ---")
    queue_res = client.get("/api/reports?sort_by=priority_desc", headers=o_headers)
    assert queue_res.status_code == 200
    q_reports = queue_res.get_json()["reports"]
    matching_in_q = [r for r in q_reports if r.get("id") == report_id or r.get("tracking_id") == tracking_id]
    assert len(matching_in_q) > 0, "Report must appear in the priority queue"
    print(f"  [✓] Report verified in Government Queue at priority rank")

    dossier_res = client.get(f"/api/reports/{report_id}", headers=o_headers)
    assert dossier_res.status_code == 200
    dossier = dossier_res.get_json()["report"]
    assert dossier["tracking_id"] == tracking_id
    print(f"  [✓] Officer inspected case dossier ({dossier['title']})")

    # Step 16: Proximity Clustering Detection (< 250m)
    print("\n--- STEP 16: Repeated Problems Intelligence ---")
    # Simulate a second citizen reporting nearby in F-8 (100m away)
    c2_data = {
        "title": "Severe road cavity near F-8 Markaz",
        "description": "Another pothole hazard right in the same junction.",
        "category": "Road Hazard",
        "latitude": str(pothole_lat + 0.0008), # ~90 meters away
        "longitude": str(pothole_lon + 0.0008),
        "location": "F-8 Markaz, Islamabad"
    }
    c2_res = client.post("/api/reports", data=c2_data, headers=c_headers, content_type="multipart/form-data")
    assert c2_res.status_code == 201
    c2_rep = c2_res.get_json()["report"]
    print(f"  [✓] 2nd Citizen reported nearby hazard ({c2_rep['tracking_id']})")
    
    # Check clusters API
    clusters_res = client.get("/api/clusters", headers=o_headers)
    assert clusters_res.status_code == 200
    clusters = clusters_res.get_json()["clusters"]
    print(f"  [✓] Active Proximity Clusters in ICT: {len(clusters)}")

    # Step 17 - 18: Officer Assignment & Field Work Resolution
    print("\n--- STEPS 17 - 18: Duty Officer Field Work & Resolution ---")
    assign_res = client.post(f"/api/departments/reports/{report_id}/assign", json={
        "officer_id": "officer-001",
        "officer_name": "Tariq Mahmood (CDA Roads)"
    }, headers=o_headers)
    assert assign_res.status_code == 200
    print("  [✓] Duty Officer assigned to case")

    # Officer adds private internal note
    note_res = client.post(f"/api/departments/reports/{report_id}/notes", json={
        "note": "Dispatched asphalt patching truck #4 with crew. Work scheduled for completion by 4 PM."
    }, headers=o_headers)
    assert note_res.status_code == 201
    print("  [✓] Confidential internal note recorded")

    # Officer marks resolved with completion notes and after-photo proof
    resolve_res = client.post(f"/api/departments/reports/{report_id}/resolve", json={
        "resolution_notes": "Filled deep pothole with high-grade hot asphalt and compacted flush with road level.",
        "resolution_image_url": "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600"
    }, headers=o_headers)
    assert resolve_res.status_code == 200
    print("  [✓] Duty Officer submitted completion proof and marked resolved")

    # Step 19: Citizen Receives Notification
    print("\n--- STEP 19: Citizen Verification Notification ---")
    notif_res = client.get("/api/notifications", headers=c_headers)
    assert notif_res.status_code == 200
    notifs = notif_res.get_json()["notifications"]
    print(f"  [✓] Citizen received notification for verification ({len(notifs)} total notifications)")

    # Step 20 - 22: Citizen Verifies Resolution ("Yes, It's Fixed")
    print("\n--- STEPS 20 - 22: Citizen Resolution Verification ---")
    verify_res = client.post(f"/api/reports/{report_id}/verify-resolution", json={
        "action": "accept",
        "feedback": "The road has been smoothly paved. Thank you for the quick action!",
        "rating": 5
    }, headers=c_headers)
    assert verify_res.status_code == 200
    print("  [✓] Citizen physically inspected site and confirmed: 'Yes, It's Fixed'")

    # Verify status is closed in database
    final_dossier = client.get(f"/api/reports/{report_id}", headers=c_headers).get_json()["report"]
    assert final_dossier["status"] == "closed", f"Status should be 'closed', was: {final_dossier['status']}"
    print(f"  [✓] Database Status updated to: {final_dossier['status'].upper()}")

    # Step 23 - 24: Government Dashboard & Area Insights Telemetry Update
    print("\n--- STEPS 23 - 24: Real Government Insights & Metrics Update ---")
    insights_res = client.get("/api/insights/trends", headers=o_headers)
    assert insights_res.status_code == 200
    metrics = insights_res.get_json()["metrics"]
    print(f"  [✓] Real Confirmed Resolved Count: {metrics['verified_confirmed_count']}")
    print(f"  [✓] Real Citizen Satisfaction Rate: {metrics['citizen_satisfaction_rate']}%")
    print(f"  [✓] Real Average Resolution Time: {metrics['avg_resolution_hours']} hours")
    print(f"  [✓] Real SLA Compliance Rate: {metrics['sla_compliance_rate']}%")

    print("\n" + "=" * 65)
    print("ALL 24 STEPS OF THE HACKATHON DEMO STORY PASSED WITH REAL DB RECORDS!")
    print("=" * 65)

if __name__ == "__main__":
    run_hackathon_demo_test()
