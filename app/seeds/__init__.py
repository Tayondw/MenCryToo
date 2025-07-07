from flask.cli import AppGroup
from .users import (
    seed_users,
    undo_users,
    seed_tags,
    seed_user_tags,
    undo_tags,
    undo_user_tags,
)
from .posts import seed_posts, undo_posts, seed_posts_minimal
from .comments import seed_comments, undo_comments
from .groups import seed_groups, undo_groups, seed_groups_minimal
from .venues import seed_venues, undo_venues
from .events import seed_events, undo_events

from app.models.db import db, environment, SCHEMA

# Creates a seed group to hold our commands
seed_commands = AppGroup("seed")


@seed_commands.command("production-minimal")
def seed_production_minimal():
    """Minimal seeding for production to reduce initial load time"""
    print("Starting minimal production seeding...")

    try:
        # Only seed essential data for production
        print("Seeding users...")
        seed_users()

        print("Seeding tags...")
        seed_tags()

        print("Seeding user tags...")
        seed_user_tags()

        print("Seeding minimal posts...")
        seed_posts_minimal()  # Only 10 posts instead of 30

        print("Seeding minimal groups...")
        seed_groups_minimal()  # Only 5 groups instead of 10

        print("Minimal production seeding completed!")

        # Database after seeding
        if environment == "production" and db.engine.url.drivername == "postgresql":
            print("Analyzing database for optimal query plans...")
            db.session.execute("ANALYZE;")
            db.session.commit()

    except Exception as e:
        print(f"Error during minimal seeding: {e}")
        db.session.rollback()
        raise


# Seeding with better transaction management
@seed_commands.command("all")
def seed():
    """Seed all data with proper order and transaction management"""
    if environment == "production":
        # In production, undo in reverse order to avoid foreign key issues
        print("Production mode: Clearing existing data...")
        try:
            # Disable foreign key checks temporarily for faster deletion
            if db.engine.url.drivername == "postgresql":
                db.session.execute("SET session_replication_role = replica;")

            undo_events()
            undo_venues()
            undo_groups()
            undo_comments()
            undo_posts()
            undo_user_tags()
            undo_tags()
            undo_users()

            if db.engine.url.drivername == "postgresql":
                db.session.execute("SET session_replication_role = DEFAULT;")

        except Exception as e:
            print(f"Error during cleanup: {e}")
            db.session.rollback()
            raise

    print("Starting seeding process...")

    try:
        # Seed in proper dependency order
        print("Seeding users...")
        seed_users()

        print("Seeding tags...")
        seed_tags()

        print("Seeding user tags...")
        seed_user_tags()

        print("Seeding posts...")
        seed_posts()

        print("Seeding comments...")
        seed_comments()

        print("Seeding groups...")
        seed_groups()

        print("Seeding venues...")
        seed_venues()

        print("Seeding events...")
        seed_events()

        print("Seeding completed successfully!")

        
        if environment == "production" and db.engine.url.drivername == "postgresql":
            print("Analyzing database for optimal query plans...")
            db.session.execute("ANALYZE;")
            db.session.commit()

    except Exception as e:
        print(f"Error during seeding: {e}")
        db.session.rollback()
        raise


@seed_commands.command("undo")
def undo():
    """Undo all seeded data in proper order"""
    print("Starting undo process...")

    try:
        # Disable foreign key checks for faster deletion in production
        if environment == "production" and db.engine.url.drivername == "postgresql":
            db.session.execute("SET session_replication_role = replica;")

        # Undo in reverse dependency order
        print("Undoing events...")
        undo_events()

        print("Undoing venues...")
        undo_venues()

        print("Undoing groups...")
        undo_groups()

        print("Undoing comments...")
        undo_comments()

        print("Undoing posts...")
        undo_posts()

        print("Undoing user tags...")
        undo_user_tags()

        print("Undoing tags...")
        undo_tags()

        print("Undoing users...")
        undo_users()

        if environment == "production" and db.engine.url.drivername == "postgresql":
            db.session.execute("SET session_replication_role = DEFAULT;")

        print("Undo completed successfully!")

    except Exception as e:
        print(f"Error during undo: {e}")
        db.session.rollback()
        raise


@seed_commands.command("fast")
def seed_fast():
    """Fast seeding for development with minimal data"""
    print("Fast seeding for development...")

    try:
        # Only seed essential data for development
        seed_users()
        seed_tags()
        seed_user_tags()

        # Seed a small amount of content
        from .posts import seed_posts_minimal
        from .groups import seed_groups_minimal

        seed_posts_minimal()  # Only 5-10 posts
        seed_groups_minimal()  # Only 3-5 groups

        print("Fast seeding completed!")

    except Exception as e:
        print(f"Error during fast seeding: {e}")
        db.session.rollback()
        raise


@seed_commands.command("production")
def seed_production():
    """Production seeding with performance considerations"""
    if environment != "production":
        print("This command is only for production environment")
        return

    print("Production seeding with optimizations...")

    try:
        # Temporarily disable some constraints for faster seeding
        db.session.execute("SET synchronous_commit = OFF;")
        db.session.execute('SET wal_buffers = "64MB";')
        db.session.execute("SET checkpoint_segments = 32;")
        db.session.execute("SET checkpoint_completion_target = 0.9;")

        # Run the seeding
        seed_users()
        seed_tags()
        seed_user_tags()
        seed_posts()
        seed_comments()
        seed_groups()
        seed_venues()
        seed_events()

        # Re-enable constraints
        db.session.execute("SET synchronous_commit = ON;")
        db.session.execute("ANALYZE;")
        db.session.execute("VACUUM ANALYZE;")

        print("Production seeding completed with optimizations!")

    except Exception as e:
        print(f"Error during production seeding: {e}")
        db.session.rollback()
        raise


# Individual seeding commands for development
@seed_commands.command("users")
def seed_users_only():
    """Seed only users and related data"""
    try:
        seed_users()
        seed_tags()
        seed_user_tags()
        print("Users seeded successfully!")
    except Exception as e:
        print(f"Error seeding users: {e}")
        db.session.rollback()


@seed_commands.command("content")
def seed_content_only():
    """Seed only content (posts, comments, groups, events)"""
    try:
        seed_posts()
        seed_comments()
        seed_groups()
        seed_venues()
        seed_events()
        print("Content seeded successfully!")
    except Exception as e:
        print(f"Error seeding content: {e}")
        db.session.rollback()
