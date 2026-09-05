"""
Raabta AI - Civic Hotspots & Insights Routes
Provides analytics, geospatial pins for Leaflet hotspot maps, and departmental performance trends.
"""

from flask import Blueprint, request, jsonify
from database import get_db, serialize_doc

insights_bp = Blueprint("insights_bp", __name__)


@insights_bp.route("/hotspots", methods=["GET"], strict_slashes=False)
def get_civic_hotspots():
    """
    Returns map-ready data points (individual reports and cluster centroids)
    with coordinates, risk level colors, and incident details.
    """
    db = get_db()
    reports = list(db.civic_reports.find({}))
    clusters = list(db.issue_clusters.find({"status": {"$ne": "resolved"}}))

    pins = []
    # 1. Cluster centroid pins (represent grouped hotspot areas)
    for c in clusters:
        c_lat = c.get("centroid_lat")
        c_lon = c.get("centroid_lon")
        if c_lat is not None and c_lon is not None:
            pins.append({
                "id": str(c.get("_id", c.get("id"))),
                "type": "cluster",
                "title": c.get("title", f"Cluster {c.get('cluster_code')}"),
                "cluster_code": c.get("cluster_code"),
                "category": c.get("category"),
                "latitude": float(c_lat),
                "longitude": float(c_lon),
                "risk_score": c.get("avg_risk_score", 50),
                "risk_level": "CRITICAL" if c.get("avg_risk_score", 0) >= 75 else "HIGH" if c.get("avg_risk_score", 0) >= 50 else "MEDIUM",
                "report_count": c.get("report_count", len(c.get("report_ids", []))),
                "status": c.get("status", "active")
            })

    # 2. Individual reports with GPS coordinates
    for r in reports:
        loc = r.get("location") or {}
        lat = loc.get("latitude")
        lon = loc.get("longitude")
        if lat is not None and lon is not None:
            try:
                lat_f = float(lat)
                lon_f = float(lon)
                risk_data = r.get("civic_risk_score") or {}
                score = risk_data.get("score", 50)
                level = risk_data.get("level", "MEDIUM")

                pins.append({
                    "id": str(r.get("_id", r.get("id"))),
                    "tracking_id": r.get("tracking_id"),
                    "type": "report",
                    "title": r.get("title"),
                    "category": r.get("category"),
                    "address": loc.get("address", ""),
                    "latitude": lat_f,
                    "longitude": lon_f,
                    "risk_score": score,
                    "risk_level": level,
                    "status": r.get("status", "submitted"),
                    "cluster_id": r.get("cluster_id"),
                    "is_duplicate": r.get("is_duplicate", False)
                })
            except (ValueError, TypeError):
                continue

    return jsonify({
        "success": True,
        "count": len(pins),
        "hotspots": pins
    }), 200


from datetime import datetime, timezone

@insights_bp.route("/trends", methods=["GET"], strict_slashes=False)
@insights_bp.route("/summary", methods=["GET"], strict_slashes=False)
def get_civic_trends():
    """Returns real aggregated platform metrics, category distributions, and SLA metrics."""
    db = get_db()
    reports = list(db.civic_reports.find({}))
    total_count = len(reports)

    # Status tallies
    status_counts = {"submitted": 0, "in_review": 0, "assigned": 0, "in_progress": 0, "resolved": 0, "disputed": 0, "closed": 0}
    category_counts = {}
    area_counts = {}
    department_workload = {}
    risk_levels = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    total_risk = 0

    disputed_count = 0
    closed_count = 0
    resolution_hours_list = []
    sla_compliant_count = 0

    for r in reports:
        st = r.get("status", "submitted")
        if st in status_counts:
            status_counts[st] += 1
        else:
            status_counts[st] = 1

        cat = r.get("category", "Other")
        category_counts[cat] = category_counts.get(cat, 0) + 1

        dept = r.get("department_name") or r.get("department_id") or "Unassigned"
        department_workload[dept] = department_workload.get(dept, 0) + 1

        loc = r.get("location") or {}
        addr = loc.get("address") or loc.get("city") or "ICT Region"
        area_key = addr.split(",")[0].strip() if "," in addr else addr.strip()
        if area_key:
            area_counts[area_key] = area_counts.get(area_key, 0) + 1

        score_info = r.get("civic_risk_score") or {}
        score = score_info.get("score", 50)
        total_risk += score

        if score >= 75:
            risk_levels["CRITICAL"] += 1
        elif score >= 50:
            risk_levels["HIGH"] += 1
        elif score >= 25:
            risk_levels["MEDIUM"] += 1
        else:
            risk_levels["LOW"] += 1

        if st == "disputed":
            disputed_count += 1
        elif st == "closed":
            closed_count += 1

        # Real response time calculation between created_at and resolved_at
        created_str = r.get("created_at")
        resolved_str = (r.get("resolution") or {}).get("resolved_at") or (r.get("updated_at") if st in ["resolved", "closed"] else None)
        if st in ["resolved", "closed"] and created_str and resolved_str:
            try:
                t1 = datetime.fromisoformat(str(created_str).replace("Z", "+00:00"))
                t2 = datetime.fromisoformat(str(resolved_str).replace("Z", "+00:00"))
                diff_hours = (t2 - t1).total_seconds() / 3600.0
                if diff_hours >= 0:
                    resolution_hours_list.append(diff_hours)
                    sla_h = r.get("sla_hours") or score_info.get("recommended_sla_hours", 48)
                    if diff_hours <= sla_h:
                        sla_compliant_count += 1
            except Exception:
                pass

    avg_risk = round(total_risk / total_count, 1) if total_count > 0 else 0
    resolved_total = status_counts.get("resolved", 0) + status_counts.get("closed", 0)

    # Real verification satisfaction rate: closed / (closed + disputed)
    verified_total = closed_count + disputed_count
    citizen_satisfaction = round((closed_count / verified_total * 100), 1) if verified_total > 0 else None

    # Real average resolution hours and SLA compliance
    avg_resolution_hours = round(sum(resolution_hours_list) / len(resolution_hours_list), 1) if resolution_hours_list else None
    sla_compliance_rate = round((sla_compliant_count / len(resolution_hours_list) * 100), 1) if resolution_hours_list else None

    # Cluster reduction metric (duplicates saved)
    cluster_count = db.issue_clusters.count_documents({})
    duplicate_reports_merged = sum(1 for r in reports if r.get("is_duplicate"))

    # Top areas sorted
    sorted_areas = sorted(area_counts.items(), key=lambda x: x[1], reverse=True)[:5]
    top_areas = [{"area": a[0], "count": a[1]} for a in sorted_areas]

    return jsonify({
        "success": True,
        "metrics": {
            "total_reports": total_count,
            "active_open": total_count - resolved_total,
            "resolved_count": resolved_total,
            "critical_count": risk_levels["CRITICAL"],
            "disputed_count": disputed_count,
            "verified_confirmed_count": closed_count,
            "average_risk_score": avg_risk,
            "clusters_formed": cluster_count,
            "duplicate_reports_merged": duplicate_reports_merged,
            "citizen_satisfaction_rate": citizen_satisfaction,
            "avg_resolution_hours": avg_resolution_hours,
            "sla_compliance_rate": sla_compliance_rate
        },
        "status_distribution": status_counts,
        "category_breakdown": category_counts,
        "department_workload": department_workload,
        "risk_distribution": risk_levels,
        "top_areas": top_areas
    }), 200
