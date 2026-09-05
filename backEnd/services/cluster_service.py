"""
Raabta AI - Proximity Clustering & Duplicate Detection Service
Detects nearby related civic incidents using Haversine distance (< 250 meters),
groups related complaints into master clusters, and prevents duplicate resource dispatch.
"""

import math
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple
from database import serialize_doc


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two points in meters.
    """
    R = 6371000  # Radius of Earth in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def are_categories_related(cat1: str, cat2: str) -> bool:
    """Checks whether two categories are the same or functionally related."""
    c1 = (cat1 or "").strip().lower().replace("&", "_").replace("-", "_").replace(" ", "_")
    c2 = (cat2 or "").strip().lower().replace("&", "_").replace("-", "_").replace(" ", "_")
    if c1 == c2:
        return True

    groups = [
        {"electrical", "power", "iesco", "electricity", "transformer", "wire"},
        {"gas", "sngpl", "leak", "pipeline"},
        {"water", "sewage", "sanitation", "drainage", "wasa", "water_supply"},
        {"road", "pothole", "cda", "pave", "traffic", "infrastructure"},
        {"garbage", "waste", "trash", "cleanliness"}
    ]

    for group in groups:
        if any(term in c1 for term in group) and any(term in c2 for term in group):
            return True

    return False


def process_report_clustering(report: Dict[str, Any], db) -> Dict[str, Any]:
    """
    Evaluates a newly submitted or updated report against open reports and existing clusters.
    Associates report to a cluster if within 250 meters and category matches.
    """
    location = report.get("location") or {}
    lat = location.get("latitude")
    lon = location.get("longitude")

    if lat is None or lon is None:
        return {"clustered": False, "cluster_id": None}

    try:
        lat = float(lat)
        lon = float(lon)
    except (ValueError, TypeError):
        return {"clustered": False, "cluster_id": None}

    category = report.get("category", "")
    report_id = str(report.get("_id", report.get("id")))

    # 1. Check existing open clusters first
    existing_clusters = list(db.issue_clusters.find({"status": {"$ne": "resolved"}}))
    for cluster in existing_clusters:
        c_lat = cluster.get("centroid_lat")
        c_lon = cluster.get("centroid_lon")
        c_cat = cluster.get("category", "")

        if c_lat is not None and c_lon is not None and are_categories_related(category, c_cat):
            dist = haversine_distance(lat, lon, float(c_lat), float(c_lon))
            if dist <= 250.0:
                # Add to this cluster
                cluster_id = str(cluster.get("_id", cluster.get("id")))
                report_ids = cluster.get("report_ids", [])
                if report_id not in report_ids:
                    report_ids.append(report_id)

                # Update centroid and count
                n = len(report_ids)
                new_c_lat = round((float(c_lat) * (n - 1) + lat) / n, 6)
                new_c_lon = round((float(c_lon) * (n - 1) + lon) / n, 6)

                current_risk = report.get("civic_risk_score", {}).get("score", 50)
                old_avg_risk = cluster.get("avg_risk_score", 50)
                new_avg_risk = round((old_avg_risk * (n - 1) + current_risk) / n, 1)

                db.issue_clusters.update_one(
                    {"_id": cluster.get("_id")},
                    {
                        "$set": {
                            "report_ids": report_ids,
                            "report_count": n,
                            "centroid_lat": new_c_lat,
                            "centroid_lon": new_c_lon,
                            "avg_risk_score": new_avg_risk,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )

                db.civic_reports.update_one(
                    {"_id": report.get("_id")},
                    {"$set": {"cluster_id": cluster_id, "is_duplicate": True}}
                )

                return {
                    "clustered": True,
                    "cluster_id": cluster_id,
                    "cluster_code": cluster.get("cluster_code"),
                    "distance_meters": round(dist, 1),
                    "total_in_cluster": n
                }

    # 2. If not matched to existing cluster, search for nearby open standalone reports
    open_reports = list(db.civic_reports.find({
        "_id": {"$ne": report.get("_id")},
        "status": {"$in": ["submitted", "in_review", "assigned", "in_progress"]}
    }))

    nearby_reports = []
    for r in open_reports:
        r_loc = r.get("location") or {}
        r_lat = r_loc.get("latitude")
        r_lon = r_loc.get("longitude")
        if r_lat is not None and r_lon is not None and are_categories_related(category, r.get("category", "")):
            try:
                r_dist = haversine_distance(lat, lon, float(r_lat), float(r_lon))
                if r_dist <= 250.0:
                    nearby_reports.append(r)
            except Exception:
                continue

    if nearby_reports:
        # Create a new cluster grouping these reports
        cluster_id = str(uuid.uuid4())
        cluster_count = db.issue_clusters.count_documents({}) + 1
        cluster_code = f"RA-CLU-{cluster_count:04d}"

        all_reports = [report] + nearby_reports
        all_ids = [str(r.get("_id", r.get("id"))) for r in all_reports]

        c_lat = round(sum(float(r.get("location", {}).get("latitude", lat)) for r in all_reports) / len(all_reports), 6)
        c_lon = round(sum(float(r.get("location", {}).get("longitude", lon)) for r in all_reports) / len(all_reports), 6)

        scores = [r.get("civic_risk_score", {}).get("score", 50) for r in all_reports]
        avg_risk = round(sum(scores) / len(scores), 1)

        now = datetime.now(timezone.utc).isoformat()
        cluster_doc = {
            "_id": cluster_id,
            "id": cluster_id,
            "cluster_code": cluster_code,
            "title": f"Cluster: {category} Hazard ({len(all_reports)} reports)",
            "category": category,
            "department_id": report.get("department_id"),
            "centroid_lat": c_lat,
            "centroid_lon": c_lon,
            "report_ids": all_ids,
            "report_count": len(all_reports),
            "avg_risk_score": avg_risk,
            "status": "active",
            "created_at": now,
            "updated_at": now
        }

        db.issue_clusters.insert_one(cluster_doc)

        # Mark all involved reports with this cluster_id
        for r in all_reports:
            is_dup = (str(r.get("_id", r.get("id"))) != report_id)
            db.civic_reports.update_one(
                {"_id": r.get("_id")},
                {"$set": {"cluster_id": cluster_id, "is_duplicate": is_dup}}
            )

        return {
            "clustered": True,
            "cluster_id": cluster_id,
            "cluster_code": cluster_code,
            "created_new_cluster": True,
            "total_in_cluster": len(all_reports)
        }

    return {"clustered": False, "cluster_id": None}
