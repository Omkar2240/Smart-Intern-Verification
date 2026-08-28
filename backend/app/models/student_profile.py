"""
Student profile model — one-to-one with User for academic details.
"""

import uuid

from sqlalchemy import ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class StudentProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "student_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    college: Mapped[str] = mapped_column(String(255), nullable=False)
    branch: Mapped[str] = mapped_column(String(255), nullable=False)
    roll_number: Mapped[str] = mapped_column(String(50), nullable=False)
    college_id_path: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Relationships
    user = relationship("User", back_populates="profile")

    def __repr__(self) -> str:
        return f"<StudentProfile user_id={self.user_id}>"
