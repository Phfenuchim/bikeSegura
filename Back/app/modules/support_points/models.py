from datetime import datetime
from ...extensions import db

class SupportPoint(db.Model):
    __tablename__ = "support_points"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=True)
    type = db.Column(db.String(50), nullable=False) # oficina, agua, loja, bicicletario
    description = db.Column(db.Text, nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
