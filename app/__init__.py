import os
import threading
import time
import requests
from flask import Flask, render_template, request, session, redirect, g
from flask_cors import CORS
from flask_migrate import Migrate
from flask_wtf.csrf import CSRFProtect, generate_csrf
from flask_login import LoginManager
from werkzeug.middleware.proxy_fix import ProxyFix
import logging
from logging.handlers import RotatingFileHandler

# Import models with loading
from .models import (
    db,
    User,
    Group,
    GroupImage,
    Post,
    Comment,
    Event,
    EventImage,
    Venue,
    Membership,
    Attendance,
    Tag,
    Likes,
    UserTags,
    Partnership,
    Contact,
)

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
from .api.comment_routes import comment_routes  # Make sure this is imported
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

    # Setup login manager with user loading
    login = LoginManager(app)
    login.login_view = "auth.unauthorized"

    @login.user_loader
    def load_user(id):
        """User loader with minimal data fetching"""
        return db.session.get(User, int(id))

    # Add seed commands
    app.cli.add_command(seed_commands)

    # Register blueprints with prefixes - COMMENT ROUTES
    app.register_blueprint(auth_routes, url_prefix="/api/auth")
    app.register_blueprint(user_routes, url_prefix="/api/users")
    app.register_blueprint(group_routes, url_prefix="/api/groups")
    app.register_blueprint(group_image_routes, url_prefix="/api/group-images")
    app.register_blueprint(venue_routes, url_prefix="/api/venues")
    app.register_blueprint(event_routes, url_prefix="/api/events")
    app.register_blueprint(event_image_routes, url_prefix="/api/event-images")
    app.register_blueprint(post_routes, url_prefix="/api/posts")
    # Register comment routes with the correct prefix
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

    # React app routes with static file serving
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def react_root(path):
        """
        React app serving with proper caching
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


def keep_render_alive():
    """Keep Render service alive by pinging every 14 minutes"""
    if os.environ.get("FLASK_ENV") == "production":
        render_url = os.environ.get("RENDER_EXTERNAL_URL")
        if render_url:
            while True:
                try:
                    time.sleep(14 * 60)  # 14 minutes
                    requests.get(f"{render_url}/health", timeout=30)
                    print("Keep-alive ping sent")
                except Exception as e:
                    print(f"Keep-alive ping failed: {e}")


# Start keep-alive thread in production
if os.environ.get("FLASK_ENV") == "production":
    ping_thread = threading.Thread(target=keep_render_alive, daemon=True)
    ping_thread.start()


# import os
# from flask import Flask, render_template, request, session, redirect, g
# from flask_cors import CORS
# from flask_migrate import Migrate
# from flask_wtf.csrf import CSRFProtect, generate_csrf
# from flask_login import LoginManager
# from werkzeug.middleware.proxy_fix import ProxyFix
# import logging
# from logging.handlers import RotatingFileHandler

# # Import models with loading
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

# # Import routes
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


# def create_app(config_class=Config):
#     """Application factory pattern for better testing and deployment"""
#     app = Flask(__name__, static_folder="../react-vite/dist", static_url_path="/")

#     # Load configuration
#     app.config.from_object(config_class)

#     # Trust proxy headers for production deployment
#     if app.config.get("FLASK_ENV") == "production":
#         app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

#     # Initialize extensions
#     db.init_app(app)
#     Migrate(app, db)
#     CORS(
#         app,
#         origins=[
#             "http://localhost:3000",
#             "http://localhost:5173",
#             "https://mencrytoo.onrender.com",
#         ],
#         supports_credentials=True,
#         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
#         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
#     )

#     # Setup login manager with user loading
#     login = LoginManager(app)
#     login.login_view = "auth.unauthorized"

#     @login.user_loader
#     def load_user(id):
#         """User loader with minimal data fetching"""
#         return db.session.get(User, int(id))

#     # Add seed commands
#     app.cli.add_command(seed_commands)

#     # Register blueprints with prefixes
#     app.register_blueprint(auth_routes, url_prefix="/api/auth")
#     app.register_blueprint(user_routes, url_prefix="/api/users")
#     app.register_blueprint(group_routes, url_prefix="/api/groups")
#     app.register_blueprint(group_image_routes, url_prefix="/api/group-images")
#     app.register_blueprint(venue_routes, url_prefix="/api/venues")
#     app.register_blueprint(event_routes, url_prefix="/api/events")
#     app.register_blueprint(event_image_routes, url_prefix="/api/event-images")
#     app.register_blueprint(post_routes, url_prefix="/api/posts")
#     app.register_blueprint(comment_routes, url_prefix="/api/comments")
#     app.register_blueprint(tag_routes, url_prefix="/api/tags")
#     app.register_blueprint(partnership_routes, url_prefix="/api/partnerships")
#     app.register_blueprint(contact_routes, url_prefix="/api/contact")

#     # Performance optimizations
#     @app.before_request
#     def before_request():
#         """Optimizations for each request"""
#         flask_env = os.environ.get("FLASK_ENV", "development")

#         # Only do HTTPS redirect in actual production AND not for API endpoints
#         if (
#             flask_env == "production"
#             and not request.path.startswith("/api/")
#             and request.method != "OPTIONS"
#         ):
#             if request.headers.get("X-Forwarded-Proto") == "http":
#                 url = request.url.replace("http://", "https://", 1)
#                 return redirect(url, code=301)

#         # Add request timing for monitoring (safely)
#         try:
#             import time

#             g.start_time = time.time()
#         except ImportError:
#             pass

#     @app.after_request
#     def after_request(response):
#         """Post-request optimizations and security headers"""
#         # CSRF token injection
#         response.set_cookie(
#             "csrf_token",
#             generate_csrf(),
#             secure=app.config.get("FLASK_ENV") == "production",
#             samesite="Strict" if app.config.get("FLASK_ENV") == "production" else "Lax",
#             httponly=True,
#             max_age=3600,  # 1 hour
#         )

#         # Security headers for production
#         if app.config.get("FLASK_ENV") == "production":
#             response.headers["X-Content-Type-Options"] = "nosniff"
#             response.headers["X-Frame-Options"] = "DENY"
#             response.headers["X-XSS-Protection"] = "1; mode=block"
#             response.headers["Strict-Transport-Security"] = (
#                 "max-age=31536000; includeSubDomains"
#             )

#         # Caching headers for static assets
#         if request.endpoint == "static":
#             response.headers["Cache-Control"] = "public, max-age=31536000"  # 1 year
#         elif request.endpoint and "api" in request.endpoint:
#             # Short cache for API responses
#             response.headers["Cache-Control"] = "private, max-age=60"  # 1 minute

#         return response

#     # API documentation route
#     @app.route("/api/docs")
#     def api_help():
#         """Returns all API routes and their doc strings"""
#         acceptable_methods = ["GET", "POST", "PUT", "PATCH", "DELETE"]
#         route_list = {}

#         for rule in app.url_map.iter_rules():
#             if rule.endpoint != "static" and rule.endpoint:
#                 try:
#                     methods = [
#                         method
#                         for method in rule.methods
#                         if method in acceptable_methods
#                     ]
#                     doc = (
#                         app.view_functions[rule.endpoint].__doc__
#                         or "No documentation available"
#                     )
#                     route_list[rule.rule] = [methods, doc]
#                 except KeyError:
#                     continue

#         return route_list

#     # React app routes with static file serving
#     @app.route("/", defaults={"path": ""})
#     @app.route("/<path:path>")
#     def react_root(path):
#         """
#         React app serving with proper caching
#         """
#         if path == "favicon.ico":
#             response = app.send_from_directory("public", "favicon.ico")
#             response.headers["Cache-Control"] = "public, max-age=86400"  # 1 day
#             return response

#         response = app.send_static_file("index.html")
#         # Don't cache the main index.html to ensure updates are reflected
#         response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
#         return response

#     # Error handlers with better error pages
#     @app.errorhandler(404)
#     def not_found(e):
#         """Handle 404 errors by serving React app"""
#         if request.path.startswith("/api/"):
#             return {"errors": {"message": "Endpoint not found"}}, 404
#         return app.send_static_file("index.html")

#     @app.errorhandler(500)
#     def internal_error(e):
#         """Handle 500 errors with proper cleanup"""
#         db.session.rollback()

#         # Log the error in production
#         if app.config.get("FLASK_ENV") == "production":
#             app.logger.error(f"Internal server error: {str(e)}")

#         if request.path.startswith("/api/"):
#             return {"errors": {"message": "Internal server error"}}, 500
#         return app.send_static_file("index.html")

#     @app.errorhandler(413)
#     def request_entity_too_large(e):
#         """Handle file upload size limit errors"""
#         return {"errors": {"message": "File too large. Maximum size is 5MB."}}, 413

#     @app.errorhandler(429)
#     def rate_limit_exceeded(e):
#         """Handle rate limiting errors"""
#         return {
#             "errors": {"message": "Rate limit exceeded. Please try again later."}
#         }, 429

#     # Health check endpoint for monitoring
#     @app.route("/health")
#     def health_check():
#         """Health check endpoint for monitoring services"""
#         try:
#             # Quick database connectivity check
#             db.session.execute("SELECT 1")
#             return {"status": "healthy", "database": "connected"}, 200
#         except Exception as e:
#             return {"status": "unhealthy", "error": str(e)}, 503

#     # Setup logging for production
#     if app.config.get("FLASK_ENV") == "production":
#         if not os.path.exists("logs"):
#             os.mkdir("logs")

#         file_handler = RotatingFileHandler(
#             "logs/mencrytoo.log", maxBytes=10240000, backupCount=10
#         )
#         file_handler.setFormatter(
#             logging.Formatter(
#                 "%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
#             )
#         )
#         file_handler.setLevel(logging.INFO)
#         app.logger.addHandler(file_handler)
#         app.logger.setLevel(logging.INFO)
#         app.logger.info("MenCryToo application startup")

#     return app


# # Create the application instance
# app = create_app()

# # Import time for request timing if needed
# try:
#     import time
# except ImportError:
#     pass
