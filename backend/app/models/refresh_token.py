"""
Refresh token model — stores hashed refresh tokens for session management.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, UUIDMixin


class RefreshToken(Base, UUIDMixin):
    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="refresh_tokens")

    @property
    def is_expired(self) -> bool:
        from datetime import timezone
        now = datetime.now(timezone.utc)
        expires = self.expires_at
        # SQLite returns naive datetimes — treat as UTC
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return now > expires

    @property
    def is_revoked(self) -> bool:
        return self.revoked_at is not None

    def __repr__(self) -> str:
        return f"<RefreshToken user_id={self.user_id}>"
