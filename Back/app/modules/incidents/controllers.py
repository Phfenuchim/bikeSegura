from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from .services import IncidentService

incidents_bp = Blueprint("incidents", __name__)
service = IncidentService()


@incidents_bp.get("/incidents")
def list_incidents():
    incidents = service.list_incidents()
    return jsonify([_serialize_incident(i) for i in incidents])


@incidents_bp.post("/incidents")
@jwt_required(optional=True)
def create_incident():
    payload = request.get_json() or {}
    try:
        incident = service.create_incident(payload, user_id=get_jwt_identity())
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    return jsonify(_serialize_incident(incident)), 201


@incidents_bp.post("/dev/seed")
def seed_data():
    if service.list_incidents():
        return jsonify({"message": "already seeded"})
    sample = [
        {"title": "Buraco na ciclovia", "latitude": -23.5505, "longitude": -46.6333, "severity": "warning"},
        {"title": "Trânsito pesado", "latitude": -23.5570, "longitude": -46.6490, "severity": "info"},
        {"title": "Alagamento", "latitude": -23.5590, "longitude": -46.6400, "severity": "danger"},
    ]
    for item in sample:
        service.create_incident(item, user_id=None)
    return jsonify({"message": "seeded", "count": len(sample)})


def _serialize_incident(incident):
    return {
        "id": incident.id,
        "title": incident.title,
        "description": incident.description,
        "latitude": incident.latitude,
        "longitude": incident.longitude,
        "severity": incident.severity,
        "created_at": incident.created_at.isoformat(),
        "user_id": incident.user_id,
    }
