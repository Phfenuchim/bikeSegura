from typing import List, Optional
from .repositories import SOSRepository
from .models import SOSAlert


class SOSService:
    def __init__(self, repo: SOSRepository | None = None):
        self.repo = repo or SOSRepository()

    def list_alerts(self) -> List[SOSAlert]:
        return self.repo.list_recent()

    def create_alert(self, payload: dict, user_id: Optional[int]) -> SOSAlert:
        required = ("latitude", "longitude")
        if not all(k in payload and payload[k] is not None for k in required):
            raise ValueError("latitude and longitude are required")
        alert = self.repo.create(
            latitude=payload["latitude"],
            longitude=payload["longitude"],
            status=payload.get("status", "open"),
            message=payload.get("message"),
            type=payload.get("type"),
            user_id=user_id,
        )
        return alert

    def update_status(self, alert_id: int, status: str) -> SOSAlert:
        alert = self.repo.get_by_id(alert_id)
        if not alert:
            raise LookupError("sos not found")
        alert.status = status
        from ...extensions import db

        db.session.commit()
        return alert
