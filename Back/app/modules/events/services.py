from typing import List, Optional
from datetime import datetime
from .repositories import EventRepository
from .models import RouteEvent


class EventService:
    def __init__(self, repo: EventRepository | None = None):
        self.repo = repo or EventRepository()

    def list_events(self) -> List[RouteEvent]:
        return self.repo.list_recent()

    def create_event(self, payload: dict, user_id: Optional[int]) -> RouteEvent:
        required = ("name", "start_date", "start_lat", "start_lng", "end_lat", "end_lng")
        if not all(k in payload and payload[k] is not None for k in required):
            raise ValueError("name, start_date, start_lat, start_lng, end_lat, end_lng are required")

        start_date = self._parse_date(payload["start_date"])
        end_date = self._parse_date(payload.get("end_date")) if payload.get("end_date") else None

        return self.repo.create(
            name=payload["name"],
            description=payload.get("description"),
            start_date=start_date,
            end_date=end_date,
            start_lat=payload["start_lat"],
            start_lng=payload["start_lng"],
            end_lat=payload["end_lat"],
            end_lng=payload["end_lng"],
            status=payload.get("status", "scheduled"),
            user_id=user_id,
        )

    def update_status(self, event_id: int, status: str) -> RouteEvent:
        event = self.repo.get_by_id(event_id)
        if not event:
            raise LookupError("event not found")
        event.status = status
        from ...extensions import db

        db.session.commit()
        return event

    def _parse_date(self, value: str | None) -> datetime:
        if not value:
            return datetime.utcnow()
        try:
            return datetime.fromisoformat(value)
        except ValueError:
            raise ValueError("invalid date format, use ISO 8601")
