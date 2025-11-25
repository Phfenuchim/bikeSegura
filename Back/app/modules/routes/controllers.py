from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from .services import RouteService

routes_bp = Blueprint("routes", __name__)
service = RouteService()


@routes_bp.get("/routes")
def list_routes():
    routes = service.list_routes()
    return jsonify([_serialize_route(r) for r in routes])


@routes_bp.post("/routes")
@jwt_required(optional=True)
def create_route():
    payload = request.get_json() or {}
    try:
        route = service.create_route(payload, user_id=get_jwt_identity())
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    return jsonify(_serialize_route(route)), 201


@routes_bp.get("/routes/<int:route_id>")
def get_route(route_id: int):
    route = service.repo.get_by_id(route_id)
    if not route:
        return jsonify({"error": "route not found"}), 404
    return jsonify(_serialize_route(route))


@routes_bp.post("/routes/<int:route_id>/incidents")
@jwt_required(optional=True)
def add_incident(route_id: int):
    payload = request.get_json() or {}
    try:
        incident = service.add_incident_to_route(
            route_id,
            {**payload, "user_id": get_jwt_identity()},
        )
    except LookupError as err:
        return jsonify({"error": str(err)}), 404
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    return jsonify(
        {
            "id": incident.id,
            "title": incident.title,
            "description": incident.description,
            "latitude": incident.latitude,
            "longitude": incident.longitude,
            "severity": incident.severity,
            "created_at": incident.created_at.isoformat(),
            "user_id": incident.user_id,
        }
    ), 201


def _serialize_route(route):
    return {
        "id": route.id,
        "name": route.name,
        "description": route.description,
        "start_lat": route.start_lat,
        "start_lng": route.start_lng,
        "end_lat": route.end_lat,
        "end_lng": route.end_lng,
        "distance_km": route.distance_km,
        "user_id": route.user_id,
        "created_at": route.created_at.isoformat(),
    }
