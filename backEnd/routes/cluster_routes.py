"""
Raabta AI - Proximity Clusters Routes
Provides access to deduplicated civic clusters grouped by Haversine proximity (< 250m).
"""

from flask import Blueprint, request, jsonify
from database import get_db, serialize_doc

cluster_bp = Blueprint("cluster_bp", __name__)


@cluster_bp.route("", methods=["GET"], strict_slashes=False)
def list_clusters():
    db = get_db()
    status = request.args.get("status")
    query = {}
    if status and status != "all":
        query["status"] = status

    clusters = list(db.issue_clusters.find(query).sort("avg_risk_score", -1))
    return jsonify({
        "success": True,
        "count": len(clusters),
        "clusters": serialize_doc(clusters)
    }), 200


@cluster_bp.route("/<cluster_id>", methods=["GET"], strict_slashes=False)
def get_cluster(cluster_id):
    db = get_db()
    cluster = db.issue_clusters.find_one({"_id": cluster_id}) or db.issue_clusters.find_one({"id": cluster_id}) or db.issue_clusters.find_one({"cluster_code": cluster_id})
    if not cluster:
        return jsonify({"success": False, "error": "Cluster not found"}), 404

    report_ids = cluster.get("report_ids", [])
    child_reports = []
    if report_ids:
        raw_reports = list(db.civic_reports.find({"_id": {"$in": report_ids}}))
        child_reports = serialize_doc(raw_reports)

    res = serialize_doc(cluster)
    res["reports"] = child_reports
    return jsonify({
        "success": True,
        "cluster": res
    }), 200
