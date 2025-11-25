from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from .services import SOSService

sos_bp = Blueprint("sos", __name__)
service = SOSService()


@sos_bp.get("/sos")
def list_sos():
    alerts = service.list_alerts()
    return jsonify([_serialize_alert(a) for a in alerts])


@sos_bp.post("/sos")
@jwt_required(optional=True)
def create_sos():
    payload = request.get_json() or {}
    try:
        alert = service.create_alert(payload, user_id=get_jwt_identity())
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    return jsonify(_serialize_alert(alert)), 201


@sos_bp.patch("/sos/<int:alert_id>/status")
@jwt_required()
def update_sos(alert_id: int):
    payload = request.get_json() or {}
    status = payload.get("status")
    if not status:
        return jsonify({"error": "status is required"}), 400
    try:
        alert = service.update_status(alert_id, status)
    except LookupError as err:
        return jsonify({"error": str(err)}), 404
    return jsonify(_serialize_alert(alert))


def _serialize_alert(alert):
    return {
        "id": alert.id,
        "latitude": alert.latitude,
        "longitude": alert.longitude,
        "status": alert.status,
        "message": alert.message,
        "user_id": alert.user_id,
        "created_at": alert.created_at.isoformat(),
    }
