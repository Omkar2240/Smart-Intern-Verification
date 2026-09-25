"""
Internship API endpoints for students to create, manage, update, and track verification stages.
"""

import os
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user, get_db
from app.models.internship import Internship
from app.models.user import User
from app.schemas.internship import (
    InternshipCreate,
    InternshipResponse,
    InternshipStatusUpdate,
    InternshipUpdate,
)
from app.storage.local import LocalStorage

router = APIRouter(prefix="/internships", tags=["Internships"])
_storage = LocalStorage()


@router.post("/upload-proof")
async def upload_internship_proof(
    file: UploadFile = File(..., description="Offer letter or email proof (PDF, JPEG, PNG)"),
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
):
    """
    Upload offer letter or email proof document (PDF, PNG, JPG).
    Saved to local storage (ready for AWS S3 migration).
    """
    if not file.content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File content type could not be determined.",
        )

    try:
        content = await file.read()
        storage_ref = await _storage.save_file(
            file_content=content,
            content_type=file.content_type,
            subdirectory="offer_letters",
        )
        return {
            "success": True,
            "storage_ref": storage_ref,
            "filename": file.filename,
            "content_type": file.content_type,
            "url": f"/api/v1/internships/proof-file?ref={storage_ref}",
            "file_url": f"/api/v1/internships/proof-file?ref={storage_ref}",
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/proof-file")
async def get_internship_proof_file(
    ref: str | None = None,
    file_path: str | None = None,
    current_user: Annotated[User, Depends(get_current_active_user)] = None,
):
    """
    Download or view stored offer letter / proof document.
    """
    target = ref or file_path
    if not target:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ref or file_path parameter is required.",
        )
    abs_path = _storage.get_abs_path(target)
    if not os.path.exists(abs_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on storage.",
        )
    return FileResponse(abs_path)


@router.get("", response_model=list[InternshipResponse])
async def list_internships(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    List all internships for the authenticated user, sorted by active status and creation date.
    """
    stmt = (
        select(Internship)
        .where(Internship.user_id == current_user.id)
        .order_by(Internship.is_active.desc(), Internship.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/active", response_model=InternshipResponse | None)
async def get_active_internship(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get the currently active internship for the authenticated user.
    """
    stmt = (
        select(Internship)
        .where(Internship.user_id == current_user.id, Internship.is_active == True)
        .order_by(Internship.created_at.desc())
    )
    result = await db.execute(stmt)
    internship = result.scalars().first()
    if not internship:
        # Fall back to latest if none marked active
        fallback_stmt = (
            select(Internship)
            .where(Internship.user_id == current_user.id)
            .order_by(Internship.created_at.desc())
        )
        fb_result = await db.execute(fallback_stmt)
        internship = fb_result.scalars().first()

    return internship


@router.get("/{internship_id}", response_model=InternshipResponse)
async def get_internship(
    internship_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get details of a specific internship by ID.
    """
    stmt = select(Internship).where(
        Internship.id == internship_id,
        Internship.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found.",
        )
    return internship


@router.post("", response_model=InternshipResponse, status_code=status.HTTP_201_CREATED)
async def create_internship(
    body: InternshipCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Create a new internship posting. Sets it as active by default, marking older ones as inactive.
    """
    # Deactivate existing active internships
    await db.execute(
        update(Internship)
        .where(Internship.user_id == current_user.id)
        .values(is_active=False)
    )

    internship = Internship(
        user_id=current_user.id,
        company_name=body.company_name.strip(),
        role=body.role.strip(),
        department=body.department.strip() if body.department else None,
        internship_type=body.internship_type or "on_site",
        location=body.location.strip() if body.location else None,
        supervisor_name=body.supervisor_name.strip() if body.supervisor_name else None,
        supervisor_email=body.supervisor_email.strip() if body.supervisor_email else None,
        supervisor_phone=body.supervisor_phone.strip() if body.supervisor_phone else None,
        start_date=body.start_date,
        end_date=body.end_date,
        stipend=body.stipend.strip() if body.stipend else None,
        offer_letter_url=body.offer_letter_url,
        verification_stage="submitted",
        status="pending",
        is_active=True,
    )

    db.add(internship)
    await db.commit()
    await db.refresh(internship)
    return internship


@router.put("/{internship_id}", response_model=InternshipResponse)
async def update_internship(
    internship_id: UUID,
    body: InternshipUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update internship details.
    """
    stmt = select(Internship).where(
        Internship.id == internship_id,
        Internship.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found.",
        )

    update_data = body.model_dump(exclude_unset=True)

    # If is_active is explicitly set to True, deactivate others
    if update_data.get("is_active") is True:
        await db.execute(
            update(Internship)
            .where(Internship.user_id == current_user.id, Internship.id != internship_id)
            .values(is_active=False)
        )

    for field, val in update_data.items():
        setattr(internship, field, val)

    await db.commit()
    await db.refresh(internship)
    return internship


@router.delete("/{internship_id}", status_code=status.HTTP_200_OK)
async def delete_internship(
    internship_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Delete an internship. If active, makes the most recent remaining internship active.
    """
    stmt = select(Internship).where(
        Internship.id == internship_id,
        Internship.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found.",
        )

    was_active = internship.is_active
    await db.delete(internship)
    await db.commit()

    if was_active:
        remaining_stmt = (
            select(Internship)
            .where(Internship.user_id == current_user.id)
            .order_by(Internship.created_at.desc())
        )
        remaining = await db.execute(remaining_stmt)
        next_active = remaining.scalars().first()
        if next_active:
            next_active.is_active = True
            await db.commit()

    return {"success": True, "message": "Internship deleted successfully."}


@router.post("/{internship_id}/set-active", response_model=InternshipResponse)
async def set_active_internship(
    internship_id: UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Mark this internship as active and set all other internships for this user to inactive.
    """
    stmt = select(Internship).where(
        Internship.id == internship_id,
        Internship.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found.",
        )

    await db.execute(
        update(Internship)
        .where(Internship.user_id == current_user.id)
        .values(is_active=False)
    )

    internship.is_active = True
    await db.commit()
    await db.refresh(internship)
    return internship


@router.patch("/{internship_id}/status", response_model=InternshipResponse)
async def update_internship_verification_status(
    internship_id: UUID,
    body: InternshipStatusUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Update internship verification stage and status (e.g. submitted -> tp_review -> mentor_review -> verified).
    """
    stmt = select(Internship).where(
        Internship.id == internship_id,
        Internship.user_id == current_user.id,
    )
    result = await db.execute(stmt)
    internship = result.scalar_one_or_none()
    if not internship:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Internship not found.",
        )

    internship.verification_stage = body.verification_stage

    if body.status:
        internship.status = body.status
    elif body.verification_stage == "verified":
        internship.status = "verified"
    elif body.verification_stage == "rejected":
        internship.status = "rejected"
    else:
        internship.status = "pending"

    internship.rejection_reason = body.rejection_reason if body.verification_stage == "rejected" else None

    await db.commit()
    await db.refresh(internship)
    return internship
