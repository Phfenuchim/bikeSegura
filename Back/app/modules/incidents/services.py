from typing import List, Dict, Optional
from .repositories import IncidentRepository
from .models import Incident


class IncidentService:
    def __init__(self, repo: IncidentRepository | None = None):
        self.repo = repo or IncidentRepository()

    def list_incidents(self) -> List[Incident]:
        return self.repo.list_recent()

    def create_incident(self, payload: dict, user_id: Optional[int] = None) -> Incident:
        required = ("title", "latitude", "longitude")
        if not all(k in payload and payload[k] is not None for k in required):
            raise ValueError("title, latitude and longitude are required")

        incident = self.repo.create(
            title=payload["title"],
            description=payload.get("description"),
            latitude=payload["latitude"],
            longitude=payload["longitude"],
            severity=payload.get("severity", "info"),
            user_id=user_id,
        )
        return incident

    def summarize(self) -> Dict:
        incidents = self.repo.list_recent(limit=20)
        counts = self.repo.count_by_severity(incidents)
        highlights = [
            {
                "title": inc.title,
                "severity": inc.severity,
                "lat": inc.latitude,
                "lng": inc.longitude,
            }
            for inc in incidents
        ]
        return {"highlights": highlights, "counts": counts}
