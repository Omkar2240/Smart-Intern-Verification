"""
User model — core identity table.
"""

import uuid
from typing import Optional

from sqlalchemy import Boolean, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin
from app.core.constants import DEFAULT_USER_ROLE


class User(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "users"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    registration_number: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    mobile_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    role: Mapped[str] = mapped_column(String(50), default=DEFAULT_USER_ROLE, nullable=False, index=True)
    college_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(), ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True, index=True
    )
    department_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        Uuid(), ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relationships
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    verification_tokens = relationship("VerificationToken", back_populates="user", cascade="all, delete-orphan")
    identity_verification = relationship("IdentityVerification", back_populates="user", uselist=False, cascade="all, delete-orphan")
    face_embeddings = relationship("FaceEmbedding", back_populates="user", cascade="all, delete-orphan")
    internships = relationship("Internship", back_populates="user", cascade="all, delete-orphan")
    college = relationship("College", back_populates="users", foreign_keys=[college_id])
    department = relationship("Department", back_populates="users", foreign_keys=[department_id])

    def __repr__(self) -> str:
        return f"<User {self.email}>"
