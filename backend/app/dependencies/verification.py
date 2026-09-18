"""
Identity Verification Dependency & Access Control Guard.
"""

from typing import Annotated
from fastapi import Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.identity_verification import IdentityVerification
from app.models.user import User


class IdentityVerificationRequiredException(HTTPException):
    def __init__(self, message: str = "Identity verification required"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=message,
        )
        self.code = "IDENTITY_VERIFICATION_REQUIRED"


async def require_identity_verified(
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    FastAPI dependency ensuring the authenticated user has completed identity verification.
    If not verified, raises IdentityVerificationRequiredException (403 Forbidden).
    """
    stmt = select(IdentityVerification).where(IdentityVerification.user_id == user.id)
    res = await db.execute(stmt)
    verif = res.scalar_one_or_none()

    if not verif or verif.overall_status != "verified":
        raise IdentityVerificationRequiredException()

    return user
