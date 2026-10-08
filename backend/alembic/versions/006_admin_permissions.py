"""Add configurable permissions to administrator accounts.

Revision ID: 006_admin_permissions
Revises: 005_super_admin_platform_management
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "006_admin_permissions"
down_revision: Union[str, None] = "005_super_admin_platform_management"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("permissions", sa.JSON(), nullable=False, server_default="[]"),
    )
    op.alter_column("users", "permissions", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "permissions")
