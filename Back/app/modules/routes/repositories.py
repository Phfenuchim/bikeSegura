from typing import List, Optional
from ...extensions import db
from .models import Route, SavedRoute, RouteShare, RouteWaypoint


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

    def search_by_name(self, query: str, limit: int = 15) -> List[Route]:
        return (
            Route.query.filter(Route.name.ilike(f"%{query}%"))
            .order_by(Route.created_at.desc())
            .limit(limit)
            .all()
        )

    def save_for_user(self, user_id: int, route_id: int, save: bool) -> bool:
        existing = SavedRoute.query.filter_by(user_id=user_id, route_id=route_id).first()
        if save and not existing:
            db.session.add(SavedRoute(user_id=user_id, route_id=route_id))
        if not save and existing:
            db.session.delete(existing)
        db.session.commit()
        return save

    def list_saved(self, user_id: int) -> List[SavedRoute]:
        return SavedRoute.query.filter_by(user_id=user_id).order_by(SavedRoute.created_at.desc()).all()

    def list_shared_recent(self, limit: int = 20) -> List[RouteShare]:
        return RouteShare.query.order_by(RouteShare.created_at.desc()).limit(limit).all()

    def share(self, route_id: int, user_id: int, note: Optional[str]) -> RouteShare:
        share = RouteShare(route_id=route_id, user_id=user_id, note=note)
        db.session.add(share)
        db.session.commit()
        return share

    def replace_waypoints(self, route_id: int, waypoints: List[dict]) -> List[RouteWaypoint]:
        RouteWaypoint.query.filter_by(route_id=route_id).delete()
        objs: List[RouteWaypoint] = []
        for idx, wp in enumerate(waypoints):
            obj = RouteWaypoint(
                route_id=route_id,
                name=wp.get("name"),
                latitude=wp["latitude"],
                longitude=wp["longitude"],
                seq=idx,
            )
            db.session.add(obj)
            objs.append(obj)
        db.session.commit()
        return objs

    def list_waypoints(self, route_id: int) -> List[RouteWaypoint]:
        return RouteWaypoint.query.filter_by(route_id=route_id).order_by(RouteWaypoint.seq.asc()).all()
