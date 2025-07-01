"""add_performance_indexes_v2

Revision ID: 1ba1a0310bf1
Revises: d05d3f15fb9b
Create Date: 2025-07-01 19:31:28.163452

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_performance_indexes_v2"
down_revision = "d05d3f15fb9b"
branch_labels = None
depends_on = None


def upgrade():
    # Add composite indexes for better query performance

    # Users table indexes
    op.create_index("idx_users_email_active", "users", ["email"], unique=True)
    op.create_index("idx_users_username_active", "users", ["username"], unique=True)
    op.create_index("idx_users_created_at", "users", ["created_at"])
    op.create_index("idx_users_updated_at", "users", ["updated_at"])

    # Posts table indexes
    op.create_index("idx_posts_creator_created", "posts", ["creator", "created_at"])
    op.create_index("idx_posts_created_at_desc", "posts", [sa.text("created_at DESC")])
    op.create_index("idx_posts_updated_at_desc", "posts", [sa.text("updated_at DESC")])
    op.create_index("idx_posts_title_search", "posts", ["title"])
    op.create_index("idx_posts_creator_updated", "posts", ["creator", "updated_at"])

    # Groups table indexes
    op.create_index(
        "idx_groups_organizer_created", "groups", ["organizer_id", "created_at"]
    )
    op.create_index("idx_groups_type_city", "groups", ["type", "city"])
    op.create_index("idx_groups_city_state", "groups", ["city", "state"])
    op.create_index(
        "idx_groups_created_at_desc", "groups", [sa.text("created_at DESC")]
    )
    op.create_index("idx_groups_name_search", "groups", ["name"])

    # Events table indexes
    op.create_index("idx_events_group_start_date", "events", ["group_id", "start_date"])
    op.create_index("idx_events_start_date_asc", "events", ["start_date"])
    op.create_index("idx_events_end_date", "events", ["end_date"])
    op.create_index("idx_events_type_start", "events", ["type", "start_date"])
    op.create_index(
        "idx_events_created_at_desc", "events", [sa.text("created_at DESC")]
    )
    op.create_index("idx_events_name_search", "events", ["name"])

    # Comments table indexes
    op.create_index("idx_comments_post_created", "comments", ["post_id", "created_at"])
    op.create_index("idx_comments_user_created", "comments", ["user_id", "created_at"])
    op.create_index("idx_comments_parent_id", "comments", ["parent_id"])
    op.create_index(
        "idx_comments_created_at_desc", "comments", [sa.text("created_at DESC")]
    )

    # Memberships table indexes
    op.create_index(
        "idx_memberships_user_group",
        "memberships",
        ["user_id", "group_id"],
        unique=True,
    )
    op.create_index(
        "idx_memberships_group_user", "memberships", ["group_id", "user_id"]
    )

    # Attendances table indexes
    op.create_index(
        "idx_attendances_user_event",
        "attendances",
        ["user_id", "event_id"],
        unique=True,
    )
    op.create_index(
        "idx_attendances_event_user", "attendances", ["event_id", "user_id"]
    )

    # Likes table indexes (many-to-many)
    op.create_index("idx_likes_user_post", "likes", ["user_id", "post_id"], unique=True)
    op.create_index("idx_likes_post_user", "likes", ["post_id", "user_id"])

    # User tags table indexes
    op.create_index(
        "idx_user_tags_user_tag", "user_tags", ["user_id", "tag_id"], unique=True
    )
    op.create_index("idx_user_tags_tag_user", "user_tags", ["tag_id", "user_id"])

    # Tags table indexes
    op.create_index("idx_tags_name_unique", "tags", ["name"], unique=True)

    # Venues table indexes
    op.create_index("idx_venues_group_id", "venues", ["group_id"])
    op.create_index("idx_venues_city_state", "venues", ["city", "state"])
    op.create_index("idx_venues_lat_lng", "venues", ["latitude", "longitude"])

    # Group images table indexes
    op.create_index(
        "idx_group_images_group_created", "group_images", ["group_id", "created_at"]
    )

    # Event images table indexes
    op.create_index(
        "idx_event_images_event_created", "event_images", ["event_id", "created_at"]
    )

    # Partnerships table indexes
    op.create_index(
        "idx_partnerships_email_unique", "partnerships", ["email"], unique=True
    )
    op.create_index("idx_partnerships_created_at", "partnerships", ["created_at"])

    # Contacts table indexes
    op.create_index("idx_contacts_email", "contacts", ["email"])
    op.create_index("idx_contacts_created_at", "contacts", ["created_at"])


def downgrade():
    # Remove all the indexes we created

    # Users table indexes
    op.drop_index("idx_users_email_active", "users")
    op.drop_index("idx_users_username_active", "users")
    op.drop_index("idx_users_created_at", "users")
    op.drop_index("idx_users_updated_at", "users")

    # Posts table indexes
    op.drop_index("idx_posts_creator_created", "posts")
    op.drop_index("idx_posts_created_at_desc", "posts")
    op.drop_index("idx_posts_updated_at_desc", "posts")
    op.drop_index("idx_posts_title_search", "posts")
    op.drop_index("idx_posts_creator_updated", "posts")

    # Groups table indexes
    op.drop_index("idx_groups_organizer_created", "groups")
    op.drop_index("idx_groups_type_city", "groups")
    op.drop_index("idx_groups_city_state", "groups")
    op.drop_index("idx_groups_created_at_desc", "groups")
    op.drop_index("idx_groups_name_search", "groups")

    # Events table indexes
    op.drop_index("idx_events_group_start_date", "events")
    op.drop_index("idx_events_start_date_asc", "events")
    op.drop_index("idx_events_end_date", "events")
    op.drop_index("idx_events_type_start", "events")
    op.drop_index("idx_events_created_at_desc", "events")
    op.drop_index("idx_events_name_search", "events")

    # Comments table indexes
    op.drop_index("idx_comments_post_created", "comments")
    op.drop_index("idx_comments_user_created", "comments")
    op.drop_index("idx_comments_parent_id", "comments")
    op.drop_index("idx_comments_created_at_desc", "comments")

    # Memberships table indexes
    op.drop_index("idx_memberships_user_group", "memberships")
    op.drop_index("idx_memberships_group_user", "memberships")

    # Attendances table indexes
    op.drop_index("idx_attendances_user_event", "attendances")
    op.drop_index("idx_attendances_event_user", "attendances")

    # Likes table indexes
    op.drop_index("idx_likes_user_post", "likes")
    op.drop_index("idx_likes_post_user", "likes")

    # User tags table indexes
    op.drop_index("idx_user_tags_user_tag", "user_tags")
    op.drop_index("idx_user_tags_tag_user", "user_tags")

    # Tags table indexes
    op.drop_index("idx_tags_name_unique", "tags")

    # Venues table indexes
    op.drop_index("idx_venues_group_id", "venues")
    op.drop_index("idx_venues_city_state", "venues")
    op.drop_index("idx_venues_lat_lng", "venues")

    # Group images table indexes
    op.drop_index("idx_group_images_group_created", "group_images")

    # Event images table indexes
    op.drop_index("idx_event_images_event_created", "event_images")

    # Partnerships table indexes
    op.drop_index("idx_partnerships_email_unique", "partnerships")
    op.drop_index("idx_partnerships_created_at", "partnerships")

    # Contacts table indexes
    op.drop_index("idx_contacts_email", "contacts")
    op.drop_index("idx_contacts_created_at", "contacts")
