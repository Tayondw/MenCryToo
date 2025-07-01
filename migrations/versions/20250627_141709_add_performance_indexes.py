"""Add performance indexes

Revision ID: performance_indexes
Revises: 391204747552
Create Date: 2025-06-27 14:17:09.356833

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
# revision = '65c339c6dbce'
revision = 'performance_indexes'
down_revision = '391204747552'
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

    # Post table indexes
    op.create_index("idx_posts_creator", "posts", ["creator"])
    op.create_index("idx_posts_created_at", "posts", ["created_at"])
    op.create_index("idx_posts_updated_at", "posts", ["updated_at"])
    op.create_index("idx_posts_title", "posts", ["title"])

    # Comment table indexes
    op.create_index("idx_comments_post_id", "comments", ["post_id"])
    op.create_index("idx_comments_user_id", "comments", ["user_id"])
    op.create_index("idx_comments_created_at", "comments", ["created_at"])
    op.create_index("idx_comments_parent_id", "comments", ["parent_id"])

    # Membership table indexes
    op.create_index("idx_memberships_user_id", "memberships", ["user_id"])
    op.create_index("idx_memberships_group_id", "memberships", ["group_id"])
    op.create_index(
        "idx_memberships_user_group", "memberships", ["user_id", "group_id"]
    )

    # Attendance table indexes
    op.create_index("idx_attendances_user_id", "attendances", ["user_id"])
    op.create_index("idx_attendances_event_id", "attendances", ["event_id"])
    op.create_index(
        "idx_attendances_user_event", "attendances", ["user_id", "event_id"]
    )

    # Event table indexes
    op.create_index("idx_events_start_date", "events", ["start_date"])
    op.create_index("idx_events_end_date", "events", ["end_date"])
    op.create_index("idx_events_group_id", "events", ["group_id"])
    op.create_index("idx_events_venue_id", "events", ["venue_id"])
    op.create_index("idx_events_created_at", "events", ["created_at"])

    # Group table indexes
    op.create_index("idx_groups_organizer_id", "groups", ["organizer_id"])
    op.create_index("idx_groups_city", "groups", ["city"])
    op.create_index("idx_groups_state", "groups", ["state"])
    op.create_index("idx_groups_type", "groups", ["type"])
    op.create_index("idx_groups_created_at", "groups", ["created_at"])

    # Venue table indexes
    op.create_index("idx_venues_group_id", "venues", ["group_id"])
    op.create_index("idx_venues_city", "venues", ["city"])
    op.create_index("idx_venues_state", "venues", ["state"])

    # Likes table indexes (if not already covered by primary key)
    op.create_index("idx_likes_user_id", "likes", ["user_id"])
    op.create_index("idx_likes_post_id", "likes", ["post_id"])

    # User tags table indexes
    op.create_index("idx_user_tags_user_id", "user_tags", ["user_id"])
    op.create_index("idx_user_tags_tag_id", "user_tags", ["tag_id"])

    # Tag table indexes
    op.create_index("idx_tags_name", "tags", ["name"])

    # Group images table indexes
    op.create_index("idx_group_images_group_id", "group_images", ["group_id"])

    # Event images table indexes
    op.create_index("idx_event_images_event_id", "event_images", ["event_id"])


def downgrade():
    """Remove performance indexes"""

    # User table indexes
    op.drop_index("idx_users_email", "users")
    op.drop_index("idx_users_username", "users")
    op.drop_index("idx_users_first_name", "users")
    op.drop_index("idx_users_last_name", "users")
    op.drop_index("idx_users_created_at", "users")

    # Post table indexes
    op.drop_index("idx_posts_creator", "posts")
    op.drop_index("idx_posts_created_at", "posts")
    op.drop_index("idx_posts_updated_at", "posts")
    op.drop_index("idx_posts_title", "posts")

    # Comment table indexes
    op.drop_index("idx_comments_post_id", "comments")
    op.drop_index("idx_comments_user_id", "comments")
    op.drop_index("idx_comments_created_at", "comments")
    op.drop_index("idx_comments_parent_id", "comments")

    # Membership table indexes
    op.drop_index("idx_memberships_user_id", "memberships")
    op.drop_index("idx_memberships_group_id", "memberships")
    op.drop_index("idx_memberships_user_group", "memberships")

    # Attendance table indexes
    op.drop_index("idx_attendances_user_id", "attendances")
    op.drop_index("idx_attendances_event_id", "attendances")
    op.drop_index("idx_attendances_user_event", "attendances")

    # Event table indexes
    op.drop_index("idx_events_start_date", "events")
    op.drop_index("idx_events_end_date", "events")
    op.drop_index("idx_events_group_id", "events")
    op.drop_index("idx_events_venue_id", "events")
    op.drop_index("idx_events_created_at", "events")

    # Group table indexes
    op.drop_index("idx_groups_organizer_id", "groups")
    op.drop_index("idx_groups_city", "groups")
    op.drop_index("idx_groups_state", "groups")
    op.drop_index("idx_groups_type", "groups")
    op.drop_index("idx_groups_created_at", "groups")

    # Venue table indexes
    op.drop_index("idx_venues_group_id", "venues")
    op.drop_index("idx_venues_city", "venues")
    op.drop_index("idx_venues_state", "venues")

    # Likes table indexes
    op.drop_index("idx_likes_user_id", "likes")
    op.drop_index("idx_likes_post_id", "likes")

    # User tags table indexes
    op.drop_index("idx_user_tags_user_id", "user_tags")
    op.drop_index("idx_user_tags_tag_id", "user_tags")

    # Tag table indexes
    op.drop_index("idx_tags_name", "tags")

    # Group images table indexes
    op.drop_index("idx_group_images_group_id", "group_images")

    # Event images table indexes
    op.drop_index("idx_event_images_event_id", "event_images")
