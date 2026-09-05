"""
Test script for verifying:
1. POST /api/reports/calculate-priority with citizen follow-up answers
2. POST /api/reports with missing_information_answers
3. POST /api/departments/reports/<report_id>/request-info (Officer)
4. POST /api/reports/<report_id>/respond-info (Citizen)
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import get_db

def test_workflow():
    client = app.test_client()
    db = get_db()

    # 1. Login citizen and officer
    c_res = client.post("/api/auth/login", json={"email": "citizen@raabta.gov.pk", "password": "Password123!"})
    assert c_res.status_code == 200, f"Citizen login failed: {c_res.data}"
    c_token = c_res.get_json()["token"]
    c_headers = {"Authorization": f"Bearer {c_token}"}

    o_res = client.post("/api/auth/login", json={"email": "officer@raabta.gov.pk", "password": "Password123!"})
    assert o_res.status_code == 200, f"Officer login failed: {o_res.data}"
    o_token = o_res.get_json()["token"]
    o_headers = {"Authorization": f"Bearer {o_token}"}

    # 2. Test calculate-priority endpoint
    base_calc = client.post("/api/reports/calculate-priority", json={
        "category": "road_hazard",
        "description": "Deep crater on expressway near school",
        "evidence_quality": "High",
        "evidence_quality_score": 85,
        "follow_up_answers": []
    }, headers=c_headers)
    assert base_calc.status_code == 200, f"Base calc failed: {base_calc.data}"
    base_data = base_calc.get_json()
    base_score = base_data["civic_risk_score"]["score"]
    print(f"[✓] Base priority score: {base_score}")

    # Now calculate with affirmative hazard answers
    boost_calc = client.post("/api/reports/calculate-priority", json={
        "category": "road_hazard",
        "description": "Deep crater on expressway near school",
        "evidence_quality": "High",
        "evidence_quality_score": 85,
        "follow_up_answers": [
            {"question": "Is vehicular traffic blocked?", "answer": "Yes, danger urgent active"}
        ]
    }, headers=c_headers)
    assert boost_calc.status_code == 200, f"Boost calc failed: {boost_calc.data}"
    boost_data = boost_calc.get_json()
    boost_score = boost_data["civic_risk_score"]["score"]
    print(f"[✓] Follow-up boosted priority score: {boost_score}")
    assert boost_score >= base_score, f"Expected boost {boost_score} >= {base_score}"

    # 3. Create report with follow-up answers
    create_res = client.post("/api/reports", json={
        "title": "Severe Crater on Kashmir Highway",
        "description": "Deep crater on expressway near school causing traffic disruption.",
        "category": "road_hazard",
        "department_id": "cda_roads",
        "location": {
            "address": "Kashmir Highway near G-9, Islamabad",
            "latitude": 33.6938,
            "longitude": 73.0305,
            "city": "Islamabad"
        },
        "missing_information_questions": ["Is vehicular traffic blocked?"],
        "missing_information_answers": [
            {"question": "Is vehicular traffic blocked?", "answer": "Yes, traffic is completely blocked"}
        ]
    }, headers=c_headers)
    assert create_res.status_code == 201, f"Create report failed: {create_res.data}"
    rep = create_res.get_json()["report"]
    report_id = rep["id"]
    print(f"[✓] Report created with ID: {report_id}, Tracking ID: {rep['tracking_id']}")
    assert len(rep.get("missing_information_answers", [])) == 1, "Missing info answers not saved!"

    # 4. Officer requests more info
    req_res = client.post(f"/api/departments/reports/{report_id}/request-info", json={
        "note": "Please specify the exact lane number and if water is accumulated inside."
    }, headers=o_headers)
    assert req_res.status_code == 200, f"Request info failed: {req_res.data}"
    updated_rep = req_res.get_json()["report"]
    assert updated_rep.get("needs_citizen_response") is True, "needs_citizen_response should be True"
    assert updated_rep.get("citizen_info_request") is not None, "citizen_info_request missing"
    print(f"[✓] Officer requested info: {updated_rep['citizen_info_request']['note']}")

    # 5. Citizen responds to info request
    resp_res = client.post(f"/api/reports/{report_id}/respond-info", json={
        "response": "It is in the fast lane going towards Rawalpindi. Yes, rainwater is filled."
    }, headers=c_headers)
    assert resp_res.status_code == 200, f"Citizen respond-info failed: {resp_res.data}"
    citizen_answered_rep = resp_res.get_json()["report"]
    assert citizen_answered_rep.get("needs_citizen_response") is False, "needs_citizen_response should be cleared to False"
    assert len(citizen_answered_rep.get("citizen_responses", [])) == 1, "Citizen response not stored"
    print(f"[✓] Citizen responded successfully: {citizen_answered_rep['citizen_responses'][0]['response']}")
    print(f"[✓] New status: {citizen_answered_rep['status']}")

    print("\nALL FEATURE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_workflow()
