from typing import List, Optional
from .repositories import RouteRepository
from .models import Route
from ..incidents.models import Incident


class RouteService:
    def __init__(self, repo: RouteRepository | None = None):
        self.repo = repo or RouteRepository()

    def list_routes(self) -> List[Route]:
        return self.repo.list_recent()

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
