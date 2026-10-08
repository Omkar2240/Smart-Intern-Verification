"""Add shift timings to internships, fields to attendance_records, and create shift_tasks table

Revision ID: 008_add_shift_timings_and_tasks
Revises: 007_add_last_login
Create Date: 2026-10-09

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision: str = "008_add_shift_timings_and_tasks"
down_revision: Union[str, None] = "007_add_last_login"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    # 1. Ensure 'internships' table exists and has shift columns
    if not insp.has_table("internships"):
        op.create_table(
            "internships",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("company_name", sa.String(255), nullable=False),
            sa.Column("role", sa.String(255), nullable=False),
            sa.Column("department", sa.String(255), nullable=True),
            sa.Column("internship_type", sa.String(50), server_default="on_site", nullable=False),
            sa.Column("location", sa.String(512), nullable=True),
            sa.Column("supervisor_name", sa.String(255), nullable=True),
            sa.Column("supervisor_email", sa.String(320), nullable=True),
            sa.Column("supervisor_phone", sa.String(50), nullable=True),
            sa.Column("start_date", sa.String(50), nullable=True),
            sa.Column("end_date", sa.String(50), nullable=True),
            sa.Column("stipend", sa.String(100), nullable=True),
            sa.Column("offer_letter_url", sa.String(512), nullable=True),
            sa.Column("shift_start_time", sa.String(10), nullable=True),
            sa.Column("shift_end_time", sa.String(10), nullable=True),
            sa.Column("actual_hours_per_day", sa.Float(), nullable=True, server_default="8.0"),
            sa.Column("verification_stage", sa.String(50), server_default="submitted", nullable=False),
            sa.Column("status", sa.String(50), server_default="pending", nullable=False),
            sa.Column("rejection_reason", sa.String(512), nullable=True),
            sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_internships_user_id", "internships", ["user_id"])
        op.create_index("ix_internships_status", "internships", ["status"])
    else:
        internship_cols = [c["name"] for c in insp.get_columns("internships")]
        if "shift_start_time" not in internship_cols:
            op.add_column("internships", sa.Column("shift_start_time", sa.String(10), nullable=True))
        if "shift_end_time" not in internship_cols:
            op.add_column("internships", sa.Column("shift_end_time", sa.String(10), nullable=True))
        if "actual_hours_per_day" not in internship_cols:
            op.add_column("internships", sa.Column("actual_hours_per_day", sa.Float(), nullable=True, server_default="8.0"))

    # 2. Add verification mode and task counters to 'attendance_records'
    if insp.has_table("attendance_records"):
        att_cols = [c["name"] for c in insp.get_columns("attendance_records")]
        if "work_mode" not in att_cols:
            op.add_column("attendance_records", sa.Column("work_mode", sa.String(20), server_default="offline", nullable=False))
        if "location_verified" not in att_cols:
            op.add_column("attendance_records", sa.Column("location_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False))
        if "face_verified" not in att_cols:
            op.add_column("attendance_records", sa.Column("face_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False))
        if "check_in_lat" not in att_cols:
            op.add_column("attendance_records", sa.Column("check_in_lat", sa.Float(), nullable=True))
        if "check_in_lng" not in att_cols:
            op.add_column("attendance_records", sa.Column("check_in_lng", sa.Float(), nullable=True))
        if "digital_task_type" not in att_cols:
            op.add_column("attendance_records", sa.Column("digital_task_type", sa.String(50), nullable=True))
        if "digital_task_proof" not in att_cols:
            op.add_column("attendance_records", sa.Column("digital_task_proof", sa.String(2048), nullable=True))
        if "tasks_assigned_count" not in att_cols:
            op.add_column("attendance_records", sa.Column("tasks_assigned_count", sa.Integer(), server_default="0", nullable=False))
        if "tasks_completed_count" not in att_cols:
            op.add_column("attendance_records", sa.Column("tasks_completed_count", sa.Integer(), server_default="0", nullable=False))
        if "admin_requested_check" not in att_cols:
            op.add_column("attendance_records", sa.Column("admin_requested_check", sa.Boolean(), server_default=sa.text("false"), nullable=False))

    # 3. Create 'shift_tasks' table
    if not insp.has_table("shift_tasks"):
        op.create_table(
            "shift_tasks",
            sa.Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
            sa.Column("attendance_id", UUID(as_uuid=True), sa.ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False),
            sa.Column("student_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
            sa.Column("requested_by_admin_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("trigger_source", sa.String(30), server_default="automated_shift_task", nullable=False),
            sa.Column("task_number", sa.Integer(), server_default="1", nullable=False),
            sa.Column("task_type", sa.String(50), server_default="workstation_check", nullable=False),
            sa.Column("prompt", sa.Text(), nullable=False),
            sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("status", sa.String(20), server_default="pending", nullable=False),
            sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("submission_payload", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        )
        op.create_index("ix_shift_tasks_attendance_id", "shift_tasks", ["attendance_id"])
        op.create_index("ix_shift_tasks_student_id", "shift_tasks", ["student_id"])
        op.create_index("ix_shift_tasks_status", "shift_tasks", ["status"])


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if insp.has_table("shift_tasks"):
        op.drop_table("shift_tasks")

    if insp.has_table("attendance_records"):
        att_cols = [c["name"] for c in insp.get_columns("attendance_records")]
        for col in [
            "admin_requested_check",
            "tasks_completed_count",
            "tasks_assigned_count",
            "digital_task_proof",
            "digital_task_type",
            "check_in_lng",
            "check_in_lat",
            "face_verified",
            "location_verified",
            "work_mode",
        ]:
            if col in att_cols:
                op.drop_column("attendance_records", col)

    if insp.has_table("internships"):
        internship_cols = [c["name"] for c in insp.get_columns("internships")]
        for col in ["actual_hours_per_day", "shift_end_time", "shift_start_time"]:
            if col in internship_cols:
                op.drop_column("internships", col)
