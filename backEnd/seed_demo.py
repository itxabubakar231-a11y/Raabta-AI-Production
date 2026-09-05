"""
Raabta AI - Master Demo Seeder
Populates realistic Pakistani civic intelligence scenarios, pre-configured roles,
proximity clusters, risk scores, timeline events, and verification workflows.
"""

import uuid
from datetime import datetime, timezone, timedelta
from database import get_db
from auth import hash_password
from services.risk_engine import calculate_civic_risk
from routes.department_routes import ensure_departments_seeded


DEMO_USERS = [
    {
        "email": "citizen@raabta.gov.pk",
        "password": "Password123!",
        "full_name": "Ahmad Bilal Khan",
        "phone": "+92 300 5123456",
        "role": "citizen"
    },
    {
        "email": "officer@raabta.gov.pk",
        "password": "Password123!",
        "full_name": "Engr. Tariq Mehmood",
        "phone": "+92 333 5987654",
        "role": "officer",
        "department_id": "IESCO"
    },
    {
        "email": "admin@raabta.gov.pk",
        "password": "Password123!",
        "full_name": "Dr. Sarah Farooq (Commissioner)",
        "phone": "+92 321 5554321",
        "role": "admin"
    }
]


DEMO_REPORTS = [
    {
        "title": "Exposed High-Voltage Transformer Cable Snapped Near School",
        "description": "High voltage 11kV conductor has snapped from transformer pole and is dangling within 4 feet of sidewalk directly in front of Islamabad Model School for Boys. Continuous electrical sparking and visible arcing observed.",
        "category": "Electrical Hazards",
        "department_id": "IESCO",
        "department_name": "Islamabad Electric Supply Company (IESCO)",
        "status": "in_progress",
        "location": {
            "latitude": 33.7294,
            "longitude": 73.0763,
            "address": "Street 18, Sector F-6/2, Near Model School",
            "city": "Islamabad"
        },
        "evidence_quality": "Good",
        "evidence_score": 0.94,
        "image_url": "https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=60",
        "is_cluster": False
    },
    {
        "title": "Severe Gas Pipeline Leak with Strong Odor in Residential Lane",
        "description": "Underground gas pipeline rupture leaking natural gas with strong hissing sound and overwhelming odor. Residents experiencing headaches. High explosion hazard.",
        "category": "Gas Leaks & Pipelines",
        "department_id": "SNGPL",
        "department_name": "Sui Northern Gas Pipelines Limited (SNGPL)",
        "status": "assigned",
        "location": {
            "latitude": 33.6007,
            "longitude": 73.0679,
            "address": "Lane 4, Satellite Town Commercial Market",
            "city": "Rawalpindi"
        },
        "evidence_quality": "Good",
        "evidence_score": 0.91,
        "image_url": "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=600&auto=format&fit=crop&q=60",
        "is_cluster": False
    },
    {
        "title": "Major Deep Crater Pothole Damaging Axles on Jinnah Avenue",
        "description": "Large deep crater approx 4 feet wide and 8 inches deep in fast lane. Three motorbikes have skidded, causing multiple vehicle rim damages during peak morning rush.",
        "category": "Roads & Infrastructure",
        "department_id": "CDA",
        "department_name": "Capital Development Authority (CDA)",
        "status": "in_review",
        "location": {
            "latitude": 33.7182,
            "longitude": 73.0605,
            "address": "Jinnah Avenue, Blue Area Near Stock Exchange Tower",
            "city": "Islamabad"
        },
        "evidence_quality": "Good",
        "evidence_score": 0.88,
        "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60",
        "is_cluster": True,
        "cluster_role": "centroid"
    },
    {
        "title": "Sunken Road Asphalt & Edge Collapse Near Blue Area Metro",
        "description": "Asphalt subsidence adjacent to Jinnah Avenue crater, creating acute hazard for two-wheelers and braking vehicles approaching Metro station.",
        "category": "Roads & Infrastructure",
        "department_id": "CDA",
        "department_name": "Capital Development Authority (CDA)",
        "status": "in_review",
        "location": {
            "latitude": 33.7191,
            "longitude": 73.0614,
            "address": "Jinnah Avenue (Eastbound), Adjacent to Metro Station 4",
            "city": "Islamabad"
        },
        "evidence_quality": "Fair",
        "evidence_score": 0.72,
        "image_url": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60",
        "is_cluster": True,
        "cluster_role": "duplicate"
    },
    {
        "title": "Main Sewerage Line Overflow Contaminating Commercial Bazaar",
        "description": "Blackwater drain blocked and regurgitating untreated wastewater into pedestrian walkway outside fruit and vegetable vendors in G-9 Markaz.",
        "category": "Water & Sanitation",
        "department_id": "WASA",
        "department_name": "Water and Sanitation Agency (WASA)",
        "status": "submitted",
        "location": {
            "latitude": 33.6938,
            "longitude": 73.0334,
            "address": "Karachi Company Bazaar, Sector G-9 Markaz",
            "city": "Islamabad"
        },
        "evidence_quality": "Good",
        "evidence_score": 0.84,
        "image_url": "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=600&auto=format&fit=crop&q=60",
        "is_cluster": False
    },
    {
        "title": "Missing Deep Manhole Cover in Front of Jamia Mosque — RESOLVED",
        "description": "Open stormwater manhole without safety grate or warning cone on walkway leading to mosque gate.",
        "category": "Roads & Infrastructure",
        "department_id": "CDA",
        "department_name": "Capital Development Authority (CDA)",
        "status": "resolved",
        "location": {
            "latitude": 33.7025,
            "longitude": 73.0489,
            "address": "Street 44, Sector G-8/1, Near Jamia Masjid Bilal",
            "city": "Islamabad"
        },
        "evidence_quality": "Good",
        "evidence_score": 0.90,
        "image_url": "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=60",
        "is_cluster": False,
        "resolution_data": {
            "resolved_by": "officer",
            "officer_name": "Engr. Tariq Mehmood",
            "resolution_notes": "Reinforced concrete cover installed, sealed with bitumen ring, and painted with reflective yellow warning border. Area inspected and fully secured.",
            "after_image_url": "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=60",
            "ai_confidence_score": 0.94,
            "ai_summary": "AI confirms manhole cover properly installed and flush with pavement.",
            "resolved_at": datetime.now(timezone.utc).isoformat()
        }
    }
]


def seed_demo_database(reset: bool = False):
    """Populates database with complete demo scenario dataset."""
    db = get_db()

    if reset:
        for col in ["users", "departments", "civic_reports", "report_events", "issue_clusters", "resolution_verifications", "notifications", "internal_notes", "audit_logs"]:
            try:
                # Remove all documents
                docs = list(db[col].find({}))
                for d in docs:
                    db[col].delete_one({"_id": d.get("_id")})
            except Exception:
                pass

    ensure_departments_seeded(db)

    # Seed Users
    created_users = {}
    now = datetime.now(timezone.utc)
    for u in DEMO_USERS:
        existing = db.users.find_one({"email": u["email"]})
        if not existing:
            uid = str(uuid.uuid4())
            user_doc = {
                "_id": uid,
                "id": uid,
                "email": u["email"],
                "password_hash": hash_password(u["password"]),
                "full_name": u["full_name"],
                "phone": u["phone"],
                "role": u["role"],
                "department_id": u.get("department_id"),
                "is_active": True,
                "created_at": (now - timedelta(days=5)).isoformat(),
                "updated_at": now.isoformat()
            }
            db.users.insert_one(user_doc)
            created_users[u["role"]] = uid
        else:
            created_users[u["role"]] = str(existing.get("_id", existing.get("id")))

    # Seed Reports
    cluster_reports = []
    for idx, rep in enumerate(DEMO_REPORTS):
        existing = db.civic_reports.find_one({"title": rep["title"]})
        if existing:
            continue

        rid = str(uuid.uuid4())
        tracking_id = f"RA-{now.year}-{1000 + idx}"
        rep_time = (now - timedelta(hours=(24 - idx * 4))).isoformat()

        risk = calculate_civic_risk(
            category=rep["category"],
            title=rep["title"],
            description=rep["description"],
            evidence_quality=rep["evidence_quality"],
            evidence_score=rep["evidence_score"],
            location_text=rep["location"]["address"],
            lat=rep["location"]["latitude"],
            lon=rep["location"]["longitude"],
            existing_duplicate_count=1 if rep.get("is_cluster") else 0
        )

        doc = {
            "_id": rid,
            "id": rid,
            "tracking_id": tracking_id,
            "citizen_id": created_users.get("citizen"),
            "citizen_name": "Ahmad Bilal Khan",
            "citizen_phone": "+92 300 5123456",
            "title": rep["title"],
            "description": rep["description"],
            "category": rep["category"],
            "department_id": rep["department_id"],
            "department_name": rep["department_name"],
            "status": rep["status"],
            "location": rep["location"],
            "evidence": {
                "has_image": True,
                "image_url": rep["image_url"],
                "quality_label": rep["evidence_quality"],
                "quality_score": rep["evidence_score"],
                "quality_reason": f"High clarity civic photo verified with GPS timestamp."
            },
            "civic_risk_score": risk,
            "sla_hours": risk.get("recommended_sla_hours", 24),
            "missing_information_questions": [
                {
                    "id": "q1",
                    "question": "Is the hazard currently visible from the main roadway?",
                    "type": "choice",
                    "options": ["Directly visible", "Obstructed by trees", "Inside boundary wall"],
                    "importance": "medium"
                }
            ],
            "missing_information_answers": [],
            "cluster_id": None,
            "is_duplicate": False,
            "timeline": [
                {
                    "action": "REPORT_SUBMITTED",
                    "actor_role": "CITIZEN",
                    "actor_name": "Ahmad Bilal Khan",
                    "details": "Incident reported via Raabta AI with GPS-tagged photo evidence.",
                    "timestamp": rep_time
                }
            ],
            "created_at": rep_time,
            "updated_at": rep_time
        }

        if rep.get("resolution_data"):
            doc["resolution"] = rep["resolution_data"]
            doc["timeline"].append({
                "action": "WORK_COMPLETED_PENDING_VERIFICATION",
                "actor_role": "OFFICER",
                "actor_name": rep["resolution_data"]["officer_name"],
                "details": "Officer repaired asset and uploaded resolution photo. Awaiting citizen verification.",
                "timestamp": (now - timedelta(hours=2)).isoformat()
            })

        db.civic_reports.insert_one(doc)

        if rep.get("is_cluster"):
            cluster_reports.append(doc)

    # If cluster reports present, create the master cluster
    if len(cluster_reports) >= 2:
        existing_cluster = db.issue_clusters.find_one({"cluster_code": "RA-CLU-0001"})
        if not existing_cluster:
            cid = str(uuid.uuid4())
            cluster_doc = {
                "_id": cid,
                "id": cid,
                "cluster_code": "RA-CLU-0001",
                "title": "Cluster: Jinnah Avenue Blue Area Road Degradation (2 reports)",
                "category": "Roads & Infrastructure",
                "department_id": "CDA",
                "centroid_lat": 33.7186,
                "centroid_lon": 73.0609,
                "report_ids": [str(r["_id"]) for r in cluster_reports],
                "report_count": len(cluster_reports),
                "avg_risk_score": 68.5,
                "status": "active",
                "created_at": (now - timedelta(hours=14)).isoformat(),
                "updated_at": now.isoformat()
            }
            db.issue_clusters.insert_one(cluster_doc)

            for idx, r in enumerate(cluster_reports):
                db.civic_reports.update_one(
                    {"_id": r["_id"]},
                    {"$set": {"cluster_id": cid, "is_duplicate": (idx > 0)}}
                )

    # Seed Notifications for Citizen
    c_uid = created_users.get("citizen")
    if c_uid and db.notifications.count_documents({"user_id": c_uid}) == 0:
        db.notifications.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": c_uid,
            "title": "Resolution Verification Pending: RA-2026-1005",
            "message": "Duty Officer Tariq Mehmood has resolved the open manhole issue in G-8/1. Please verify and confirm closure.",
            "type": "verification_requested",
            "is_read": False,
            "created_at": (now - timedelta(hours=2)).isoformat()
        })
        db.notifications.insert_one({
            "_id": str(uuid.uuid4()),
            "user_id": c_uid,
            "title": "High Risk Dispatched: RA-2026-1000",
            "message": "IESCO Rapid Response Team dispatched for Critical Risk live wire hazard in F-6/2.",
            "type": "status_update",
            "is_read": False,
            "created_at": (now - timedelta(hours=8)).isoformat()
        })

    print("[DemoSeeder] Successfully seeded realistic Pakistani civic dataset.")
    return {
        "success": True,
        "users": DEMO_USERS,
        "reports_count": db.civic_reports.count_documents({}),
        "clusters_count": db.issue_clusters.count_documents({}),
        "departments_count": db.departments.count_documents({})
    }


if __name__ == "__main__":
    seed_demo_database(reset=True)
