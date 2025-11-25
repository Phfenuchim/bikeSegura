from typing import List
from ...extensions import db
from .models import Route


class RouteRepository:
    def list_recent(self, limit: int = 50) -> List[Route]:
        return Route.query.order_by(Route.created_at.desc()).limit(limit).all()

    def create(self, **kwargs) -> Route:
        route = Route(**kwargs)
        db.session.add(route)
        db.session.commit()
        return route

    def get_by_id(self, route_id: int) -> Route | None:
        return Route.query.get(route_id)
