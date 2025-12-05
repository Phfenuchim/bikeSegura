from flask import Blueprint, jsonify, request
from .services import SupportPointService

support_points_bp = Blueprint("support_points", __name__)
service = SupportPointService()

@support_points_bp.get("/support-points")
def list_points():
    points = service.list_points()
    return jsonify([_serialize_point(p) for p in points])

@support_points_bp.post("/support-points")
def create_point():
    payload = request.get_json() or {}
    try:
        point = service.create_point(payload)
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    return jsonify(_serialize_point(point)), 201

def _serialize_point(p):
    return {
        "id": p.id,
        "name": p.name,
        "type": p.type,
        "description": p.description,
        "latitude": p.latitude,
        "longitude": p.longitude,
        "created_at": p.created_at.isoformat()
    }
