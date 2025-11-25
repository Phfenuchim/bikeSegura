from typing import List, Optional
from .repositories import FeedRepository
from .models import FeedPost


class FeedService:
    def __init__(self, repo: FeedRepository | None = None):
        self.repo = repo or FeedRepository()

    def list_posts(self) -> List[FeedPost]:
        return self.repo.list_recent()

    def create_post(self, payload: dict, user_id: Optional[int]) -> FeedPost:
        content = payload.get("content")
        if not content:
            raise ValueError("content is required")
        return self.repo.create(content=content, user_id=user_id)
