from datetime import datetime
from ...extensions import db


class RouteEvent(db.Model):
    __tablename__ = "route_events"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=True)
    start_lat = db.Column(db.Float, nullable=False)
    start_lng = db.Column(db.Float, nullable=False)
    end_lat = db.Column(db.Float, nullable=False)
    end_lng = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default="scheduled")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
