"""
Colleges API routes.
"""

from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.college import College
from app.schemas.college import CollegeResponse

router = APIRouter(prefix="/colleges", tags=["Colleges"])


@router.get("", response_model=List[CollegeResponse])
async def list_colleges(
    db: Annotated[AsyncSession, Depends(get_db)],
    search: Annotated[str | None, Query(description="Search colleges by name, city, or code")] = None,
):
    """
    List active colleges, with optional search filtering.
    """
    stmt = select(College).where(College.is_active.is_(True))

    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(
            (College.name.ilike(term))
            | (College.city.ilike(term))
            | (College.code.ilike(term))
        )

    stmt = stmt.order_by(College.name.asc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{college_id}", response_model=CollegeResponse)
async def get_college(
    college_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get college details by UUID.
    """
    stmt = select(College).where(College.id == college_id, College.is_active.is_(True))
    result = await db.execute(stmt)
    college = result.scalar_one_or_none()

    if not college:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College not found",
        )

    return college
