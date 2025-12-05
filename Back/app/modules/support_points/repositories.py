from .models import SupportPoint
from ...extensions import db

class SupportPointRepository:
    def create(self, **kwargs):
        sp = SupportPoint(**kwargs)
        db.session.add(sp)
        db.session.commit()
        return sp

    def list_all(self):
        return SupportPoint.query.all()
