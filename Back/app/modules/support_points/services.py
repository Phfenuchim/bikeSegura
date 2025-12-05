from .repositories import SupportPointRepository

class SupportPointService:
    def __init__(self):
        self.repo = SupportPointRepository()

    def create_point(self, payload):
        if not payload.get("latitude") or not payload.get("longitude"):
            raise ValueError("latitude and longitude are required")
        if not payload.get("type"):
            raise ValueError("type is required")
        
        return self.repo.create(
            name=payload.get("name"),
            type=payload.get("type"),
            description=payload.get("description"),
            latitude=payload.get("latitude"),
            longitude=payload.get("longitude")
        )

    def list_points(self):
        return self.repo.list_all()
