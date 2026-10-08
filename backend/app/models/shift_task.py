"""
Shift Task model — tracks compliance and surprise checks during an active shift.
"""
import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class ShiftTask(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "shift_tasks"

    attendance_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("attendance_records.id", ondelete="CASCADE"), nullable=False, index=True
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    requested_by_admin_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    trigger_source: Mapped[str] = mapped_column(String(30), default="automated_shift_task", nullable=False)
    task_number: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    task_type: Mapped[str] = mapped_column(String(50), default="workstation_check", nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)

    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)

    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submission_payload: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    attendance = relationship("AttendanceRecord", backref="shift_tasks")
    student = relationship("User", foreign_keys=[student_id])
    requested_by_admin = relationship("User", foreign_keys=[requested_by_admin_id])
