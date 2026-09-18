"""
College Student Roster model — pre-approved whitelist of enrolled students for automated matching.
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class CollegeStudentRoster(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "college_student_rosters"

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("colleges.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_name: Mapped[str] = mapped_column(String(255), nullable=False)
    registration_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_claimed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    claimed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    college = relationship("College", backref="roster_entries")
    claimed_by_user = relationship("User", foreign_keys=[claimed_by_user_id])

    __table_args__ = (
        UniqueConstraint("college_id", "registration_number", name="uq_college_registration"),
    )

    def __repr__(self) -> str:
        return f"<CollegeStudentRoster {self.registration_number} - {self.student_name}>"
