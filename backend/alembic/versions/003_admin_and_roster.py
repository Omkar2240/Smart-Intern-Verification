"""Admin RBAC, audit logs, and college student rosters

Revision ID: 003_admin_and_roster
Revises: 002_identity_verification
Create Date: 2026-09-19

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "003_admin_and_roster"
down_revision: Union[str, None] = "002_identity_verification"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add role column to users
    op.add_column(
        "users",
        sa.Column("role", sa.String(50), nullable=False, server_default="student"),
    )
    op.create_index("ix_users_role", "users", ["role"])

    # 2. Create admin_audit_logs table
    op.create_table(
        "admin_audit_logs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("admin_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("details", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_admin_audit_logs_admin_id", "admin_audit_logs", ["admin_id"])
    op.create_index("ix_admin_audit_logs_action", "admin_audit_logs", ["action"])
    op.create_index("ix_admin_audit_logs_target_user_id", "admin_audit_logs", ["target_user_id"])

    # 3. Create college_student_rosters table
    op.create_table(
        "college_student_rosters",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column("college_id", UUID(as_uuid=True), sa.ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False),
        sa.Column("student_name", sa.String(255), nullable=False),
        sa.Column("registration_number", sa.String(100), nullable=False),
        sa.Column("email", sa.String(320), nullable=True),
        sa.Column("department", sa.String(100), nullable=True),
        sa.Column("is_claimed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("claimed_by_user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint("college_id", "registration_number", name="uq_college_registration"),
    )
    op.create_index("ix_college_student_rosters_college_id", "college_student_rosters", ["college_id"])
    op.create_index("ix_college_student_rosters_registration_number", "college_student_rosters", ["registration_number"])

    # 4. Seed default super admin account
    users_table = sa.table(
        "users",
        sa.column("id", UUID(as_uuid=True)),
        sa.column("name", sa.String),
        sa.column("email", sa.String),
        sa.column("registration_number", sa.String),
        sa.column("mobile_number", sa.String),
        sa.column("password_hash", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("is_verified", sa.Boolean),
        sa.column("role", sa.String),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )
    op.execute(
        users_table.insert().values(
            id=uuid.uuid4(),
            name="Super Administrator",
            email="admin@trackintern.com",
            registration_number="ADMIN001",
            mobile_number="9999999999",
            password_hash="$argon2id$v=19$m=65536,t=3,p=4$FfDWqMWv0j5g2eGjif+n6g$hlWnv8Ew3nfwPc35aUjYdv+UcI3xAhtWeKp1qh4KevQ",
            is_active=True,
            is_verified=True,
            role="super_admin",
            created_at=sa.func.now(),
            updated_at=sa.func.now(),
        )
    )


def downgrade() -> None:
    op.drop_table("college_student_rosters")
    op.drop_table("admin_audit_logs")
    op.drop_index("ix_users_role", table_name="users")
    op.drop_column("users", "role")
