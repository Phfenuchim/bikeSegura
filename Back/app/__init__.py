import os
from flask import Flask, jsonify
from dotenv import load_dotenv

from .config import get_config
from .extensions import db, migrate, jwt, cors
from .modules import register_blueprints, load_models


def create_app():
    load_dotenv()
    app = Flask(__name__)

    app.config.from_object(get_config())

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/*": {"origins": app.config["CORS_ORIGINS"]}})

    # ensure models are imported for migrations
    load_models()

    register_blueprints(app)

    @app.route("/health")
    def health():
        return jsonify({"status": "ok"})

    return app


def main():
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8000)))


if __name__ == "__main__":
    main()
