"""
Admin API router — review queue, verification decisions, biometrics reset, analytics, and roster management.
"""

import base64
import os
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, status
from fastapi.responses import FileResponse, Response, RedirectResponse
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin, require_super_admin
from app.models.user import User
from app.models.internship import Internship
from app.schemas.admin import (
    AdminVerificationListResponse,
    AdminRejectRequest,
    AdminActionResponse,
    AdminInternshipListResponse,
    AdminInternshipStatusUpdate,
    AdminCollegeCreate,
    AdminCollegeUpdate,
    AdminAnalyticsSummary,
    AdminRosterUploadResponse,
    PlatformTrendResponse,
)
from app.schemas.college import CollegeResponse
from app.services.admin_service import AdminService
from app.storage import get_storage

router = APIRouter(prefix="/admin", tags=["Admin"])
_storage = get_storage()


@router.get("/verifications", response_model=AdminVerificationListResponse)
async def list_verifications(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
    status_filter: Annotated[str | None, Query(alias="status", description="Status filter: manual_review, verified, rejected, pending, all")] = None,
    search: Annotated[str | None, Query(description="Search by student name, email, or registration number")] = None,
    college_id: Annotated[UUID | None, Query(description="Filter by college UUID")] = None,
    department_id: Annotated[UUID | None, Query(description="Filter by department UUID")] = None,
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
        department_id=department_id,
        page=page,
        page_size=page_size,
        admin_user=current_admin,
    )


@router.get("/verifications/{user_id}/card-image")
async def get_card_image(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Securely stream the student's uploaded physical College ID document image for review.
    If storage ref is a Cloudinary/remote URL, redirects directly to it.
    """
    iv = None
    user = None

    try:
        iv = await AdminService.get_verification_item(db, user_id)
        user = iv.user
    except HTTPException:
        u_res = await db.execute(
            select(User).where(User.id == user_id).options(selectinload(User.profile))
        )
        user = u_res.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User and verification record not found",
            )

    storage_ref = None
    if iv:
        storage_ref = iv.college_id_storage_ref
    if not storage_ref and user:
        profile = user.__dict__.get("profile")
        if profile and hasattr(profile, "college_id_path"):
            storage_ref = profile.college_id_path

    if storage_ref:
        # Check if remote URL (e.g. Cloudinary)
        if storage_ref.startswith(("http://", "https://")):
            return RedirectResponse(url=storage_ref)

        # Check if base64 data URL
        if storage_ref.startswith("data:image/"):
            try:
                header, encoded = storage_ref.split(",", 1)
                media_type = header.split(";")[0].replace("data:", "")
                return Response(
                    content=base64.b64decode(encoded),
                    media_type=media_type,
                    headers={"Cache-Control": "no-cache"},
                )
            except Exception:
                pass

        # Local file resolution via storage provider
        abs_path = _storage.get_abs_path(storage_ref)
        if abs_path and os.path.exists(abs_path) and os.path.isfile(abs_path):
            ext = os.path.splitext(abs_path)[1].lower()
            media_type = "image/jpeg"
            if ext == ".png":
                media_type = "image/png"
            elif ext == ".webp":
                media_type = "image/webp"
            elif ext == ".pdf":
                media_type = "application/pdf"
            elif ext == ".svg":
                media_type = "image/svg+xml"
            return FileResponse(
                abs_path,
                media_type=media_type,
                headers={"Cache-Control": "no-cache"},
            )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Physical college ID card image not found on storage node. Please upload using Cloudinary.",
    )


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


@router.post("/verifications/{user_id}/force-verify", response_model=AdminActionResponse)
async def force_verify_student(
    user_id: UUID,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Admin directly forces overall student verification to verified.
    """
    client_ip = request.client.host if request.client else None
    return await AdminService.force_verify_student(
        db=db,
        user_id=user_id,
        admin_user=current_admin,
        ip_address=client_ip,
    )


@router.get("/internships", response_model=AdminInternshipListResponse)
async def list_admin_internships(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
    stage: Annotated[str | None, Query(description="Filter by verification stage")] = None,
    status_filter: Annotated[str | None, Query(alias="status", description="Filter by status: pending, verified, rejected, all")] = None,
    search: Annotated[str | None, Query(description="Search by company, role, or student details")] = None,
    college_id: Annotated[UUID | None, Query(description="Filter by student college UUID")] = None,
    page: Annotated[int, Query(ge=1, description="Page number")] = 1,
    page_size: Annotated[int, Query(ge=1, le=100, description="Page size")] = 20,
):
    """
    List all student registered internships across the platform for admin verification and review.
    """
    return await AdminService.list_internships(
        db=db,
        stage=stage,
        status_filter=status_filter,
        search=search,
        college_id=college_id,
        page=page,
        page_size=page_size,
        admin_user=current_admin,
    )


@router.patch("/internships/{internship_id}/status", response_model=AdminActionResponse)
async def update_internship_verification_status(
    internship_id: UUID,
    body: AdminInternshipStatusUpdate,
    request: Request,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Admin updates an internship's verification stage (submitted -> tp_review -> mentor_review -> verified/rejected).
    """
    client_ip = request.client.host if request.client else None
    return await AdminService.update_internship_verification(
        db=db,
        internship_id=internship_id,
        stage=body.verification_stage,
        status=body.status,
        rejection_reason=body.rejection_reason,
        admin_user=current_admin,
        ip_address=client_ip,
    )


@router.get("/internships/{internship_id}/proof")
async def get_internship_proof(
    internship_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Stream the student's uploaded offer letter or email proof for admin review.
    """
    stmt = select(Internship).where(Internship.id == internship_id)
    res = await db.execute(stmt)
    internship = res.scalar_one_or_none()
    if not internship or not internship.offer_letter_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No offer letter document attached to this internship.",
        )

    url = internship.offer_letter_url
    if "ref=" in url:
        ref = url.split("ref=")[-1].split("&")[0]
    else:
        ref = url

    abs_path = _storage.get_abs_path(ref)
    if not os.path.exists(abs_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document file not found on storage disk.",
        )

    ext = os.path.splitext(abs_path)[1].lower()
    media_type = "application/pdf" if ext == ".pdf" else "image/png" if ext == ".png" else "image/jpeg"
    return FileResponse(abs_path, media_type=media_type)


@router.get("/analytics/summary", response_model=AdminAnalyticsSummary)
async def get_analytics_summary(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Retrieve verification KPIs and metrics for the admin dashboard.
    """
    return await AdminService.get_analytics_summary(db, current_admin)


@router.get("/analytics/trends", response_model=PlatformTrendResponse)
async def get_platform_trends(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
    period: Annotated[str, Query(description="Time period: today, monthly, yearly, all")] = "monthly",
):
    """
    Retrieve platform trend data for user registrations, logins, and college creations.
    """
    return await AdminService.get_platform_trends(db, period)


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
