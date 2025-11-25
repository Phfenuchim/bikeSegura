import os


def _build_db_uri() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        return url

    host = os.getenv("DB_HOST", "db")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "bikesegura")
    user = os.getenv("DB_USER", "bike")
    password = os.getenv("DB_PASSWORD", "bike")
    return f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{name}"


class BaseConfig:
    SQLALCHEMY_DATABASE_URI = _build_db_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me")
    JWT_SECRET_KEY = SECRET_KEY
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    ACCESS_TOKEN_EXPIRES = int(os.getenv("ACCESS_TOKEN_EXPIRES", 3600))
    REFRESH_TOKEN_EXPIRES = int(os.getenv("REFRESH_TOKEN_EXPIRES", 86400))


class DevConfig(BaseConfig):
    DEBUG = True


class ProdConfig(BaseConfig):
    DEBUG = False


def get_config():
    env = os.getenv("FLASK_ENV", "development")
    return DevConfig if env == "development" else ProdConfig
