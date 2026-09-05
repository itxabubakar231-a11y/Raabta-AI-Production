"""
Raabta AI - Notifications Routes
Endpoints for retrieving and acknowledging in-app citizen & officer notifications.
"""

from flask import Blueprint, request, jsonify
from database import get_db, serialize_doc
from auth import token_required

notifications_bp = Blueprint("notifications_bp", __name__)


@notifications_bp.route("", methods=["GET"], strict_slashes=False)
@token_required
def get_my_notifications():
    db = get_db()
    user_id = str(request.current_user.get("id", request.current_user.get("_id")))
    notifications = list(db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(30))
    unread_count = sum(1 for n in notifications if not n.get("is_read"))

    return jsonify({
        "success": True,
        "unread_count": unread_count,
        "notifications": serialize_doc(notifications)
    }), 200


@notifications_bp.route("/<notification_id>/read", methods=["POST"], strict_slashes=False)
@token_required
def mark_notification_read(notification_id):
    db = get_db()
    user_id = str(request.current_user.get("id", request.current_user.get("_id")))
    db.notifications.update_one(
        {"_id": notification_id, "user_id": user_id},
        {"$set": {"is_read": True}}
    )
    return jsonify({"success": True, "message": "Notification marked as read."}), 200


@notifications_bp.route("/read-all", methods=["POST"], strict_slashes=False)
@token_required
def mark_all_read():
    db = get_db()
    user_id = str(request.current_user.get("id", request.current_user.get("_id")))
    # Update all unread notifications for this user
    for notif in db.notifications.find({"user_id": user_id, "is_read": False}):
        db.notifications.update_one({"_id": notif.get("_id")}, {"$set": {"is_read": True}})

    return jsonify({"success": True, "message": "All notifications marked as read."}), 200
