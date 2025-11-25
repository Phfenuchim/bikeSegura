from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from .services import EventService

events_bp = Blueprint("events", __name__)
service = EventService()


@events_bp.get("/route-events")
def list_events():
    events = service.list_events()
    return jsonify([_serialize_event(e) for e in events])


@events_bp.post("/route-events")
@jwt_required(optional=True)
def create_event():
    payload = request.get_json() or {}
    try:
        event = service.create_event(payload, user_id=get_jwt_identity())
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    return jsonify(_serialize_event(event)), 201


@events_bp.patch("/route-events/<int:event_id>/status")
@jwt_required()
def update_event_status(event_id: int):
    payload = request.get_json() or {}
    status = payload.get("status")
    if not status:
        return jsonify({"error": "status is required"}), 400
    try:
        event = service.update_status(event_id, status)
    except LookupError as err:
        return jsonify({"error": str(err)}), 404
    return jsonify(_serialize_event(event))


def _serialize_event(event):
    return {
        "id": event.id,
        "name": event.name,
        "description": event.description,
        "start_date": event.start_date.isoformat(),
        "end_date": event.end_date.isoformat() if event.end_date else None,
        "start_lat": event.start_lat,
        "start_lng": event.start_lng,
        "end_lat": event.end_lat,
        "end_lng": event.end_lng,
        "status": event.status,
        "user_id": event.user_id,
        "created_at": event.created_at.isoformat(),
    }
