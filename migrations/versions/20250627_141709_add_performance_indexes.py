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
    # Add indexes for better query performance
    op.create_index("idx_users_first_name", "users", ["first_name"])
    op.create_index("idx_users_last_name", "users", ["last_name"])
    op.create_index("idx_users_created_at", "users", ["created_at"])

    op.create_index("idx_groups_organizer_id", "groups", ["organizer_id"])
    op.create_index("idx_groups_name", "groups", ["name"])
    op.create_index("idx_groups_type", "groups", ["type"])
    op.create_index("idx_groups_city", "groups", ["city"])
    op.create_index("idx_groups_state", "groups", ["state"])
    op.create_index("idx_groups_created_at", "groups", ["created_at"])

    op.create_index("idx_posts_creator", "posts", ["creator"])
    op.create_index("idx_posts_created_at", "posts", ["created_at"])

    op.create_index("idx_events_group_id", "events", ["group_id"])
    op.create_index("idx_events_venue_id", "events", ["venue_id"])
    op.create_index("idx_events_start_date", "events", ["start_date"])
    op.create_index("idx_events_type", "events", ["type"])

    op.create_index("idx_comments_post_id", "comments", ["post_id"])
    op.create_index("idx_comments_user_id", "comments", ["user_id"])
    op.create_index("idx_comments_parent_id", "comments", ["parent_id"])

    op.create_index("idx_memberships_group_id", "memberships", ["group_id"])
    op.create_index("idx_memberships_user_id", "memberships", ["user_id"])

    op.create_index("idx_attendances_event_id", "attendances", ["event_id"])
    op.create_index("idx_attendances_user_id", "attendances", ["user_id"])


def downgrade():
    # Remove indexes
    op.drop_index("idx_users_first_name")
    op.drop_index("idx_users_last_name")
    op.drop_index("idx_users_created_at")

    op.drop_index("idx_groups_organizer_id")
    op.drop_index("idx_groups_name")
    op.drop_index("idx_groups_type")
    op.drop_index("idx_groups_city")
    op.drop_index("idx_groups_state")
    op.drop_index("idx_groups_created_at")

    op.drop_index("idx_posts_creator")
    op.drop_index("idx_posts_created_at")

    op.drop_index("idx_events_group_id")
    op.drop_index("idx_events_venue_id")
    op.drop_index("idx_events_start_date")
    op.drop_index("idx_events_type")

    op.drop_index("idx_comments_post_id")
    op.drop_index("idx_comments_user_id")
    op.drop_index("idx_comments_parent_id")

    op.drop_index("idx_memberships_group_id")
    op.drop_index("idx_memberships_user_id")

    op.drop_index("idx_attendances_event_id")
    op.drop_index("idx_attendances_user_id")
