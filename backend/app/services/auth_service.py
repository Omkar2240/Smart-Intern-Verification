"""
Authentication service — all auth business logic.
"""

import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.models.verification_token import VerificationToken
from app.schemas.auth import (
    AuthStatusResponse,
    TokenResponse,
    UserBrief,
)
from app.services.email_service import send_password_reset_email, send_verification_email


class AuthError(Exception):
    """Raised for authentication-related errors."""

    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

async def register_user(
    db: AsyncSession,
    *,
    name: str,
    email: str,
    registration_number: str,
    mobile_number: str,
    password: str,
) -> User:
    """Register a new user. Raises AuthError on duplicate fields."""
    # Normalize email
    email = email.lower().strip()

    # Check uniqueness
    existing = await db.execute(
        select(User).where(
            (User.email == email)
            | (User.registration_number == registration_number)
            | (User.mobile_number == mobile_number)
        )
    )
    existing_user = existing.scalar_one_or_none()
    if existing_user:
        if existing_user.email == email:
            raise AuthError("Email is already registered", 409)
        if existing_user.registration_number == registration_number:
            raise AuthError("Registration number is already in use", 409)
        if existing_user.mobile_number == mobile_number:
            raise AuthError("Mobile number is already in use", 409)

    # Create user
    user = User(
        name=name.strip(),
        email=email,
        registration_number=registration_number.strip(),
        mobile_number=mobile_number.strip(),
        password_hash=hash_password(password),
    )
    db.add(user)
    await db.flush()

    # Create email verification token
    raw_token = secrets.token_urlsafe(48)
    vt = VerificationToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        token_type="email_verify",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        created_at=datetime.now(timezone.utc),
    )
    db.add(vt)
    await db.flush()

    # Send verification email (dev mode: logs to console)
    await send_verification_email(email, raw_token)

    return user


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

async def login_user(
    db: AsyncSession,
    *,
    email: str,
    password: str,
) -> TokenResponse:
    """Authenticate a user and return access + refresh tokens."""
    email = email.lower().strip()

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Generic error — never reveal whether account exists
    if not user or not verify_password(password, user.password_hash):
        raise AuthError("Invalid email or password", 401)

    if not user.is_active:
        raise AuthError("Account is deactivated", 403)

    return await _issue_tokens(db, user)


# ---------------------------------------------------------------------------
# Token management
# ---------------------------------------------------------------------------

async def _issue_tokens(db: AsyncSession, user: User) -> TokenResponse:
    """Create a fresh access + refresh token pair for a user."""
    access_token = create_access_token(user.id)
    raw_refresh, refresh_hash = create_refresh_token()

    rt = RefreshToken(
        user_id=user.id,
        token_hash=refresh_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        created_at=datetime.now(timezone.utc),
    )
    db.add(rt)
    await db.flush()

    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserBrief.model_validate(user),
    )


async def refresh_tokens(
    db: AsyncSession,
    *,
    raw_refresh_token: str,
) -> TokenResponse:
    """
    Rotate a refresh token:
    1. Validate the old token (not expired, not revoked)
    2. Revoke the old token
    3. Issue new access + refresh tokens
    """
    token_hash = hash_token(raw_refresh_token)

    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    rt = result.scalar_one_or_none()

    if not rt:
        raise AuthError("Invalid refresh token", 401)
    if rt.is_revoked:
        # Potential token reuse attack — revoke ALL tokens for this user
        await _revoke_all_user_tokens(db, rt.user_id)
        raise AuthError("Refresh token has been revoked — all sessions invalidated", 401)
    if rt.is_expired:
        raise AuthError("Refresh token has expired", 401)

    # Revoke old token
    rt.revoked_at = datetime.now(timezone.utc)

    # Load user
    user_result = await db.execute(select(User).where(User.id == rt.user_id))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise AuthError("Account not found or deactivated", 401)

    return await _issue_tokens(db, user)


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

async def logout(db: AsyncSession, *, raw_refresh_token: str) -> None:
    """Revoke a single refresh token."""
    token_hash = hash_token(raw_refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    rt = result.scalar_one_or_none()
    if rt and not rt.is_revoked:
        rt.revoked_at = datetime.now(timezone.utc)


async def logout_all(db: AsyncSession, *, user_id: UUID) -> None:
    """Revoke all refresh tokens for a user."""
    await _revoke_all_user_tokens(db, user_id)


async def _revoke_all_user_tokens(db: AsyncSession, user_id: UUID) -> None:
    """Internal: revoke all active refresh tokens for a user."""
    now = datetime.now(timezone.utc)
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=now)
    )


# ---------------------------------------------------------------------------
# Auth status
# ---------------------------------------------------------------------------

async def get_auth_status(user: User | None) -> AuthStatusResponse:
    """Return current authentication status."""
    if user:
        return AuthStatusResponse(
            authenticated=True,
            user=UserBrief.model_validate(user),
        )
    return AuthStatusResponse(authenticated=False, user=None)


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------

async def verify_email(db: AsyncSession, *, token: str) -> None:
    """Verify a user's email using a one-time token."""
    token_hash = hash_token(token)
    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.token_hash == token_hash,
            VerificationToken.token_type == "email_verify",
        )
    )
    vt = result.scalar_one_or_none()

    if not vt:
        raise AuthError("Invalid verification token", 400)
    if vt.is_used:
        raise AuthError("Token has already been used", 400)
    if vt.is_expired:
        raise AuthError("Token has expired", 400)

    # Mark token as used
    vt.used_at = datetime.now(timezone.utc)

    # Mark user as verified
    user_result = await db.execute(select(User).where(User.id == vt.user_id))
    user = user_result.scalar_one_or_none()
    if user:
        user.is_verified = True


async def resend_verification(db: AsyncSession, *, email: str) -> None:
    """Generate and send a new email verification token."""
    email = email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Always return success to not reveal whether account exists
    if not user:
        return
    if user.is_verified:
        return

    raw_token = secrets.token_urlsafe(48)
    vt = VerificationToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        token_type="email_verify",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        created_at=datetime.now(timezone.utc),
    )
    db.add(vt)
    await db.flush()

    await send_verification_email(email, raw_token)


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------

async def forgot_password(db: AsyncSession, *, email: str) -> None:
    """Generate and send a password reset token."""
    email = email.lower().strip()
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    # Always return success
    if not user:
        return

    raw_token = secrets.token_urlsafe(48)
    vt = VerificationToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        token_type="password_reset",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
        created_at=datetime.now(timezone.utc),
    )
    db.add(vt)
    await db.flush()

    await send_password_reset_email(email, raw_token)


async def reset_password(db: AsyncSession, *, token: str, new_password: str) -> None:
    """Reset a user's password using a one-time token."""
    token_hash = hash_token(token)
    result = await db.execute(
        select(VerificationToken).where(
            VerificationToken.token_hash == token_hash,
            VerificationToken.token_type == "password_reset",
        )
    )
    vt = result.scalar_one_or_none()

    if not vt:
        raise AuthError("Invalid reset token", 400)
    if vt.is_used:
        raise AuthError("Token has already been used", 400)
    if vt.is_expired:
        raise AuthError("Token has expired", 400)

    # Mark token as used
    vt.used_at = datetime.now(timezone.utc)

    # Update password
    user_result = await db.execute(select(User).where(User.id == vt.user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        raise AuthError("User not found", 400)

    user.password_hash = hash_password(new_password)

    # Invalidate all existing sessions
    await _revoke_all_user_tokens(db, user.id)
