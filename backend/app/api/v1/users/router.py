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
from app.schemas.user import UserResponse
from app.services.auth_service import AuthError
from app.services import profile_service
from app.storage.local import LocalStorage

router = APIRouter(prefix="/users", tags=["Users"])

_storage = LocalStorage()


# ---------------------------------------------------------------------------
# Current user
# ---------------------------------------------------------------------------

@router.get("/me", response_model=UserResponse)
async def get_me(
    user: Annotated[User, Depends(get_current_active_user)],
):
    """Get the currently authenticated user."""
    return user


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
