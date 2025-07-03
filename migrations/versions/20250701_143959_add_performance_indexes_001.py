"""add_performance_indexes_001

Revision ID: d05d3f15fb9b
Revises: 0d8177d47731
Create Date: 2025-07-01 14:39:59.881868

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "d05d3f15fb9b"
down_revision = "0d8177d47731"
branch_labels = None
depends_on = None


def upgrade():
    """Skip this migration - indexes already exist from previous migrations"""
    print("Skipping duplicate index creation - indexes already exist")
    pass


def downgrade():
    """Nothing to downgrade"""
    pass
