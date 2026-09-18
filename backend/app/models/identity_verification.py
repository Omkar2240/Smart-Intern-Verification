"""
Identity Verification model — tracks the onboarding verification pipeline for each user.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, JSON, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class IdentityVerification(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "identity_verifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    college_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(),
        ForeignKey("colleges.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Status tracking per step
    # college_status: "not_started" | "selected"
    college_status: Mapped[str] = mapped_column(String(30), default="not_started", nullable=False)

    # college_id_status: "not_started" | "pending" | "verified" | "rejected" | "manual_review"
    college_id_status: Mapped[str] = mapped_column(String(30), default="not_started", nullable=False)
    college_id_storage_ref: Mapped[str | None] = mapped_column(String(512), nullable=True)
    extracted_metadata: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # face_status: "not_started" | "pending" | "verified" | "rejected"
    face_status: Mapped[str] = mapped_column(String(30), default="not_started", nullable=False)

    # overall_status: "not_started" | "pending" | "verified" | "rejected" | "manual_review"
    overall_status: Mapped[str] = mapped_column(String(30), default="not_started", nullable=False, index=True)

    rejection_reason: Mapped[str | None] = mapped_column(String(512), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="identity_verification")
    college = relationship("College", back_populates="verifications")

    @property
    def is_verified(self) -> bool:
        return self.overall_status == "verified"

    @property
    def current_step(self) -> str:
        if self.college_status != "selected":
            return "college_selection"
        if self.college_id_status not in ("verified", "manual_review"):
            return "college_id"
        if self.face_status != "verified":
            return "face"
        return "completed"

    def __repr__(self) -> str:
        return f"<IdentityVerification user_id={self.user_id} overall_status={self.overall_status}>"
