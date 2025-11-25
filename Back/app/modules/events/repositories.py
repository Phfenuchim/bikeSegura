from typing import List
from ...extensions import db
from .models import RouteEvent


class EventRepository:
    def list_recent(self, limit: int = 20) -> List[RouteEvent]:
        return RouteEvent.query.order_by(RouteEvent.start_date.desc()).limit(limit).all()

    def create(self, **kwargs) -> RouteEvent:
        event = RouteEvent(**kwargs)
        db.session.add(event)
        db.session.commit()
        return event

    def get_by_id(self, event_id: int) -> RouteEvent | None:
        return RouteEvent.query.get(event_id)
