from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from .services import RouteService

routes_bp = Blueprint("routes", __name__)
service = RouteService()


@routes_bp.get("/routes")
def list_routes():
    routes = service.list_routes()
    return jsonify([_serialize_route(r) for r in routes])


@routes_bp.get("/routes/rank")
def rank_routes():
    avoid_inc = request.args.get("avoid_incidents", "0") == "1"
    low_traffic = request.args.get("low_traffic", "0") == "1"
    low_elevation = request.args.get("low_elevation", "0") == "1"
    ranked = service.rank_routes(avoid_incidents=avoid_inc)
    # low_traffic/low_elevation ficam como placeholders enquanto nao ha dados
    return jsonify(
        [
          {
            **_serialize_route(r),
            "score": idx,
            "prefs": {"avoid_incidents": avoid_inc, "low_traffic": low_traffic, "low_elevation": low_elevation},
          }
          for idx, r in enumerate(ranked)
        ]
    )


@routes_bp.get("/routes/search")
def search_routes():
    q = request.args.get("q", "", type=str)
    results = service.search_routes(q)
    return jsonify([_serialize_route(r) for r in results])


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


@routes_bp.post("/routes/<int:route_id>/save")
@jwt_required()
def save_route(route_id: int):
    payload = request.get_json() or {}
    save = bool(payload.get("save", True))
    try:
        result = service.save_route(route_id, user_id=get_jwt_identity(), save=save)
    except LookupError as err:
        return jsonify({"error": str(err)}), 404
    return jsonify({"saved": result})


@routes_bp.get("/routes/saved")
@jwt_required()
def list_saved():
    saved = service.list_saved(user_id=get_jwt_identity())
    return jsonify([_serialize_route(r) for r in saved])


@routes_bp.post("/routes/<int:route_id>/share")
@jwt_required()
def share_route(route_id: int):
    payload = request.get_json() or {}
    try:
        share = service.share_route(route_id, user_id=get_jwt_identity(), note=payload.get("note"))
    except LookupError as err:
        return jsonify({"error": str(err)}), 404
    return jsonify({"id": share.id, "route_id": share.route_id, "note": share.note, "created_at": share.created_at.isoformat()})


@routes_bp.post("/routes/<int:route_id>/waypoints")
@jwt_required()
def set_waypoints(route_id: int):
    payload = request.get_json() or {}
    waypoints = payload.get("waypoints") or []
    try:
        objs = service.set_waypoints(route_id, waypoints)
    except LookupError as err:
        return jsonify({"error": str(err)}), 404
    except ValueError as err:
        return jsonify({"error": str(err)}), 400
    return jsonify([_serialize_waypoint(wp) for wp in objs])


@routes_bp.get("/routes/<int:route_id>/waypoints")
def list_waypoints(route_id: int):
    try:
        objs = service.list_waypoints(route_id)
    except LookupError as err:
        return jsonify({"error": str(err)}), 404
    return jsonify([_serialize_waypoint(wp) for wp in objs])


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
        "traffic_score": route.traffic_score,
        "elevation_gain": route.elevation_gain,
    }


def _serialize_waypoint(wp):
    return {
        "id": wp.id,
        "route_id": wp.route_id,
        "name": wp.name,
        "latitude": wp.latitude,
        "longitude": wp.longitude,
        "seq": wp.seq,
        "created_at": wp.created_at.isoformat(),
    }
