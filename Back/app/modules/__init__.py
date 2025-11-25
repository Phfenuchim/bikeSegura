from .users.controllers import users_bp
from .incidents.controllers import incidents_bp
from .routes.controllers import routes_bp
from .sos.controllers import sos_bp
from .feed.controllers import feed_bp
from .events.controllers import events_bp
from ..bff.controllers import bff_bp


def register_blueprints(app):
    app.register_blueprint(users_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(incidents_bp, url_prefix="/api/v1")
    app.register_blueprint(routes_bp, url_prefix="/api/v1")
    app.register_blueprint(sos_bp, url_prefix="/api/v1")
    app.register_blueprint(feed_bp, url_prefix="/api/v1")
    app.register_blueprint(events_bp, url_prefix="/api/v1")
    app.register_blueprint(bff_bp, url_prefix="/bff/v1")


def load_models():
    # Import models so Flask-Migrate/SQLAlchemy can detect them
    from .users import models as _users_models  # noqa: F401
    from .incidents import models as _incidents_models  # noqa: F401
    from .routes import models as _routes_models  # noqa: F401
    from .sos import models as _sos_models  # noqa: F401
    from .feed import models as _feed_models  # noqa: F401
    from .events import models as _events_models  # noqa: F401

    return [_users_models, _incidents_models, _routes_models, _sos_models, _feed_models, _events_models]
