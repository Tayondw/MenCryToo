"""add_performance_indexes_001

Revision ID: d05d3f15fb9b
Revises: 0d8177d47731
Create Date: 2025-07-01 14:39:59.881868

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd05d3f15fb9b'
down_revision = '0d8177d47731'
branch_labels = None
depends_on = None


def upgrade():
    """Add performance indexes for better query performance"""

    # User table indexes
    op.create_index("idx_users_email", "users", ["email"])
    op.create_index("idx_users_username", "users", ["username"])
    op.create_index("idx_users_first_name", "users", ["first_name"])
    op.create_index("idx_users_last_name", "users", ["last_name"])
    op.create_index("idx_users_created_at", "users", ["created_at"])

    # Users table - search and authentication
    op.create_index("idx_users_email_username", "users", ["email", "username"])
    op.create_index("idx_users_profile_search", "users", ["first_name", "last_name"])

    # Post table indexes
    op.create_index("idx_posts_creator", "posts", ["creator"])
    op.create_index("idx_posts_created_at", "posts", ["created_at"])
    op.create_index("idx_posts_updated_at", "posts", ["updated_at"])
    op.create_index("idx_posts_title", "posts", ["title"])

    # Posts table - feed queries and user posts
    op.create_index("idx_posts_creator_created", "posts", ["creator", "created_at"])
    op.create_index("idx_posts_updated_desc", "posts", [sa.text("updated_at DESC")])

    # Comments table - post comments queries
    op.create_index("idx_comments_post_created", "comments", ["post_id", "created_at"])
    op.create_index("idx_comments_user_created", "comments", ["user_id", "created_at"])
    op.create_index(
        "idx_comments_parent_created", "comments", ["parent_id", "created_at"]
    )

    # Memberships table - user and group relationships
    op.create_index(
        "idx_memberships_user_group", "memberships", ["user_id", "group_id"]
    )
    op.create_index(
        "idx_memberships_group_user", "memberships", ["group_id", "user_id"]
    )

    # Attendances table - event and user relationships
    op.create_index(
        "idx_attendances_event_user", "attendances", ["event_id", "user_id"]
    )
    op.create_index(
        "idx_attendances_user_event", "attendances", ["user_id", "event_id"]
    )

    # Event table indexes
    op.create_index("idx_events_start_date", "events", ["start_date"])
    op.create_index("idx_events_end_date", "events", ["end_date"])
    op.create_index("idx_events_group_id", "events", ["group_id"])
    op.create_index("idx_events_venue_id", "events", ["venue_id"])
    op.create_index("idx_events_created_at", "events", ["created_at"])

    # Events table - date range queries and group events
    op.create_index(
        "idx_events_group_dates", "events", ["group_id", "start_date", "end_date"]
    )
    op.create_index("idx_events_date_range", "events", ["start_date", "end_date"])
    op.create_index("idx_events_type_date", "events", ["type", "start_date"])

    # Group table indexes
    op.create_index("idx_groups_organizer_id", "groups", ["organizer_id"])
    op.create_index("idx_groups_city", "groups", ["city"])
    op.create_index("idx_groups_state", "groups", ["state"])
    op.create_index("idx_groups_type", "groups", ["type"])
    op.create_index("idx_groups_created_at", "groups", ["created_at"])

    # Groups table - location and type filtering
    op.create_index("idx_groups_location", "groups", ["city", "state"])
    op.create_index("idx_groups_type_created", "groups", ["type", "created_at"])
    op.create_index(
        "idx_groups_organizer_created", "groups", ["organizer_id", "created_at"]
    )

    # Venues table - location-based queries
    op.create_index(
        "idx_venues_group_location", "venues", ["group_id", "city", "state"]
    )
    op.create_index("idx_venues_coordinates", "venues", ["latitude", "longitude"])

    # Likes table - post likes aggregation (if using association table)
    op.create_index("idx_likes_post_user", "likes", ["post_id", "user_id"])
    op.create_index("idx_likes_user_post", "likes", ["user_id", "post_id"])

    # User tags - tag filtering and user similarity
    op.create_index("idx_user_tags_user_tag", "user_tags", ["user_id", "tag_id"])
    op.create_index("idx_user_tags_tag_user", "user_tags", ["tag_id", "user_id"])

    # Tag table indexes
    op.create_index("idx_tags_name", "tags", ["name"])

    # Group and Event images - faster image loading
    op.create_index(
        "idx_group_images_group", "group_images", ["group_id", "created_at"]
    )
    op.create_index(
        "idx_event_images_event", "event_images", ["event_id", "created_at"]
    )

    # Add partial indexes for common filters (PostgreSQL specific)
    # These will only be created if using PostgreSQL
    try:
        # Active users (users with profile images)
        op.create_index(
            "idx_users_active",
            "users",
            ["created_at"],
            postgresql_where=sa.text("profile_image_url IS NOT NULL"),
        )

        # Future events
        op.create_index(
            "idx_events_future",
            "events",
            ["start_date"],
            postgresql_where=sa.text("start_date > NOW()"),
        )

        # Public groups (if you have a visibility field)
        # op.create_index(
        #     'idx_groups_public',
        #     'groups',
        #     ['created_at'],
        #     postgresql_where=sa.text('is_public = true')
        # )

    except Exception:
        # Skip partial indexes if not using PostgreSQL
        pass


def downgrade():
    """Remove performance indexes"""

    # User table indexes
    op.drop_index("idx_users_email", "users")
    op.drop_index("idx_users_username", "users")
    op.drop_index("idx_users_first_name", "users")
    op.drop_index("idx_users_last_name", "users")
    op.drop_index("idx_users_created_at", "users")
    op.drop_index("idx_users_email_username")
    op.drop_index("idx_users_profile_search")

    # Post table indexes
    op.drop_index("idx_posts_creator", "posts")
    op.drop_index("idx_posts_created_at", "posts")
    op.drop_index("idx_posts_updated_at", "posts")
    op.drop_index("idx_posts_title", "posts")
    op.drop_index("idx_posts_creator_created")
    op.drop_index("idx_posts_updated_desc")

    # Comment table indexes
    op.drop_index("idx_comments_post_created")
    op.drop_index("idx_comments_user_created")
    op.drop_index("idx_comments_parent_created")

    # Membership table indexes
    op.drop_index("idx_memberships_user_group")
    op.drop_index("idx_memberships_group_user")

    # Attendance table indexes
    op.drop_index("idx_attendances_event_user")
    op.drop_index("idx_attendances_user_event")

    # Event table indexes
    op.drop_index("idx_events_start_date", "events")
    op.drop_index("idx_events_end_date", "events")
    op.drop_index("idx_events_group_id", "events")
    op.drop_index("idx_events_venue_id", "events")
    op.drop_index("idx_events_created_at", "events")
    op.drop_index("idx_events_group_dates")
    op.drop_index("idx_events_date_range")
    op.drop_index("idx_events_type_date")

    # Group table indexes
    op.drop_index("idx_groups_organizer_id", "groups")
    op.drop_index("idx_groups_city", "groups")
    op.drop_index("idx_groups_state", "groups")
    op.drop_index("idx_groups_type", "groups")
    op.drop_index("idx_groups_created_at", "groups")
    op.drop_index('idx_groups_location')
    op.drop_index('idx_groups_type_created')
    op.drop_index('idx_groups_organizer_created')

    # Venue table indexes
    op.drop_index("idx_venues_group_location")
    op.drop_index("idx_venues_coordinates")

    # Likes table indexes
    op.drop_index("idx_likes_post_user")
    op.drop_index("idx_likes_user_post")

    # User tags table indexes
    op.drop_index("idx_user_tags_user_tag")
    op.drop_index("idx_user_tags_tag_user")

    # Tag table indexes
    op.drop_index("idx_tags_name", "tags")

    # Group images table indexes
    op.drop_index("idx_group_images_group")

    # Event images table indexes
    op.drop_index("idx_event_images_event")

    # Partial indexes (PostgreSQL specific)
    try:
        op.drop_index("idx_users_active")
        op.drop_index("idx_events_future")
        # op.drop_index('idx_groups_public')
    except Exception:
        # Skip if not using PostgreSQL or indexes don't exist
        pass
