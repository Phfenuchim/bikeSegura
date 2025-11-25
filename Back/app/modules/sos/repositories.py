from typing import List
from ...extensions import db
from .models import SOSAlert


class SOSRepository:
    def list_recent(self, limit: int = 50) -> List[SOSAlert]:
        return SOSAlert.query.order_by(SOSAlert.created_at.desc()).limit(limit).all()

    def create(self, **kwargs) -> SOSAlert:
        alert = SOSAlert(**kwargs)
        db.session.add(alert)
        db.session.commit()
        return alert

    def get_by_id(self, alert_id: int) -> SOSAlert | None:
        return SOSAlert.query.get(alert_id)
