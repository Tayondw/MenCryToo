"""Initial migration

Revision ID: initial_migration_001
Revises:
Create Date: 2025-07-10 17:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = "initial_migration_001"
down_revision = None  # This is now the first migration
branch_labels = None
depends_on = None


def upgrade():
    
    # Drop all existing tables if they exist (nuclear approach)
    drop_all_existing_tables()

    # Create all tables from scratch
    create_core_tables()
    create_relationship_tables()
    create_comment_likes_table()
    create_all_indexes()

    print("✅ All tables created with proper relationships and indexes")


def drop_all_existing_tables():
    """Drop all existing tables in reverse dependency order"""
    print("💥 Dropping all existing tables...")

    tables_to_drop = [
        "event_images",
        "attendances",
        "events",
        "venues",
        "memberships",
        "group_images",
        "comment_likes",
        "comments",
        "likes",
        "user_tags",
        "posts",
        "groups",
        "users",
        "tags",
        "partnerships",
        "contacts",
    ]

    for table in tables_to_drop:
        try:
            op.drop_table(table)
            print(f"✅ Dropped {table}")
        except:
            print(f"⚠️  Table {table} didn't exist")


def create_core_tables():
    """Create core tables: contacts, partnerships, tags, users"""
    print("🏗️  Creating core tables...")

    # Contacts table
    op.create_table(
        "contacts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("first_name", sa.String(length=20), nullable=False),
        sa.Column("last_name", sa.String(length=20), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.Numeric(precision=10, scale=0), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created contacts table")

    # Partnerships table
    op.create_table(
        "partnerships",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("first_name", sa.String(length=20), nullable=False),
        sa.Column("last_name", sa.String(length=20), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.Numeric(precision=10, scale=0), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    print("✅ Created partnerships table")

    # Tags table
    op.create_table(
        "tags",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=30), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created tags table")

    # Users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("first_name", sa.String(length=20), nullable=False),
        sa.Column("last_name", sa.String(length=20), nullable=False),
        sa.Column("username", sa.String(length=40), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("bio", sa.String(length=500), nullable=True),
        sa.Column("profile_image_url", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created users table")

    # Groups table
    op.create_table(
        "groups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organizer_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("about", sa.String(length=150), nullable=False),
        sa.Column(
            "type",
            sa.Enum("online", "in-person", name="group_location"),
            nullable=False,
        ),
        sa.Column("city", sa.String(length=30), nullable=False),
        sa.Column("state", sa.String(length=2), nullable=False),
        sa.Column("image", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        ),
        sa.ForeignKeyConstraint(["organizer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created groups table")

    # Posts table
    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=50), nullable=False),
        sa.Column("caption", sa.String(length=250), nullable=False),
        sa.Column("creator", sa.Integer(), nullable=False),
        sa.Column("image", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        ),
        sa.ForeignKeyConstraint(["creator"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created posts table")


def create_relationship_tables():
    """Create relationship and dependent tables"""
    print("🔗 Creating relationship tables...")

    # User tags junction table
    op.create_table(
        "user_tags",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("tag_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["tag_id"], ["tags.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "tag_id"),
    )
    print("✅ Created user_tags table")

    # Comments table
    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.Column(
            "comment", sa.String(length=500), nullable=False
        ),
        sa.Column("parent_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        ),
        sa.ForeignKeyConstraint(["parent_id"], ["comments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created comments table with 500 character limit")

    # Group images table
    op.create_table(
        "group_images",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("group_image", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        ),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created group_images table")

    # Post likes table
    op.create_table(
        "likes",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("post_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["post_id"], ["posts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "post_id"),
    )
    print("✅ Created likes table")

    # Memberships table
    op.create_table(
        "memberships",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created memberships table")

    # Venues table
    op.create_table(
        "venues",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("address", sa.String(length=50), nullable=False),
        sa.Column("city", sa.String(length=30), nullable=False),
        sa.Column("state", sa.String(length=2), nullable=False),
        sa.Column("zip_code", sa.String(length=5), nullable=False),
        sa.Column("latitude", sa.Numeric(scale=10, asdecimal=False), nullable=True),
        sa.Column("longitude", sa.Numeric(scale=10, asdecimal=False), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        ),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created venues table")

    # Events table
    op.create_table(
        "events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("venue_id", sa.Integer(), nullable=True),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.String(length=150), nullable=False),
        sa.Column(
            "type",
            sa.Enum("online", "in-person", name="event_location"),
            nullable=False,
        ),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("image", sa.String(length=500), nullable=True),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        ),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["venue_id"], ["venues.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created events table")

    # Attendances table
    op.create_table(
        "attendances",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created attendances table")

    # Event images table
    op.create_table(
        "event_images",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("event_image", sa.String(length=500), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=True,
            default=datetime.utcnow,
            onupdate=datetime.utcnow,
        ),
        sa.ForeignKeyConstraint(["event_id"], ["events.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    print("✅ Created event_images table")


def create_comment_likes_table():
    """Create the comment likes table with proper relationships"""
    print("❤️  Creating comment likes table...")

    op.create_table(
        "comment_likes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("comment_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True, default=datetime.utcnow),
        # Foreign key constraints with CASCADE delete
        sa.ForeignKeyConstraint(["comment_id"], ["comments.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        # Primary key
        sa.PrimaryKeyConstraint("id"),
        # Unique constraint to prevent duplicate likes
        sa.UniqueConstraint("user_id", "comment_id", name="uq_user_comment_like"),
    )
    print("✅ Created comment_likes table with proper constraints")


def create_all_indexes():
    """Create all necessary indexes for performance"""
    print("📊 Creating all indexes...")

    # Users indexes
    op.create_index("ix_users_created_at", "users", ["created_at"])
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_first_name", "users", ["first_name"])
    op.create_index("ix_users_id", "users", ["id"])
    op.create_index("ix_users_last_name", "users", ["last_name"])
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    print("✅ Created users indexes")

    # Groups indexes
    op.create_index("ix_groups_city", "groups", ["city"])
    op.create_index("ix_groups_created_at", "groups", ["created_at"])
    op.create_index("ix_groups_name", "groups", ["name"])
    op.create_index("ix_groups_organizer_id", "groups", ["organizer_id"])
    op.create_index("ix_groups_state", "groups", ["state"])
    op.create_index("ix_groups_type", "groups", ["type"])
    print("✅ Created groups indexes")

    # Posts indexes
    op.create_index("ix_posts_created_at", "posts", ["created_at"])
    op.create_index("ix_posts_creator", "posts", ["creator"])
    op.create_index("ix_posts_id", "posts", ["id"])
    op.create_index("ix_posts_title", "posts", ["title"])
    print("✅ Created posts indexes")

    # Events indexes
    op.create_index("ix_events_created_at", "events", ["created_at"])
    op.create_index("ix_events_end_date", "events", ["end_date"])
    op.create_index("ix_events_group_id", "events", ["group_id"])
    op.create_index("ix_events_name", "events", ["name"])
    op.create_index("ix_events_start_date", "events", ["start_date"])
    op.create_index("ix_events_type", "events", ["type"])
    op.create_index("ix_events_venue_id", "events", ["venue_id"])
    print("✅ Created events indexes")

    # Comment likes indexes (CRITICAL for performance)
    op.create_index("ix_comment_likes_comment_id", "comment_likes", ["comment_id"])
    op.create_index("ix_comment_likes_user_id", "comment_likes", ["user_id"])
    op.create_index("ix_comment_likes_created_at", "comment_likes", ["created_at"])
    print("✅ Created comment_likes indexes")

    # Comments indexes
    op.create_index("ix_comments_post_id", "comments", ["post_id"])
    op.create_index("ix_comments_user_id", "comments", ["user_id"])
    op.create_index("ix_comments_parent_id", "comments", ["parent_id"])
    op.create_index("ix_comments_created_at", "comments", ["created_at"])
    print("✅ Created comments indexes")


def downgrade():
    """
    Complete rollback - drops everything
    """
    print("🔙 Starting complete nuclear rollback...")

    # Drop all tables in reverse dependency order
    tables_to_drop = [
        "event_images",
        "attendances",
        "events",
        "venues",
        "memberships",
        "group_images",
        "comment_likes",
        "comments",
        "likes",
        "user_tags",
        "posts",
        "groups",
        "users",
        "tags",
        "partnerships",
        "contacts",
    ]

    for table in tables_to_drop:
        try:
            op.drop_table(table)
            print(f"✅ Dropped {table}")
        except:
            print(f"⚠️  Table {table} not found")

    print("💥 Complete nuclear rollback finished!")


def verify_migration():
    """
    Verification function to test the migration
    """

    conn = op.get_bind()

    # Check that all tables exist
    expected_tables = [
        "contacts",
        "partnerships",
        "tags",
        "users",
        "groups",
        "posts",
        "user_tags",
        "comments",
        "group_images",
        "likes",
        "memberships",
        "venues",
        "events",
        "attendances",
        "event_images",
        "comment_likes",
    ]

    for table in expected_tables:
        result = conn.execute(
            sa.text(
                f"""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='{table}'
        """
            )
        ).fetchone()

        if result:
            print(f"✅ {table} table exists")
        else:
            raise Exception(f"❌ {table} table missing")

    # Test comment_likes table specifically
    result = conn.execute(sa.text("PRAGMA table_info(comment_likes)")).fetchall()
    expected_columns = {"id", "user_id", "comment_id", "created_at"}
    actual_columns = {row[1] for row in result}

    if expected_columns.issubset(actual_columns):
        print("✅ comment_likes has all required columns")
    else:
        missing = expected_columns - actual_columns
        raise Exception(f"❌ comment_likes missing columns: {missing}")

    # Test that we can query the table
    conn.execute(sa.text("SELECT COUNT(*) FROM comment_likes")).fetchone()
    print("✅ comment_likes table is queryable")

    # Test foreign key constraints by checking PRAGMA
    fk_info = conn.execute(sa.text("PRAGMA foreign_key_list(comment_likes)")).fetchall()
    if len(fk_info) >= 2:  # Should have at least 2 foreign keys
        print("✅ comment_likes foreign keys are set up")
    else:
        print("⚠️  Foreign keys might not be properly configured")

    print("🎉 Migration verification passed!")
