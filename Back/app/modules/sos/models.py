from datetime import datetime
from ...extensions import db


class SOSAlert(db.Model):
    __tablename__ = "sos_alerts"

    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default="open")  # open, ack, resolved
    type = db.Column(db.String(50), nullable=True) # pneu, saude, acidente
    message = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
