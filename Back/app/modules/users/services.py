from typing import Optional, Tuple
from flask_jwt_extended import create_access_token, create_refresh_token
from .repositories import UserRepository
from .models import User


class UserService:
    def __init__(self, repo: UserRepository | None = None):
        self.repo = repo or UserRepository()

    def register(self, email: str, full_name: str, password: str) -> Tuple[str, str, User]:
        if self.repo.get_by_email(email):
            raise ValueError("email already registered")
        user = self.repo.create(email=email, full_name=full_name, password=password)
        return self._issue_tokens(user)

    def login(self, email: str, password: str) -> Tuple[str, str, User]:
        user = self.repo.get_by_email(email)
        if not user or not user.check_password(password):
            raise PermissionError("invalid credentials")
        return self._issue_tokens(user)

    def get_me(self, user_id: int) -> Optional[User]:
        return self.repo.get_by_id(user_id)

    def update_profile(self, user_id: int, payload: dict) -> User:
        user = self.repo.get_by_id(user_id)
        if not user:
            raise LookupError("user not found")
        if "full_name" in payload:
            user.full_name = payload["full_name"]
        if "bio" in payload:
            user.bio = payload["bio"]
        if "avatar_url" in payload:
            user.avatar_url = payload["avatar_url"]
        from ...extensions import db

        db.session.commit()
        return user

    def _issue_tokens(self, user: User) -> Tuple[str, str, User]:
        access = create_access_token(identity=user.id)
        refresh = create_refresh_token(identity=user.id)
        return access, refresh, user
