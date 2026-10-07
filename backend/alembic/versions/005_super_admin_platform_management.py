"""Add super-admin platform management entities.

Revision ID: 005_super_admin_platform_management
Revises: 004_attendance_records
"""

import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "005_super_admin_platform_management"
down_revision: Union[str, None] = "004_attendance_records"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("college_id", UUID(as_uuid=True), sa.ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("code", sa.String(50), nullable=False),
        sa.Column("hod_name", sa.String(255), nullable=True),
        sa.Column("hod_email", sa.String(320), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("college_id", "code", name="uq_department_college_code"),
    )
    op.create_index("ix_departments_college_id", "departments", ["college_id"])
    op.create_index("ix_departments_is_active", "departments", ["is_active"])

    op.add_column("users", sa.Column("college_id", UUID(as_uuid=True), nullable=True))
    op.add_column("users", sa.Column("department_id", UUID(as_uuid=True), nullable=True))
    op.create_foreign_key("fk_users_college_id", "users", "colleges", ["college_id"], ["id"], ondelete="SET NULL")
    op.create_foreign_key("fk_users_department_id", "users", "departments", ["department_id"], ["id"], ondelete="SET NULL")
    op.create_index("ix_users_college_id", "users", ["college_id"])
    op.create_index("ix_users_department_id", "users", ["department_id"])

    op.create_table(
        "system_configs",
        sa.Column("key", sa.String(100), primary_key=True),
        sa.Column("value", sa.JSON(), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("system_configs")
    op.drop_index("ix_users_department_id", table_name="users")
    op.drop_index("ix_users_college_id", table_name="users")
    op.drop_constraint("fk_users_department_id", "users", type_="foreignkey")
    op.drop_constraint("fk_users_college_id", "users", type_="foreignkey")
    op.drop_column("users", "department_id")
    op.drop_column("users", "college_id")
    op.drop_index("ix_departments_is_active", table_name="departments")
    op.drop_index("ix_departments_college_id", table_name="departments")
    op.drop_table("departments")
