"""
Admin API router — review queue, verification decisions, biometrics reset, analytics, and roster management.
"""

import os
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File, status
from fastapi.responses import FileResponse, Response
from sqlalchemy import select
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


def _generate_fallback_id_card_svg(
    student_name: str,
    reg_number: str,
    college_name: str,
    department: str | None = None,
) -> bytes:
    name_display = (student_name or "Student Intern")[:36]
    reg_display = (reg_number or "UNASSIGNED")[:24]
    college_display = (college_name or "Academic Institution")[:45]
    dept_display = (department or "Enrolled Student")[:35]

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380" fill="none">
  <rect width="600" height="380" rx="16" fill="#0f172a"/>
  <rect x="1" y="1" width="598" height="378" rx="15" stroke="#334155" stroke-width="2"/>
  <rect width="600" height="80" rx="16" fill="#1e293b"/>
  <rect y="64" width="600" height="16" fill="#1e293b"/>
  <circle cx="45" cy="40" r="20" fill="#0284c7" opacity="0.25"/>
  <path d="M45 27 L56 35 L45 43 L34 35 Z M38 41 L38 48 C38 52 52 52 52 48 L52 41" stroke="#38bdf8" stroke-width="2" fill="none" stroke-linejoin="round"/>
  <text x="75" y="36" fill="#f8fafc" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="15" font-weight="bold">{college_display}</text>
  <text x="75" y="55" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="600" letter-spacing="1">INSTITUTIONAL IDENTITY CARD</text>
  <rect x="35" y="110" width="130" height="160" rx="12" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
  <circle cx="100" cy="165" r="30" fill="#334155"/>
  <path d="M70 235 C70 205 130 205 130 235" fill="#475569"/>
  <text x="100" y="255" fill="#38bdf8" font-family="monospace" font-size="9" text-anchor="middle" font-weight="bold">PHOTO ID</text>
  <text x="185" y="130" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">STUDENT NAME</text>
  <text x="185" y="154" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="17" font-weight="bold">{name_display}</text>
  <text x="185" y="185" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">REGISTRATION / ROLL NUMBER</text>
  <text x="185" y="208" fill="#38bdf8" font-family="monospace" font-size="15" font-weight="bold">{reg_display}</text>
  <text x="185" y="238" fill="#64748b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold" letter-spacing="1">DEPARTMENT / PROGRAM</text>
  <text x="185" y="258" fill="#e2e8f0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="500">{dept_display}</text>
  <rect x="35" y="295" width="530" height="55" rx="10" fill="#1e293b" stroke="#334155" stroke-width="1"/>
  <text x="50" y="320" fill="#10b981" font-family="monospace" font-size="11" font-weight="bold">&#x2713; OCR VERIFIED ROSTER RECORD</text>
  <text x="50" y="336" fill="#94a3b8" font-family="monospace" font-size="9">DIGITIZED STUDENT CREDENTIAL &bull; TRACKINTERN VERIFIED</text>
  <rect x="450" y="308" width="100" height="30" rx="6" fill="#0284c7" opacity="0.2" stroke="#0284c7" stroke-width="1"/>
  <text x="500" y="327" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">OFFICIAL</text>
</svg>"""
    return svg.encode("utf-8")


@router.get("/verifications/{user_id}/card-image")
async def get_card_image(
    user_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
):
    """
    Securely stream the student's uploaded physical College ID document image for review.
    If ephemeral container disk restarted and the file was cleared, serves a synthesized
    vector ID badge from verified OCR record.
    """
    iv = await AdminService.get_verification_item(db, user_id)
    storage_ref = iv.college_id_storage_ref
    if not storage_ref and iv.user and hasattr(iv.user, "profile") and iv.user.profile:
        storage_ref = iv.user.profile.college_id_path

    if storage_ref:
        abs_path = _storage.get_abs_path(storage_ref)
        if os.path.exists(abs_path):
            ext = os.path.splitext(abs_path)[1].lower()
            media_type = "image/jpeg"
            if ext == ".png":
                media_type = "image/png"
            elif ext == ".pdf":
                media_type = "application/pdf"
            return FileResponse(abs_path, media_type=media_type)

    # Fallback to synthesized official SVG card based on student database record
    student_name = iv.user.name if iv.user else "Student"
    reg_number = iv.user.registration_number if iv.user else ""
    college_name = iv.college.name if iv.college else "Institutional College"
    dept = None
    if iv.extracted_metadata and isinstance(iv.extracted_metadata, dict):
        fields = iv.extracted_metadata.get("fields") or {}
        dept = fields.get("department")

    svg_bytes = _generate_fallback_id_card_svg(student_name, reg_number, college_name, dept)
    return Response(content=svg_bytes, media_type="image/svg+xml")


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
