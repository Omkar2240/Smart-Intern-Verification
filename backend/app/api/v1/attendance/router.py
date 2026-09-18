"""
Attendance API routes — protected by mandatory identity verification.
"""

from typing import Annotated
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status

from app.api.deps import require_identity_verified
from app.models.user import User

router = APIRouter(prefix="/attendance", tags=["Attendance"])


class AttendanceMarkRequest(BaseModel):
    company_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class AttendanceResponse(BaseModel):
    status: str
    message: str
    user_id: str
    timestamp: str


@router.post("", response_model=AttendanceResponse, status_code=status.HTTP_200_OK)
async def mark_attendance(
    body: AttendanceMarkRequest,
    current_user: Annotated[User, Depends(require_identity_verified)],
):
    """
    Mark daily attendance.
    Protected: Only users who have completed identity verification can mark attendance.
    """
    from datetime import datetime, timezone
    return AttendanceResponse(
        status="success",
        message="Attendance recorded successfully.",
        user_id=str(current_user.id),
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("", response_model=dict)
async def get_attendance_status(
    current_user: Annotated[User, Depends(require_identity_verified)],
):
    """
    Get current attendance summary for verified user.
    """
    return {
        "status": "ready",
        "user_id": str(current_user.id),
        "verified": True,
    }
