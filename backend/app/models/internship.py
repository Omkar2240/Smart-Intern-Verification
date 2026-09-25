"""
Internship model — tracks student internship postings, workplace locations, and multi-stage verification.
"""

import uuid
from sqlalchemy import Boolean, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Internship(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "internships"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    department: Mapped[str | None] = mapped_column(String(255), nullable=True)
    internship_type: Mapped[str] = mapped_column(String(50), default="on_site", nullable=False)
    location: Mapped[str | None] = mapped_column(String(512), nullable=True)

    supervisor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    supervisor_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    supervisor_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)

    start_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    end_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    stipend: Mapped[str | None] = mapped_column(String(100), nullable=True)
    offer_letter_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # Verification workflow stages:
    # "submitted" -> "tp_review" -> "mentor_review" -> "verified" (or "rejected")
    verification_stage: Mapped[str] = mapped_column(String(50), default="submitted", nullable=False)
    # Status: "pending", "verified", "rejected"
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False, index=True)
    rejection_reason: Mapped[str | None] = mapped_column(String(512), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    user = relationship("User", back_populates="internships")

    def __repr__(self) -> str:
        return f"<Internship {self.company_name} - {self.role} ({self.status})>"
