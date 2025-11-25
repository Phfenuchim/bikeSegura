from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from .services import FeedService

feed_bp = Blueprint("feed", __name__)
service = FeedService()


@feed_bp.get("/feed")
def list_feed():
    posts = service.list_posts()
    return jsonify([_serialize_post(p) for p in posts])


@feed_bp.post("/feed")
@jwt_required(optional=True)
def create_feed():
    payload = request.get_json() or {}
    try:
        post = service.create_post(payload, user_id=get_jwt_identity())
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    return jsonify(_serialize_post(post)), 201


def _serialize_post(post):
    return {
        "id": post.id,
        "content": post.content,
        "created_at": post.created_at.isoformat(),
        "user_id": post.user_id,
    }
