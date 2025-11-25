from typing import List
from ...extensions import db
from .models import FeedPost


class FeedRepository:
    def list_recent(self, limit: int = 20) -> List[FeedPost]:
        return FeedPost.query.order_by(FeedPost.created_at.desc()).limit(limit).all()

    def create(self, **kwargs) -> FeedPost:
        post = FeedPost(**kwargs)
        db.session.add(post)
        db.session.commit()
        return post
