"""
Identity Verification API routes.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.verification import (
    SelectCollegeRequest,
    VerificationStatusResponse,
    VerificationStepResponse,
)
from app.services.verification_service import (
    VerificationServiceError,
    verification_service,
)

router = APIRouter(prefix="/verification", tags=["Identity Verification"])


@router.get("/status", response_model=VerificationStatusResponse)
async def get_verification_status(
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Get the authenticated user's current identity verification status and active step.
    """
    return await verification_service.get_status(db, user_id=user.id)


@router.post("/college", response_model=VerificationStepResponse)
async def select_college(
    body: SelectCollegeRequest,
    user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Step 1: Select the user's college from the approved directory.
    """
    try:
        record = await verification_service.select_college(
            db,
            user_id=user.id,
            college_id=body.college_id,
        )
        return VerificationStepResponse(
            success=True,
            message="College selected successfully.",
            step="college_selection",
            step_status=record.college_status,
            overall_status=record.overall_status,
        )
    except VerificationServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/college-id", response_model=VerificationStepResponse)
async def upload_college_id(
    file: UploadFile = File(..., description="College ID card image (JPEG, PNG, WebP)"),
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Step 2: Upload and verify college ID card with OCR text extraction.
    """
    if not file.content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type could not be determined.",
        )

    try:
        file_bytes = await file.read()
        record, metadata = await verification_service.upload_college_id(
            db,
            user=user,
            file_bytes=file_bytes,
            content_type=file.content_type,
        )

        msg = (
            "College ID verified successfully."
            if record.college_id_status == "verified"
            else "College ID uploaded and routed for administrative review."
        )

        return VerificationStepResponse(
            success=True,
            message=msg,
            step="college_id",
            step_status=record.college_id_status,
            overall_status=record.overall_status,
            extracted_metadata=metadata,
        )
    except VerificationServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/face", response_model=VerificationStepResponse)
async def enroll_face(
    file: UploadFile = File(..., description="Live face capture image"),
    user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Step 3: Capture live face, validate liveness and quality, and store ArcFace biometric embedding.
    """
    try:
        image_bytes = await file.read()
        record = await verification_service.enroll_face(
            db,
            user=user,
            image_bytes=image_bytes,
        )

        return VerificationStepResponse(
            success=True,
            message="Face enrolled and identity verified successfully!",
            step="face",
            step_status=record.face_status,
            overall_status=record.overall_status,
        )
    except VerificationServiceError as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
