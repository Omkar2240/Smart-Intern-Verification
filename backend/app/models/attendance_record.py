"""Attendance records captured by verified students."""

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.core.constants import ATTENDANCE_STATUSES


class AttendanceRecord(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("student_id", "date", name="uq_attendance_student_date"),
    )

    student_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    company_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    check_in: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    check_out: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=ATTENDANCE_STATUSES[0]
    )

    # Verification Mode and Proof Details
    work_mode: Mapped[str] = mapped_column(String(20), default="offline", nullable=False)  # "offline" or "online"
    location_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    face_verified: Mapped[bool] = mapped_column(default=False, nullable=False)
    check_in_lat: Mapped[float | None] = mapped_column(nullable=True)
    check_in_lng: Mapped[float | None] = mapped_column(nullable=True)

    # Digital / Remote Proof (Online Mode)
    digital_task_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # "sprint_goal", "github_commit", "ide_screenshot"
    digital_task_proof: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    # Compliance Task Counters & Admin Flags
    tasks_assigned_count: Mapped[int] = mapped_column(default=0, nullable=False)
    tasks_completed_count: Mapped[int] = mapped_column(default=0, nullable=False)
    admin_requested_check: Mapped[bool] = mapped_column(default=False, nullable=False)

    student = relationship("User")

