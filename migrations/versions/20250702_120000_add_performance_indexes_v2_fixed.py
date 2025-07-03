"""add_performance_indexes_v2_fixed

Revision ID: add_performance_indexes_v2_fixed
Revises: 2e6ea9d8a6be
Create Date: 2025-07-01 19:31:28.163452

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_performance_indexes_v2_fixed"
down_revision = "2e6ea9d8a6be"
branch_labels = None
depends_on = None


def upgrade():
    """Add comprehensive performance indexes for production optimization"""

    # Users table indexes for authentication and search
    try:
        op.create_index("idx_users_email_active", "users", ["email"], unique=True)
    except:
        pass  # May already exist

    try:
        op.create_index("idx_users_username_active", "users", ["username"], unique=True)
    except:
        pass  # May already exist

    op.create_index("idx_users_created_at_new", "users", ["created_at"])
    op.create_index("idx_users_updated_at", "users", ["updated_at"])
    op.create_index("idx_users_name_search", "users", ["first_name", "last_name"])

    # Posts table indexes for feed queries
    op.create_index("idx_posts_creator_created_new", "posts", ["creator", "created_at"])
    op.create_index("idx_posts_created_at_desc", "posts", [sa.text("created_at DESC")])
    op.create_index("idx_posts_updated_at_desc", "posts", [sa.text("updated_at DESC")])
    op.create_index("idx_posts_title_search", "posts", ["title"])
    op.create_index("idx_posts_creator_updated", "posts", ["creator", "updated_at"])

    # Groups table indexes for location and organizer queries
    op.create_index(
        "idx_groups_organizer_created_new", "groups", ["organizer_id", "created_at"]
    )
    op.create_index("idx_groups_type_city", "groups", ["type", "city"])
    op.create_index("idx_groups_city_state", "groups", ["city", "state"])
    op.create_index(
        "idx_groups_created_at_desc", "groups", [sa.text("created_at DESC")]
    )
    op.create_index("idx_groups_name_search", "groups", ["name"])

    # Events table indexes for date-based queries
    op.create_index("idx_events_group_start_date", "events", ["group_id", "start_date"])
    op.create_index("idx_events_start_date_asc", "events", ["start_date"])
    op.create_index("idx_events_end_date_new", "events", ["end_date"])
    op.create_index("idx_events_type_start", "events", ["type", "start_date"])
    op.create_index(
        "idx_events_created_at_desc", "events", [sa.text("created_at DESC")]
    )
    op.create_index("idx_events_name_search", "events", ["name"])

    # Comments table indexes for post comments
    op.create_index(
        "idx_comments_post_created_new", "comments", ["post_id", "created_at"]
    )
    op.create_index(
        "idx_comments_user_created_new", "comments", ["user_id", "created_at"]
    )
    op.create_index("idx_comments_parent_id_new", "comments", ["parent_id"])
    op.create_index(
        "idx_comments_created_at_desc", "comments", [sa.text("created_at DESC")]
    )

    # Memberships table indexes for user-group relationships
    op.create_index(
        "idx_memberships_user_group_new",
        "memberships",
        ["user_id", "group_id"],
        unique=True,
    )
    op.create_index(
        "idx_memberships_group_user_new", "memberships", ["group_id", "user_id"]
    )

    # Attendances table indexes for user-event relationships
    op.create_index(
        "idx_attendances_user_event_new",
        "attendances",
        ["user_id", "event_id"],
        unique=True,
    )
    op.create_index(
        "idx_attendances_event_user_new", "attendances", ["event_id", "user_id"]
    )

    # Likes table indexes for post likes aggregation
    op.create_index(
        "idx_likes_user_post_new", "likes", ["user_id", "post_id"], unique=True
    )
    op.create_index("idx_likes_post_user_new", "likes", ["post_id", "user_id"])

    # User tags table indexes for tag-based filtering
    op.create_index(
        "idx_user_tags_user_tag_new", "user_tags", ["user_id", "tag_id"], unique=True
    )
    op.create_index("idx_user_tags_tag_user_new", "user_tags", ["tag_id", "user_id"])

    # Tags table indexes
    try:
        op.create_index("idx_tags_name_unique", "tags", ["name"], unique=True)
    except:
        pass  # May already exist

    # Venues table indexes for location-based queries
    op.create_index("idx_venues_group_id_new", "venues", ["group_id"])
    op.create_index("idx_venues_city_state", "venues", ["city", "state"])
    op.create_index("idx_venues_lat_lng", "venues", ["latitude", "longitude"])

    # Image tables indexes for faster loading
    op.create_index(
        "idx_group_images_group_created", "group_images", ["group_id", "created_at"]
    )
    op.create_index(
        "idx_event_images_event_created", "event_images", ["event_id", "created_at"]
    )

    # Contact and partnership tables for admin queries
    op.create_index(
        "idx_partnerships_email_unique", "partnerships", ["email"], unique=True
    )
    op.create_index("idx_partnerships_created_at", "partnerships", ["created_at"])
    op.create_index("idx_contacts_email", "contacts", ["email"])
    op.create_index("idx_contacts_created_at", "contacts", ["created_at"])

    print("✅ Performance indexes added successfully!")


def downgrade():
    """Remove all performance indexes"""

    # Users table indexes
    try:
        op.drop_index("idx_users_email_active", "users")
        op.drop_index("idx_users_username_active", "users")
    except:
        pass

    op.drop_index("idx_users_created_at_new", "users")
    op.drop_index("idx_users_updated_at", "users")
    op.drop_index("idx_users_name_search", "users")

    # Posts table indexes
    op.drop_index("idx_posts_creator_created_new", "posts")
    op.drop_index("idx_posts_created_at_desc", "posts")
    op.drop_index("idx_posts_updated_at_desc", "posts")
    op.drop_index("idx_posts_title_search", "posts")
    op.drop_index("idx_posts_creator_updated", "posts")

    # Groups table indexes
    op.drop_index("idx_groups_organizer_created_new", "groups")
    op.drop_index("idx_groups_type_city", "groups")
    op.drop_index("idx_groups_city_state", "groups")
    op.drop_index("idx_groups_created_at_desc", "groups")
    op.drop_index("idx_groups_name_search", "groups")

    # Events table indexes
    op.drop_index("idx_events_group_start_date", "events")
    op.drop_index("idx_events_start_date_asc", "events")
    op.drop_index("idx_events_end_date_new", "events")
    op.drop_index("idx_events_type_start", "events")
    op.drop_index("idx_events_created_at_desc", "events")
    op.drop_index("idx_events_name_search", "events")

    # Comments table indexes
    op.drop_index("idx_comments_post_created_new", "comments")
    op.drop_index("idx_comments_user_created_new", "comments")
    op.drop_index("idx_comments_parent_id_new", "comments")
    op.drop_index("idx_comments_created_at_desc", "comments")

    # Memberships table indexes
    op.drop_index("idx_memberships_user_group_new", "memberships")
    op.drop_index("idx_memberships_group_user_new", "memberships")

    # Attendances table indexes
    op.drop_index("idx_attendances_user_event_new", "attendances")
    op.drop_index("idx_attendances_event_user_new", "attendances")

    # Likes table indexes
    op.drop_index("idx_likes_user_post_new", "likes")
    op.drop_index("idx_likes_post_user_new", "likes")

    # User tags table indexes
    op.drop_index("idx_user_tags_user_tag_new", "user_tags")
    op.drop_index("idx_user_tags_tag_user_new", "user_tags")

    # Tags table indexes
    try:
        op.drop_index("idx_tags_name_unique", "tags")
    except:
        pass

    # Venues table indexes
    op.drop_index("idx_venues_group_id_new", "venues")
    op.drop_index("idx_venues_city_state", "venues")
    op.drop_index("idx_venues_lat_lng", "venues")

    # Image tables indexes
    op.drop_index("idx_group_images_group_created", "group_images")
    op.drop_index("idx_event_images_event_created", "event_images")

    # Contact and partnership tables
    op.drop_index("idx_partnerships_email_unique", "partnerships")
    op.drop_index("idx_partnerships_created_at", "partnerships")
    op.drop_index("idx_contacts_email", "contacts")
    op.drop_index("idx_contacts_created_at", "contacts")

    print("✅ Performance indexes removed successfully!")
