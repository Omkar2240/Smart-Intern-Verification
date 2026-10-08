"""Add last_login column to users table

Revision ID: 007_add_last_login
Revises: 006_admin_permissions
Create Date: 2026-10-08

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "007_add_last_login"
down_revision: Union[str, None] = "006_admin_permissions"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add last_login column to users table
    bind = op.get_bind()
    insp = sa.inspect(bind)
    user_columns = [c["name"] for c in insp.get_columns("users")]
    if "last_login" not in user_columns:
        op.add_column('users', sa.Column('last_login', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    # Remove last_login column from users table
    op.drop_column('users', 'last_login')
