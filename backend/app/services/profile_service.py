"""
Student profile service — CRUD + college ID upload.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.student_profile import StudentProfile
from app.services.auth_service import AuthError


async def get_profile(db: AsyncSession, *, user_id: UUID) -> StudentProfile | None:
    """Get a user's student profile."""
    result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_profile(
    db: AsyncSession,
    *,
    user_id: UUID,
    college: str,
    branch: str,
    roll_number: str,
) -> StudentProfile:
    """Create a student profile for the authenticated user."""
    # Check if profile already exists
    existing = await get_profile(db, user_id=user_id)
    if existing:
        raise AuthError("Profile already exists. Use PATCH to update.", 409)

    profile = StudentProfile(
        user_id=user_id,
        college=college.strip(),
        branch=branch.strip(),
        roll_number=roll_number.strip(),
    )
    db.add(profile)
    await db.flush()
    return profile


async def update_profile(
    db: AsyncSession,
    *,
    user_id: UUID,
    college: str | None = None,
    branch: str | None = None,
    roll_number: str | None = None,
) -> StudentProfile:
    """Update existing student profile fields."""
    profile = await get_profile(db, user_id=user_id)
    if not profile:
        raise AuthError("Profile not found. Create one first.", 404)

    if college is not None:
        profile.college = college.strip()
    if branch is not None:
        profile.branch = branch.strip()
    if roll_number is not None:
        profile.roll_number = roll_number.strip()

    await db.flush()
    return profile


async def set_college_id_path(
    db: AsyncSession,
    *,
    user_id: UUID,
    storage_ref: str,
) -> StudentProfile:
    """Set the college ID storage reference on the user's profile."""
    profile = await get_profile(db, user_id=user_id)
    if not profile:
        raise AuthError("Profile not found. Create one first.", 404)

    profile.college_id_path = storage_ref
    await db.flush()
    return profile
