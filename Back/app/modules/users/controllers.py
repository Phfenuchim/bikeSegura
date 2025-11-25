from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from .services import UserService

users_bp = Blueprint("users", __name__)
service = UserService()


@users_bp.post("/register")
def register():
    payload = request.get_json() or {}
    email = payload.get("email")
    password = payload.get("password")
    full_name = payload.get("full_name") or "Novo Usuário"

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400
    try:
        access, refresh, user = service.register(email, full_name, password)
    except ValueError as err:
        return jsonify({"error": str(err)}), 409

    return (
        jsonify({"access_token": access, "refresh_token": refresh, "user": _serialize_user(user)}),
        201,
    )


@users_bp.post("/login")
def login():
    payload = request.get_json() or {}
    email = payload.get("email")
    password = payload.get("password")
    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400
    try:
        access, refresh, user = service.login(email, password)
    except PermissionError as err:
        return jsonify({"error": str(err)}), 401
    return jsonify({"access_token": access, "refresh_token": refresh, "user": _serialize_user(user)})


@users_bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = service.get_me(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify(_serialize_user(user))


@users_bp.get("/<int:user_id>")
def public_profile(user_id: int):
    user = service.get_me(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify(_serialize_user(user))


@users_bp.patch("/me")
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    payload = request.get_json() or {}
    try:
        user = service.update_profile(user_id, payload)
    except LookupError as err:
        return jsonify({"error": str(err)}), 404
    return jsonify(_serialize_user(user))


def _serialize_user(user):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "points": user.points,
        "bio": user.bio,
        "avatar_url": user.avatar_url,
    }
