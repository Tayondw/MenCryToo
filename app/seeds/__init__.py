from flask.cli import AppGroup
from .users import (
    seed_users,
    undo_users,
    seed_tags,
    seed_user_tags,
    undo_tags,
    undo_user_tags,
)
from .posts import seed_posts, undo_posts
from .comments import seed_comments, undo_comments
from .groups import seed_groups, seed_group_images, undo_groups, undo_group_images
from .venues import seed_venues, undo_venues
from .events import seed_events, seed_event_images, undo_events, undo_event_images


from app.models.db import db, environment, SCHEMA

# Creates a seed group to hold our commands
# So we can type `flask seed --help`
seed_commands = AppGroup("seed")


# Creates the `flask seed all` command
@seed_commands.command("all")
def seed():
    if environment == "production":
        # Before seeding in production, you want to run the seed undo
        # command, which will  truncate all tables prefixed with
        # the schema name (see comment in users.py undo_users function).
        # Make sure to add all your other model's undo functions below
        undo_users()
    seed_users()
    seed_tags()
    seed_user_tags()
    seed_posts()
    seed_comments()
    seed_groups()
    seed_group_images()
    seed_venues()
    seed_events()
    seed_event_images()


# Creates the `flask seed undo` command
# The undo order should be the reverse of the seeding order to avoid foreign key constraint issues.
@seed_commands.command("undo")
def undo():
    undo_event_images()
    undo_events()
    undo_venues()
    undo_group_images()
    undo_groups()
    undo_comments()
    undo_posts()
    undo_user_tags()
    undo_tags()
    undo_users()
