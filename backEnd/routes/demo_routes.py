"""
Raabta AI - Hackathon Demo Routes
Allows one-click demo data seeding and resetting for live evaluation and presentations.
"""

from flask import Blueprint, request, jsonify
from seed_demo import seed_demo_database, DEMO_USERS

demo_bp = Blueprint("demo_bp", __name__)


@demo_bp.route("/seed", methods=["POST"], strict_slashes=False)
def seed_demo():
    result = seed_demo_database(reset=False)
    return jsonify({
        "success": True,
        "message": "Demo data successfully verified and seeded.",
        "details": result,
        "demo_accounts": [
            {"role": "Citizen", "email": "citizen@raabta.gov.pk", "password": "Password123!"},
            {"role": "Duty Officer (IESCO)", "email": "officer@raabta.gov.pk", "password": "Password123!"},
            {"role": "Command Admin", "email": "admin@raabta.gov.pk", "password": "Password123!"}
        ]
    }), 200


@demo_bp.route("/reset", methods=["POST"], strict_slashes=False)
def reset_demo():
    result = seed_demo_database(reset=True)
    return jsonify({
        "success": True,
        "message": "Platform reset to clean baseline hackathon demo state.",
        "details": result,
        "demo_accounts": [
            {"role": "Citizen", "email": "citizen@raabta.gov.pk", "password": "Password123!"},
            {"role": "Duty Officer (IESCO)", "email": "officer@raabta.gov.pk", "password": "Password123!"},
            {"role": "Command Admin", "email": "admin@raabta.gov.pk", "password": "Password123!"}
        ]
    }), 200


@demo_bp.route("/accounts", methods=["GET"], strict_slashes=False)
def get_demo_accounts():
    return jsonify({
        "success": True,
        "demo_accounts": [
            {"role": "Citizen", "email": "citizen@raabta.gov.pk", "password": "Password123!", "name": "Ahmad Bilal Khan"},
            {"role": "Duty Officer", "email": "officer@raabta.gov.pk", "password": "Password123!", "name": "Engr. Tariq Mehmood (IESCO)"},
            {"role": "Command Admin", "email": "admin@raabta.gov.pk", "password": "Password123!", "name": "Dr. Sarah Farooq (Commissioner)"}
        ]
    }), 200
