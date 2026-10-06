"""
College model — managed directory of approved academic institutions.
"""

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.core.constants import DEFAULT_COUNTRY


class College(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "colleges"

    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), default=DEFAULT_COUNTRY, nullable=False)
    code: Mapped[str | None] = mapped_column(String(50), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    # Relationships
    verifications = relationship("IdentityVerification", back_populates="college")

    def __repr__(self) -> str:
        return f"<College {self.name} ({self.code})>"
