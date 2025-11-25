from typing import Optional
from .models import User
from ...extensions import db


class UserRepository:
    def get_by_email(self, email: str) -> Optional[User]:
        return User.query.filter_by(email=email).first()

    def get_by_id(self, user_id: int) -> Optional[User]:
        return User.query.get(user_id)

    def create(self, email: str, full_name: str, password: str) -> User:
        user = User(email=email, full_name=full_name)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return user
