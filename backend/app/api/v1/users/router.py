"""
User & profile API routes.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.profile import ProfileCreate, ProfileResponse, ProfileUpdate
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.auth import ChangePasswordRequest, MessageResponse
from app.services.auth_service import AuthError, change_password, update_user_profile
from app.services import profile_service
from app.storage import get_storage

router = APIRouter(prefix="/users", tags=["Users"])

_storage = get_storage()


# ---------------------------------------------------------------------------
# Current user
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
async def get_me(
    user: Annotated[User, Depends(get_current_active_user)],
):
    """Get the currently authenticated user."""
    return user


@router.patch("/me", response_model=UserResponse)
async def update_me(
    body: UserUpdate,
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update the authenticated user's editable profile fields."""
    try:
        return await update_user_profile(
            db, user=user, name=body.name, email=body.email
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/me/change-password", response_model=MessageResponse)
async def change_my_password(
    body: ChangePasswordRequest,
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Change the authenticated user's password and revoke existing sessions."""
    try:
        await change_password(
            db,
            user=user,
            current_password=body.current_password,
            new_password=body.new_password,
        )
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
    return MessageResponse(message="Password changed successfully")


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

@router.get("/me/profile", response_model=ProfileResponse)
async def get_profile(
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get the authenticated user's student profile."""
    profile = await profile_service.get_profile(db, user_id=user.id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse.from_model(profile)


@router.post("/me/profile", response_model=ProfileResponse, status_code=201)
async def create_profile(
    body: ProfileCreate,
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a student profile for the authenticated user."""
    try:
        profile = await profile_service.create_profile(
            db,
            user_id=user.id,
            college=body.college,
            branch=body.branch,
            roll_number=body.roll_number,
        )
        return ProfileResponse.from_model(profile)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.patch("/me/profile", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdate,
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update the authenticated user's student profile."""
    try:
        profile = await profile_service.update_profile(
            db,
            user_id=user.id,
            college=body.college,
            branch=body.branch,
            roll_number=body.roll_number,
        )
        return ProfileResponse.from_model(profile)
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


# ---------------------------------------------------------------------------
# College ID upload
# ---------------------------------------------------------------------------

@router.post("/me/profile/college-id", response_model=ProfileResponse)
async def upload_college_id(
    file: UploadFile = File(...),
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """Upload a college ID document (PDF, PNG, JPG/JPEG)."""
    if not file.content_type:
        raise HTTPException(status_code=400, detail="File type not specified")

    try:
        content = await file.read()
        storage_ref = await _storage.save_file(content, file.content_type)
        profile = await profile_service.set_college_id_path(
            db,
            user_id=user.id,
            storage_ref=storage_ref,
        )
        return ProfileResponse.from_model(profile)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except AuthError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
