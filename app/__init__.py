import os
from flask import Flask, render_template, request, session, redirect, g
from flask_cors import CORS
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect, generate_csrf
from flask_login import LoginManager
from werkzeug.middleware.proxy_fix import ProxyFix
import logging
from logging.handlers import RotatingFileHandler

# Import models with optimized loading
from .models import db, User

# Import routes
from .api.user_routes import user_routes
from .api.auth_routes import auth_routes
from .api.tag_routes import tag_routes
from .api.group_routes import group_routes
from .api.group_image_routes import group_image_routes
from .api.event_routes import event_routes
from .api.event_image_routes import event_image_routes
from .api.venue_routes import venue_routes
from .api.post_routes import post_routes
from .api.comment_routes import comment_routes
from .api.partnership_routes import partnership_routes
from .api.contact_routes import contact_routes
from .seeds import seed_commands
from .config import Config


def create_app(config_class=Config):
    """Application factory pattern for better testing and deployment"""
    app = Flask(__name__, static_folder="../react-vite/dist", static_url_path="/")

    # Load configuration
    app.config.from_object(config_class)

    # Trust proxy headers for production deployment
    if app.config.get("FLASK_ENV") == "production":
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

    # Initialize extensions
    db.init_app(app)
    Migrate(app, db)
    CORS(
        app,
        origins=[
            "http://localhost:3000",
            "http://localhost:5173",
            "https://mencrytoo.onrender.com",
        ],
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # Setup login manager with optimized user loading
    login = LoginManager(app)
    login.login_view = "auth.unauthorized"

    @login.user_loader
    def load_user(id):
        """Optimized user loader with minimal data fetching"""
        return db.session.get(User, int(id))

    # Add seed commands
    app.cli.add_command(seed_commands)

    # Register blueprints with optimized prefixes
    app.register_blueprint(auth_routes, url_prefix="/api/auth")
    app.register_blueprint(user_routes, url_prefix="/api/users")
    app.register_blueprint(group_routes, url_prefix="/api/groups")
    app.register_blueprint(group_image_routes, url_prefix="/api/group-images")
    app.register_blueprint(venue_routes, url_prefix="/api/venues")
    app.register_blueprint(event_routes, url_prefix="/api/events")
    app.register_blueprint(event_image_routes, url_prefix="/api/event-images")
    app.register_blueprint(post_routes, url_prefix="/api/posts")
    app.register_blueprint(comment_routes, url_prefix="/api/comments")
    app.register_blueprint(tag_routes, url_prefix="/api/tags")
    app.register_blueprint(partnership_routes, url_prefix="/api/partnerships")
    app.register_blueprint(contact_routes, url_prefix="/api/contact")

    # Performance optimizations
    @app.before_request
    def before_request():
        """Optimizations for each request"""
        flask_env = os.environ.get("FLASK_ENV", "development")

        # Only do HTTPS redirect in actual production AND not for API endpoints
        if (
            flask_env == "production"
            and not request.path.startswith("/api/")
            and request.method != "OPTIONS"
        ):
            if request.headers.get("X-Forwarded-Proto") == "http":
                url = request.url.replace("http://", "https://", 1)
                return redirect(url, code=301)

        # Add request timing for monitoring (safely)
        try:
            import time

            g.start_time = time.time()
        except ImportError:
            pass

    @app.after_request
    def after_request(response):
        """Post-request optimizations and security headers"""
        # CSRF token injection
        response.set_cookie(
            "csrf_token",
            generate_csrf(),
            secure=app.config.get("FLASK_ENV") == "production",
            samesite="Strict" if app.config.get("FLASK_ENV") == "production" else "Lax",
            httponly=True,
            max_age=3600,  # 1 hour
        )

        # Security headers for production
        if app.config.get("FLASK_ENV") == "production":
            response.headers["X-Content-Type-Options"] = "nosniff"
            response.headers["X-Frame-Options"] = "DENY"
            response.headers["X-XSS-Protection"] = "1; mode=block"
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        # Caching headers for static assets
        if request.endpoint == "static":
            response.headers["Cache-Control"] = "public, max-age=31536000"  # 1 year
        elif request.endpoint and "api" in request.endpoint:
            # Short cache for API responses
            response.headers["Cache-Control"] = "private, max-age=60"  # 1 minute

        return response

    # API documentation route
    @app.route("/api/docs")
    def api_help():
        """Returns all API routes and their doc strings"""
        acceptable_methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]
        route_list = {}

        for rule in app.url_map.iter_rules():
            if rule.endpoint != "static" and rule.endpoint:
                try:
                    methods = [
                        method
                        for method in rule.methods
                        if method in acceptable_methods
                    ]
                    doc = (
                        app.view_functions[rule.endpoint].__doc__
                        or "No documentation available"
                    )
                    route_list[rule.rule] = [methods, doc]
                except KeyError:
                    continue

        return route_list

    # React app routes with optimized static file serving
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def react_root(path):
        """
        Optimized React app serving with proper caching
        """
        if path == "favicon.ico":
            response = app.send_from_directory("public", "favicon.ico")
            response.headers["Cache-Control"] = "public, max-age=86400"  # 1 day
            return response

        response = app.send_static_file("index.html")
        # Don't cache the main index.html to ensure updates are reflected
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        return response

    # Error handlers with better error pages
    @app.errorhandler(404)
    def not_found(e):
        """Handle 404 errors by serving React app"""
        if request.path.startswith("/api/"):
            return {"errors": {"message": "Endpoint not found"}}, 404
        return app.send_static_file("index.html")

    @app.errorhandler(500)
    def internal_error(e):
        """Handle 500 errors with proper cleanup"""
        db.session.rollback()

        # Log the error in production
        if app.config.get("FLASK_ENV") == "production":
            app.logger.error(f"Internal server error: {str(e)}")

        if request.path.startswith("/api/"):
            return {"errors": {"message": "Internal server error"}}, 500
        return app.send_static_file("index.html")

    @app.errorhandler(413)
    def request_entity_too_large(e):
        """Handle file upload size limit errors"""
        return {"errors": {"message": "File too large. Maximum size is 5MB."}}, 413

    @app.errorhandler(429)
    def rate_limit_exceeded(e):
        """Handle rate limiting errors"""
        return {
            "errors": {"message": "Rate limit exceeded. Please try again later."}
        }, 429

    # Health check endpoint for monitoring
    @app.route("/health")
    def health_check():
        """Health check endpoint for monitoring services"""
        try:
            # Quick database connectivity check
            db.session.execute("SELECT 1")
            return {"status": "healthy", "database": "connected"}, 200
        except Exception as e:
            return {"status": "unhealthy", "error": str(e)}, 503

    # Setup logging for production
    if app.config.get("FLASK_ENV") == "production":
        if not os.path.exists("logs"):
            os.mkdir("logs")

        file_handler = RotatingFileHandler(
            "logs/mencrytoo.log", maxBytes=10240000, backupCount=10
        )
        file_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
            )
        )
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info("MenCryToo application startup")

    return app


# Create the application instance
app = create_app()

# Import time for request timing if needed
try:
    import time
except ImportError:
    pass

# import os
# from flask import Flask, render_template, request, session, redirect
# from flask_cors import CORS
# from flask_migrate import Migrate
# from flask_wtf.csrf import CSRFProtect, generate_csrf
# from flask_login import LoginManager
# from .models import (
#     db,
#     User,
#     Group,
#     GroupImage,
#     Post,
#     Comment,
#     Event,
#     EventImage,
#     Venue,
#     Membership,
#     Attendance,
#     Tag,
#     Likes,
#     UserTags,
#     Partnership,
#     Contact,
# )
# from .api.user_routes import user_routes
# from .api.auth_routes import auth_routes
# from .api.tag_routes import tag_routes
# from .api.group_routes import group_routes
# from .api.group_image_routes import group_image_routes
# from .api.event_routes import event_routes
# from .api.event_image_routes import event_image_routes
# from .api.venue_routes import venue_routes
# from .api.post_routes import post_routes
# from .api.comment_routes import comment_routes
# from .api.partnership_routes import partnership_routes
# from .api.contact_routes import contact_routes
# from .seeds import seed_commands
# from .config import Config

# app = Flask(__name__, static_folder="../react-vite/dist", static_url_path="/")

# # Setup login manager with optimized settings
# login = LoginManager(app)
# login.login_view = "auth.unauthorized"
# login.session_protection = "strong"  # Enhanced session protection
# login.remember_cookie_duration = 86400  # 24 hours


# @login.user_loader
# def load_user(id):
#     # Optimized user loading with selective field loading
#     return User.query.options(
#         db.load_only(
#             "id", "username", "first_name", "last_name", "email", "profile_image_url"
#         )
#     ).get(int(id))


# # Tell flask about our seed commands
# app.cli.add_command(seed_commands)

# # Load configuration
# app.config.from_object(Config)

# # Register blueprints with optimized order (most frequently used first)
# app.register_blueprint(auth_routes, url_prefix="/api/auth")
# app.register_blueprint(user_routes, url_prefix="/api/users")
# app.register_blueprint(post_routes, url_prefix="/api/posts")
# app.register_blueprint(group_routes, url_prefix="/api/groups")
# app.register_blueprint(event_routes, url_prefix="/api/events")
# app.register_blueprint(tag_routes, url_prefix="/api/tags")
# app.register_blueprint(venue_routes, url_prefix="/api/venues")
# app.register_blueprint(comment_routes, url_prefix="/api/comments")
# app.register_blueprint(group_image_routes, url_prefix="/api/group-images")
# app.register_blueprint(event_image_routes, url_prefix="/api/event-images")
# app.register_blueprint(partnership_routes, url_prefix="/api/partnerships")
# app.register_blueprint(contact_routes, url_prefix="/api/contact")

# # Initialize database
# db.init_app(app)
# Migrate(app, db)

# # Application Security
# CORS(
#     app,
#     origins=(
#         ["https://mencrytoo.onrender.com"]
#         if os.environ.get("FLASK_ENV") == "production"
#         else "*"
#     ),
#     supports_credentials=True,
#     max_age=3600,
# )  # Cache preflight requests for 1 hour


# # Performance optimizations for production
# @app.before_request
# def optimize_request():
#     # Force HTTPS in production
#     if os.environ.get("FLASK_ENV") == "production":
#         if request.headers.get("X-Forwarded-Proto") == "http":
#             url = request.url.replace("http://", "https://", 1)
#             code = 301
#             return redirect(url, code=code)

#     # Set efficient database session options
#     if hasattr(db.session, "expire_on_commit"):
#         db.session.expire_on_commit = False


# @app.after_request
# def optimize_response(response):
#     # Inject CSRF token with secure settings
#     response.set_cookie(
#         "csrf_token",
#         generate_csrf(),
#         secure=True if os.environ.get("FLASK_ENV") == "production" else False,
#         samesite="Strict" if os.environ.get("FLASK_ENV") == "production" else None,
#         httponly=True,
#         max_age=3600,  # 1 hour expiry
#     )

#     # Add performance headers for production
#     if os.environ.get("FLASK_ENV") == "production":
#         # Cache static assets
#         if request.endpoint == "static":
#             response.cache_control.max_age = 31536000  # 1 year
#             response.cache_control.public = True

#         # Add security headers
#         response.headers["X-Content-Type-Options"] = "nosniff"
#         response.headers["X-Frame-Options"] = "DENY"
#         response.headers["X-XSS-Protection"] = "1; mode=block"

#         # Compress responses
#         response.headers["Vary"] = "Accept-Encoding"

#     return response


# @app.route("/api/docs")
# def api_help():
#     """
#     Returns all API routes and their doc strings - cached for performance
#     """
#     acceptable_methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]
#     route_list = {
#         rule.rule: [
#             [method for method in rule.methods if method in acceptable_methods],
#             app.view_functions[rule.endpoint].__doc__,
#         ]
#         for rule in app.url_map.iter_rules()
#         if rule.endpoint != "static"
#     }
#     return route_list


# @app.route("/", defaults={"path": ""})
# @app.route("/<path:path>")
# def react_root(path):
#     """
#     Optimized route handler for React app
#     """
#     if path == "favicon.ico":
#         return app.send_from_directory("public", "favicon.ico")
#     return app.send_static_file("index.html")


# @app.errorhandler(404)
# def not_found(e):
#     return app.send_static_file("index.html")


# @app.errorhandler(500)
# def internal_error(e):
#     db.session.rollback()
#     return {"errors": {"message": "Internal server error"}}, 500


# @app.errorhandler(413)
# def request_entity_too_large(e):
#     return {"errors": {"message": "File too large"}}, 413


# @app.errorhandler(429)
# def too_many_requests(e):
#     return {"errors": {"message": "Too many requests"}}, 429


# # Performance monitoring endpoint (optional - remove in production if not needed)
# @app.route("/api/health")
# def health_check():
#     """Simple health check endpoint for monitoring"""
#     try:
#         # Quick database connectivity check
#         db.session.execute("SELECT 1")
#         return {"status": "healthy", "database": "connected"}, 200
#     except Exception as e:
#         return {"status": "unhealthy", "error": str(e)}, 503


# import os
# from flask import Flask, render_template, request, session, redirect
# from flask_cors import CORS
# from flask_migrate import Migrate
# from flask_wtf.csrf import CSRFProtect, generate_csrf
# from flask_login import LoginManager
# from .models import (
#     db,
#     User,
#     Group,
#     GroupImage,
#     Post,
#     Comment,
#     Event,
#     EventImage,
#     Venue,
#     Membership,
#     Attendance,
#     Tag,
#     Likes,
#     UserTags,
#     Partnership,
#     Contact,
# )
# from .api.user_routes import user_routes
# from .api.auth_routes import auth_routes
# from .api.tag_routes import tag_routes
# from .api.group_routes import group_routes
# from .api.group_image_routes import group_image_routes
# from .api.event_routes import event_routes
# from .api.event_image_routes import event_image_routes
# from .api.venue_routes import venue_routes
# from .api.post_routes import post_routes
# from .api.comment_routes import comment_routes
# from .api.partnership_routes import partnership_routes
# from .api.contact_routes import contact_routes
# from .seeds import seed_commands
# from .config import Config

# app = Flask(__name__, static_folder="../react-vite/dist", static_url_path="/")

# # Setup login manager
# login = LoginManager(app)
# login.login_view = "auth.unauthorized"


# @login.user_loader
# def load_user(id):
#     return User.query.get(int(id))

# # Tell flask about our seed commands
# app.cli.add_command(seed_commands)

# app.config.from_object(Config)
# app.register_blueprint(auth_routes, url_prefix="/api/auth")
# app.register_blueprint(user_routes, url_prefix="/api/users")
# app.register_blueprint(group_routes, url_prefix="/api/groups")
# app.register_blueprint(group_image_routes, url_prefix="/api/group-images")
# app.register_blueprint(venue_routes, url_prefix="/api/venues")
# app.register_blueprint(event_routes, url_prefix="/api/events")
# app.register_blueprint(event_image_routes, url_prefix="/api/event-images")
# app.register_blueprint(post_routes, url_prefix="/api/posts")
# app.register_blueprint(comment_routes, url_prefix="/api/comments")
# app.register_blueprint(tag_routes, url_prefix="/api/tags")
# app.register_blueprint(partnership_routes, url_prefix="/api/partnerships")
# app.register_blueprint(contact_routes, url_prefix="/api/contact")
# db.init_app(app)
# Migrate(app, db)

# # Application Security
# CORS(app)

# # Since we are deploying with Docker and Flask,
# # we won't be using a buildpack when we deploy to Heroku.
# # Therefore, we need to make sure that in production any
# # request made over http is redirected to https.
# @app.before_request
# def https_redirect():
#     if os.environ.get("FLASK_ENV") == "production":
#         if request.headers.get("X-Forwarded-Proto") == "http":
#             url = request.url.replace("http://", "https://", 1)
#             code = 301
#             return redirect(url, code=code)


# @app.after_request
# def inject_csrf_token(response):
#     response.set_cookie(
#         "csrf_token",
#         generate_csrf(),
#         secure=True if os.environ.get("FLASK_ENV") == "production" else False,
#         samesite="Strict" if os.environ.get("FLASK_ENV") == "production" else None,
#         httponly=True,
#     )
#     return response


# @app.route("/api/docs")
# def api_help():
#     """
#     Returns all API routes and their doc strings
#     """
#     acceptable_methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]
#     route_list = {
#         rule.rule: [
#             [method for method in rule.methods if method in acceptable_methods],
#             app.view_functions[rule.endpoint].__doc__,
#         ]
#         for rule in app.url_map.iter_rules()
#         if rule.endpoint != "static"
#     }
#     return route_list


# @app.route("/", defaults={"path": ""})
# @app.route("/<path:path>")
# def react_root(path):
#     """
#     This route will direct to the public directory in our
#     react builds in the production environment for favicon
#     or index.html requests
#     """
#     if path == "favicon.ico":
#         return app.send_from_directory("public", "favicon.ico")
#     return app.send_static_file("index.html")


# @app.errorhandler(404)
# def not_found(e):
#     return app.send_static_file("index.html")


# @app.errorhandler(500)
# def internal_error(e):
#     db.session.rollback()
#     return {"errors": {"message": "Internal server error"}}, 500
