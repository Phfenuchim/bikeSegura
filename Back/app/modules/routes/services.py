from typing import List, Optional
from .repositories import RouteRepository
from .models import Route
from ..incidents.models import Incident
from ..feed.services import FeedService
from ..incidents.repositories import IncidentRepository


class RouteService:
    def __init__(self, repo: RouteRepository | None = None):
        self.repo = repo or RouteRepository()
        self.feed = FeedService()
        self.incident_repo = IncidentRepository()

    def list_routes(self) -> List[Route]:
        return self.repo.list_recent()

    def search_routes(self, query: str) -> List[Route]:
        if not query:
            return self.repo.list_recent(limit=15)
        return self.repo.search_by_name(query, limit=15)

    def rank_routes(self, avoid_incidents: bool = False, low_traffic: bool = False, low_elevation: bool = False) -> List[Route]:
        routes = self.repo.list_recent(limit=50)
        incidents = self.incident_repo.list_recent(limit=200) if avoid_incidents else []

        def _score(route: Route) -> float:
            score = 0.0
            if avoid_incidents:
                lat_min = min(route.start_lat, route.end_lat) - 0.02
                lat_max = max(route.start_lat, route.end_lat) + 0.02
                lng_min = min(route.start_lng, route.end_lng) - 0.02
                lng_max = max(route.start_lng, route.end_lng) + 0.02
                nearby = sum(
                    1
                    for inc in incidents
                    if lat_min <= inc.latitude <= lat_max and lng_min <= inc.longitude <= lng_max
                )
                score += nearby * 5  # peso para incidentes
            if low_traffic and route.traffic_score is not None:
                score += route.traffic_score
            if low_elevation and route.elevation_gain is not None:
                score += route.elevation_gain / 50.0  # normaliza
            return score

        return sorted(routes, key=_score)

    def create_route(self, payload: dict, user_id: Optional[int]) -> Route:
        required = ("name", "start_lat", "start_lng", "end_lat", "end_lng")
        if not all(k in payload and payload[k] is not None for k in required):
            raise ValueError("name, start_lat, start_lng, end_lat, end_lng are required")
        route = self.repo.create(
            name=payload["name"],
            description=payload.get("description"),
            start_lat=payload["start_lat"],
            start_lng=payload["start_lng"],
            end_lat=payload["end_lat"],
            end_lng=payload["end_lng"],
            distance_km=payload.get("distance_km"),
            user_id=user_id,
        )
        return route

    def add_incident_to_route(self, route_id: int, payload: dict) -> Incident:
        route = self.repo.get_by_id(route_id)
        if not route:
            raise LookupError("route not found")
        required = ("latitude", "longitude", "title")
        if not all(k in payload and payload[k] is not None for k in required):
            raise ValueError("latitude, longitude and title are required")
        incident = Incident(
            title=payload["title"],
            description=payload.get("description"),
            latitude=payload["latitude"],
            longitude=payload["longitude"],
            severity=payload.get("severity", "info"),
            user_id=payload.get("user_id"),
        )
        from ...extensions import db

        db.session.add(incident)
        db.session.commit()
        return incident

    def save_route(self, route_id: int, user_id: int, save: bool) -> bool:
        route = self.repo.get_by_id(route_id)
        if not route:
            raise LookupError("route not found")
        return self.repo.save_for_user(user_id, route_id, save)

    def list_saved(self, user_id: int):
        saved = self.repo.list_saved(user_id)
        return [self.repo.get_by_id(s.route_id) for s in saved if self.repo.get_by_id(s.route_id)]

    def share_route(self, route_id: int, user_id: int, note: Optional[str]):
        route = self.repo.get_by_id(route_id)
        if not route:
            raise LookupError("route not found")
        share = self.repo.share(route_id, user_id, note)
        # opcional: criar post no feed
        self.feed.create_post({"content": f"Rota compartilhada: {route.name}"}, user_id=user_id)
        return share

    def set_waypoints(self, route_id: int, waypoints: List[dict]):
        route = self.repo.get_by_id(route_id)
        if not route:
            raise LookupError("route not found")
        if not waypoints:
            raise ValueError("waypoints required")
        for wp in waypoints:
            if "latitude" not in wp or "longitude" not in wp:
                raise ValueError("latitude and longitude required for waypoints")
        return self.repo.replace_waypoints(route_id, waypoints)

    def list_waypoints(self, route_id: int):
        route = self.repo.get_by_id(route_id)
        if not route:
            raise LookupError("route not found")
        return self.repo.list_waypoints(route_id)
