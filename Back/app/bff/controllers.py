from flask import Blueprint, jsonify
from ..modules.incidents.services import IncidentService
from ..modules.routes.services import RouteService
from ..modules.sos.services import SOSService
from ..modules.feed.services import FeedService
from ..modules.events.services import EventService
from flask_jwt_extended import jwt_required, get_jwt_identity

bff_bp = Blueprint("bff", __name__)
incident_service = IncidentService()
route_service = RouteService()
sos_service = SOSService()
feed_service = FeedService()
event_service = EventService()


@bff_bp.get("/map/summary")
def map_summary():
    summary = incident_service.summarize()
    routes = route_service.list_routes()
    sos = sos_service.list_alerts()
    events = event_service.list_events()
    shared = route_service.repo.list_shared_recent(limit=10)
    return jsonify(
        {
            "incidents": summary,
            "routes": [
                {
                    "id": r.id,
                    "name": r.name,
                    "start": {"lat": r.start_lat, "lng": r.start_lng},
                    "end": {"lat": r.end_lat, "lng": r.end_lng},
                }
                for r in routes[:5]
            ],
            "events": [
                {
                    "id": e.id,
                    "name": e.name,
                    "start_date": e.start_date.isoformat(),
                    "status": e.status,
                    "start": {"lat": e.start_lat, "lng": e.start_lng},
                    "end": {"lat": e.end_lat, "lng": e.end_lng},
                }
                for e in events[:5]
            ],
            "shared_routes": [
                {"id": sh.id, "route_id": sh.route_id, "note": sh.note, "user_id": sh.user_id, "created_at": sh.created_at.isoformat()}
                for sh in shared
            ],
            "sos": [
                {"id": a.id, "lat": a.latitude, "lng": a.longitude, "status": a.status}
                for a in sos[:5]
            ],
        }
    )


@bff_bp.get("/home")
def home_feed():
    feed = feed_service.list_posts()
    routes = route_service.list_routes()
    events = event_service.list_events()
    shared = route_service.repo.list_shared_recent(limit=5)
    recent_saved = []
    try:
        user_id = get_jwt_identity()
        if user_id:
            recent_saved = route_service.list_saved(user_id)
    except Exception:
        recent_saved = []
    return jsonify(
        {
            "hero": {"title": "Pedale seguro", "subtitle": "Alertas ao vivo e rotas confiaveis"},
            "feed": [
                {"id": p.id, "content": p.content, "created_at": p.created_at.isoformat(), "user_id": p.user_id}
                for p in feed[:5]
            ],
            "routes": [
                {"id": r.id, "name": r.name, "distance_km": r.distance_km, "start_lat": r.start_lat, "start_lng": r.start_lng}
                for r in routes[:5]
            ],
            "shared_routes": [
                {"id": s.id, "route_id": s.route_id, "note": s.note, "created_at": s.created_at.isoformat()}
                for s in shared
            ],
            "saved_routes": [
                {"id": r.id, "name": r.name, "distance_km": r.distance_km}
                for r in recent_saved[:5]
                if r
            ],
            "events": [
                {"id": e.id, "name": e.name, "start_date": e.start_date.isoformat(), "status": e.status}
                for e in events[:5]
            ],
            "sos": [
                {"id": s.id, "lat": s.latitude, "lng": s.longitude, "status": s.status}
                for s in sos_service.list_alerts()[:5]
            ],
        }
    )
