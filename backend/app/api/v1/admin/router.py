"""
Admin API router — review queue, verification decisions, biometrics reset, analytics, and roster management.
"""

import os
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin, require_super_admin
from app.models.user import User
from app.schemas.admin import (
    AdminVerificationListResponse,
    AdminRejectRequest,
    AdminActionResponse,
    AdminCollegeCreate,
    AdminCollegeUpdate,
    AdminAnalyticsSummary,
    AdminRosterUploadResponse,
)
from app.schemas.college import CollegeResponse
from app.services.admin_service import AdminService
from app.storage.local import LocalStorage

router = APIRouter(prefix="/admin", tags=["Admin"])
_storage = LocalStorage()


@router.get("/verifications", response_model=AdminVerificationListResponse)
async def list_verifications(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
    status_filter: Annotated[str | None, Query(alias="status", description="Status filter: manual_review, verified, rejected, pending, all")] = None,
    search: Annotated[str | None, Query(description="Search by student name, email, or registration number")] = None,
    college_id: Annotated[UUID | None, Query(description="Filter by college UUID")] = None,
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Page size")] = 20,
):
    """
    List student identity verifications with advanced filtering for the Admin Review Queue.
    """
    return await AdminService.list_verifications(
        db=db,
        status_filter=status_filter,
        search=search,
        college_id=college_id,
        page=page,
        page_size=page_size,
    )


@router.get("/verifications/{user_id}/card-image")
async def get_card_image(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Securely stream the student's uploaded physical College ID document image for review.
    """
    iv = await AdminService.get_verification_item(db, user_id)
    if not iv.college_id_storage_ref:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No college ID image uploaded for this user",
        )

    abs_path = _storage.get_abs_path(iv.college_id_storage_ref)
    if not os.path.exists(abs_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="College ID image file not found on storage disk",
        )

    ext = os.path.splitext(abs_path)[1].lower()
    media_type = "image/jpeg"
    if ext == ".png":
        media_type = "image/png"
    elif ext == ".pdf":
        media_type = "application/pdf"

    return FileResponse(abs_path, media_type=media_type)


@router.post("/verifications/{user_id}/approve", response_model=AdminActionResponse)
async def approve_verification(
    user_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Admin manually approves a student's College ID document.
    """
    client_ip = request.client.host if request.client else None
    return await AdminService.approve_verification(
        db=db,
        user_id=user_id,
        admin_user=current_admin,
        ip_address=client_ip,
    )


@router.post("/verifications/{user_id}/reject", response_model=AdminActionResponse)
async def reject_verification(
    user_id: UUID,
    body: AdminRejectRequest,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Admin rejects a student's verification with an explicit rejection reason.
    """
    client_ip = request.client.host if request.client else None
    return await AdminService.reject_verification(
        db=db,
        user_id=user_id,
        reason=body.reason,
        admin_user=current_admin,
        ip_address=client_ip,
    )


@router.post("/verifications/{user_id}/reset-biometrics", response_model=AdminActionResponse)
async def reset_biometrics(
    user_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Admin resets a student's facial biometric enrollment so they can re-enroll.
    """
    client_ip = request.client.host if request.client else None
    return await AdminService.reset_biometrics(
        db=db,
        user_id=user_id,
        admin_user=current_admin,
        ip_address=client_ip,
    )


@router.get("/analytics/summary", response_model=AdminAnalyticsSummary)
async def get_analytics_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Retrieve verification KPIs and metrics for the admin dashboard.
    """
    return await AdminService.get_analytics_summary(db)


@router.post("/colleges", response_model=CollegeResponse, status_code=status.HTTP_201_CREATED)
async def create_college(
    data: AdminCollegeCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Create a new college organization.
    """
    return await AdminService.create_college(db, data)


@router.put("/colleges/{college_id}", response_model=CollegeResponse)
async def update_college(
    college_id: UUID,
    data: AdminCollegeUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Update an existing college organization's details.
    """
    return await AdminService.update_college(db, college_id, data)


@router.post("/colleges/{college_id}/roster/upload", response_model=AdminRosterUploadResponse)
async def upload_roster(
    college_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
    file: UploadFile = File(...),
):
    """
    Bulk import student roster entries for automated registration number validation.
    """
    content = await file.read()
    return await AdminService.import_roster_csv(
        db=db,
        college_id=college_id,
        file_bytes=content,
    )
