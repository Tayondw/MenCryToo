import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    FLASK_RUN_PORT = os.environ.get("FLASK_RUN_PORT")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Database configuration
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        # Production database (PostgreSQL)
        SQLALCHEMY_DATABASE_URI = database_url.replace("postgres://", "postgresql://")
    else:
        # Development database (SQLite)
        SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///dev.db")

    # Determine if we're using PostgreSQL or SQLite
    is_postgresql = SQLALCHEMY_DATABASE_URI.startswith(("postgresql://", "postgres://"))

    # Production optimizations (only for PostgreSQL)
    if os.environ.get("FLASK_ENV") == "production" and is_postgresql:
        SQLALCHEMY_ECHO = False  # Disable SQL logging
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_size": 20,  # Increased from 10 for better concurrency
            "pool_recycle": 1800,  # 30 minutes instead of 1 hour
            "pool_pre_ping": True,  # Verify connections before use
            "max_overflow": 30,  # Increased from 20 for peak loads
            "pool_timeout": 10,  # Reduced from 30 for faster failures
            "connect_args": {
                "options": "-c statement_timeout=30000 -c idle_in_transaction_session_timeout=60000",
                "application_name": "mencrytoo_app",
            },
        }

        # Additional Flask optimizations
        SEND_FILE_MAX_AGE_DEFAULT = 31536000  # 1 year cache for static files

    elif is_postgresql:
        # Development with PostgreSQL
        SQLALCHEMY_ECHO = True
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_size": 10,  # Increased from 5 for development
            "pool_recycle": 1800,
            "pool_pre_ping": True,
            "max_overflow": 10,  # Increased from 0
            "pool_timeout": 10,
            "connect_args": {
                "options": "-c statement_timeout=30000",
                "application_name": "mencrytoo_dev",
            },
        }
    else:
        # SQLite configuration (no pooling options)
        SQLALCHEMY_ECHO = True if os.environ.get("FLASK_ENV") != "production" else False
        # SQLite optimizations
        SQLALCHEMY_ENGINE_OPTIONS = (
            {
                "connect_args": {
                    "timeout": 10,
                    "check_same_thread": False,
                }
            }
            if not is_postgresql
            else {}
        )

    # Performance optimizations for all environments
    JSON_SORT_KEYS = False  # Don't sort JSON keys for better performance
    JSONIFY_PRETTYPRINT_REGULAR = False  # Disable pretty printing in production


# import os


# class Config:
#     SECRET_KEY = os.environ.get("SECRET_KEY")
#     FLASK_RUN_PORT = os.environ.get("FLASK_RUN_PORT")
#     SQLALCHEMY_TRACK_MODIFICATIONS = False

#     # Database configuration
#     database_url = os.environ.get("DATABASE_URL")
#     if database_url:
#         # Production database (PostgreSQL)
#         SQLALCHEMY_DATABASE_URI = database_url.replace("postgres://", "postgresql://")
#     else:
#         # Development database (SQLite)
#         SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///dev.db")

#     # Determine if we're using PostgreSQL or SQLite
#     is_postgresql = SQLALCHEMY_DATABASE_URI.startswith(("postgresql://", "postgres://"))

#     # Production optimizations (only for PostgreSQL)
#     if os.environ.get("FLASK_ENV") == "production" and is_postgresql:
#         SQLALCHEMY_ECHO = False  # Disable SQL logging
#         SQLALCHEMY_ENGINE_OPTIONS = {
#             "pool_size": 10,  # Number of connections to maintain
#             "pool_recycle": 3600,  # Recycle connections every hour
#             "pool_pre_ping": True,  # Verify connections before use
#             "max_overflow": 20,  # Allow up to 20 additional connections
#             "pool_timeout": 30,  # Timeout for getting connection
#         }

#         # Additional Flask optimizations
#         SEND_FILE_MAX_AGE_DEFAULT = 31536000  # 1 year cache for static files

#     elif is_postgresql:
#         # Development with PostgreSQL
#         SQLALCHEMY_ECHO = True
#         SQLALCHEMY_ENGINE_OPTIONS = {
#             "pool_size": 5,
#             "pool_recycle": 1800,
#             "pool_pre_ping": True,
#             "max_overflow": 0,
#         }
#     else:
#         # SQLite configuration (no pooling options)
#         SQLALCHEMY_ECHO = True if os.environ.get("FLASK_ENV") != "production" else False
#         # No SQLALCHEMY_ENGINE_OPTIONS for SQLite
