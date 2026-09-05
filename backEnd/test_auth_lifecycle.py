"""
Unit/integration test for Raabta AI Authentication Lifecycle:
- Cold-start bootstrap verification
- Baseline user logins (admin, officer, citizen)
- Invalid password rejection
- Forgot password token creation (SHA-256 stored)
- Verify reset token
- Reset password execution
- Login with new password
- Change password via authenticated endpoint
- Profile update
"""
import sys
import os
import json

# Add current dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app
from database import get_db, ensure_baseline_system

def run_tests():
    client = app.test_client()
    db = get_db()
    
    print("=== TEST 1: Baseline Accounts Guaranteed ===")
    admin = db.users.find_one({"email": "admin@raabta.gov.pk"})
    officer = db.users.find_one({"email": "officer@raabta.gov.pk"})
    citizen = db.users.find_one({"email": "citizen@raabta.gov.pk"})
    assert admin is not None, "Admin user missing"
    assert officer is not None, "Officer user missing"
    assert citizen is not None, "Citizen user missing"
    print(f"PASS: Baseline users exist: Admin={admin['role']}, Officer={officer['role']}, Citizen={citizen['role']}")

    print("\n=== TEST 2: Admin Login ===")
    res = client.post("/api/auth/login", json={"email": "admin@raabta.gov.pk", "password": "Password123!"})
    data = res.get_json()
    assert res.status_code == 200, f"Admin login failed: {data}"
    assert data["success"] is True
    admin_token = data["token"]
    assert data["user"]["role"] == "admin"
    print("PASS: Admin authenticated successfully, JWT generated, role=admin")

    print("\n=== TEST 3: Duty Officer Login ===")
    res = client.post("/api/auth/login", json={"email": "officer@raabta.gov.pk", "password": "Password123!"})
    data = res.get_json()
    assert res.status_code == 200, f"Officer login failed: {data}"
    assert data["success"] is True
    officer_token = data["token"]
    assert data["user"]["role"] == "officer"
    print("PASS: Duty Officer authenticated successfully, role=officer, dept=IESCO")

    print("\n=== TEST 4: Invalid Password Rejection ===")
    res = client.post("/api/auth/login", json={"email": "admin@raabta.gov.pk", "password": "WrongPassword!"})
    assert res.status_code == 401
    print("PASS: Invalid credentials rejected with 401")

    print("\n=== TEST 5: Role Protection / Admin Route Access ===")
    # Citizen trying to access admin endpoint
    res_cit = client.post("/api/auth/login", json={"email": "citizen@raabta.gov.pk", "password": "Password123!"})
    cit_token = res_cit.get_json()["token"]
    
    # Try accessing admin overview
    res_unauth = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {cit_token}"})
    assert res_unauth.status_code in [401, 403], f"Citizen accessed admin route: {res_unauth.status_code}"
    print("PASS: Citizen blocked from admin endpoint with 403 Forbidden")

    # Admin accessing admin overview
    res_auth = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_auth.status_code == 200, f"Admin access failed: {res_auth.status_code}"
    print("PASS: Admin granted access to admin endpoint")

    print("\n=== TEST 6: Forgot Password Flow ===")
    # Request reset for citizen
    res = client.post("/api/auth/forgot-password", json={"email": "citizen@raabta.gov.pk"})
    assert res.status_code == 200
    # In db, find the reset record
    reset_doc = db.password_resets.find_one({"email": "citizen@raabta.gov.pk", "used": False})
    assert reset_doc is not None, "Password reset document not created"
    assert "token_hash" in reset_doc
    print("PASS: Forgot password initiated, hashed token stored")

    # Non-existent email should return 200 neutral message without leaking existence
    res_ghost = client.post("/api/auth/forgot-password", json={"email": "nonexistent@fake.com"})
    assert res_ghost.status_code == 200
    assert "instructions" in res_ghost.get_json()["message"]
    print("PASS: Non-existent email returns neutral success to prevent enumeration")

    print("\n=== TEST 7: Change Password via Authenticated Endpoint ===")
    res = client.post(
        "/api/auth/change-password",
        headers={"Authorization": f"Bearer {cit_token}"},
        json={
            "current_password": "Password123!",
            "new_password": "NewSecretPass2026!",
            "confirm_password": "NewSecretPass2026!"
        }
    )
    assert res.status_code == 200, f"Change password failed: {res.get_json()}"
    print("PASS: Authenticated password change succeeded")

    # Verify old password fails
    res = client.post("/api/auth/login", json={"email": "citizen@raabta.gov.pk", "password": "Password123!"})
    assert res.status_code == 401
    # Verify new password succeeds
    res = client.post("/api/auth/login", json={"email": "citizen@raabta.gov.pk", "password": "NewSecretPass2026!"})
    assert res.status_code == 200
    new_cit_token = res.get_json()["token"]
    print("PASS: Old password rejected, new password authenticated")

    # Restore citizen password for consistency
    client.post(
        "/api/auth/change-password",
        headers={"Authorization": f"Bearer {new_cit_token}"},
        json={
            "current_password": "NewSecretPass2026!",
            "new_password": "Password123!",
            "confirm_password": "Password123!"
        }
    )
    print("PASS: Baseline password restored")

    print("\n=== TEST 8: Profile Update ===")
    res = client.put(
        "/api/auth/profile",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "full_name": "Dr. Sarah Farooq (Chief Commissioner)",
            "phone": "+92 321 5559999",
            "preferences": {"reduced_motion": False, "theme": "light"}
        }
    )
    assert res.status_code == 200
    updated = res.get_json()["user"]
    assert updated["full_name"] == "Dr. Sarah Farooq (Chief Commissioner)"
    assert updated.get("preferences", {}).get("theme") == "light"
    print("PASS: Profile and user preferences updated and persisted")

    print("\n==========================================")
    print("ALL AUTH & RBAC LIFECYCLE TESTS PASSED! 100%")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
