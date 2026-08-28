"""
Authentication API routes.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_optional_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthStatusResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResendVerificationRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserBrief,
    VerifyEmailRequest,
)
from app.services.auth_service import (
    AuthError,
    forgot_password,
    get_auth_status,
    login_user,
    logout,
    logout_all,
    refresh_tokens,
    register_user,
    resend_verification,
    reset_password,
    verify_email,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ---------------------------------------------------------------------------
# Auth status
# ---------------------------------------------------------------------------

@router.get("/status", response_model=AuthStatusResponse)
async def auth_status(
    user: Annotated[User | None, Depends(get_optional_user)],
):
    """Check current authentication status."""
    return await get_auth_status(user)


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    body: RegisterRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Register a new user account."""
    try:
        user = await register_user(
            db,
            name=body.name,
            email=body.email,
            registration_number=body.registration_number,
            mobile_number=body.mobile_number,
            password=body.password,
        )
        # Also log them in immediately
        return await login_user(db, email=body.email, password=body.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Log in with email and password."""
    try:
        return await login_user(db, email=body.email, password=body.password)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ---------------------------------------------------------------------------
# Refresh
# ---------------------------------------------------------------------------

@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Rotate refresh token and issue new access token."""
    try:
        return await refresh_tokens(db, raw_refresh_token=body.refresh_token)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

@router.post("/logout", response_model=MessageResponse)
async def logout_route(
    body: RefreshRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Logout — revoke the provided refresh token."""
    await logout(db, raw_refresh_token=body.refresh_token)
    return MessageResponse(message="Logged out successfully")


@router.post("/logout-all", response_model=MessageResponse)
async def logout_all_route(
    db: Annotated[AsyncSession, Depends(get_db)],
    user: Annotated[User, Depends(get_current_active_user)],
):
    """Logout from all sessions — revoke all refresh tokens."""
    await logout_all(db, user_id=user.id)
    return MessageResponse(message="All sessions terminated")


# ---------------------------------------------------------------------------
# Email verification
# ---------------------------------------------------------------------------

@router.post("/verify-email", response_model=MessageResponse)
async def verify_email_route(
    body: VerifyEmailRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Verify email using a one-time token."""
    try:
        await verify_email(db, token=body.token)
        return MessageResponse(message="Email verified successfully")
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification_route(
    body: ResendVerificationRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Resend email verification token."""
    await resend_verification(db, email=body.email)
    return MessageResponse(message="If an account exists, a verification email has been sent")


# ---------------------------------------------------------------------------
# Password reset
# ---------------------------------------------------------------------------

@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password_route(
    body: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Request a password reset token."""
    await forgot_password(db, email=body.email)
    return MessageResponse(message="If an account exists, a reset email has been sent")


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password_route(
    body: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Reset password using a one-time token."""
    try:
        await reset_password(db, token=body.token, new_password=body.new_password)
        return MessageResponse(message="Password reset successfully")
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
