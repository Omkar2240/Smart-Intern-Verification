"""Department model owned by a college."""

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Department(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "departments"

    college_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(), ForeignKey("colleges.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    hod_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hod_email: Mapped[Optional[str]] = mapped_column(String(320), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)

    college = relationship("College", back_populates="departments")
    users = relationship("User", back_populates="department")

    __table_args__ = (
        UniqueConstraint("college_id", "code", name="uq_department_college_code"),
    )
