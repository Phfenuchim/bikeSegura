from typing import List
from ...extensions import db
from .models import Incident


class IncidentRepository:
    def list_recent(self, limit: int = 100) -> List[Incident]:
        return Incident.query.order_by(Incident.created_at.desc()).limit(limit).all()

    def create(self, **kwargs) -> Incident:
        incident = Incident(**kwargs)
        db.session.add(incident)
        db.session.commit()
        return incident

    def count_by_severity(self, incidents: list[Incident]) -> dict:
        counts = {"danger": 0, "warning": 0, "info": 0, "total": len(incidents)}
        for inc in incidents:
            if inc.severity in counts:
                counts[inc.severity] += 1
        return counts
