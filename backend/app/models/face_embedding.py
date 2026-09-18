"""
Face Embedding model — stores biometric vector representations for identity verification & attendance.
"""

import uuid

from sqlalchemy import Boolean, Float, ForeignKey, Integer, LargeBinary, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class FaceEmbedding(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "face_embeddings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    model_name: Mapped[str] = mapped_column(String(50), default="ArcFace", nullable=False)
    model_version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    embedding: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    dimension: Mapped[int] = mapped_column(Integer, default=512, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Relationships
    user = relationship("User", back_populates="face_embeddings")

    def __repr__(self) -> str:
        return f"<FaceEmbedding user_id={self.user_id} model={self.model_name} active={self.is_active}>"
