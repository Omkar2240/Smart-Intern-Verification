"""
Attendance API routes — protected by mandatory identity verification.
"""

from typing import Annotated
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_identity_verified
from app.models.user import User

from app.schemas.attendance import (
    AttendanceCheckInRequest,
    AttendanceCheckInResponse,
    AttendanceHistoryResponse,
    ShiftTaskActiveResponse,
    ShiftTaskSubmitRequest,
)
from app.services.attendance_service import (
    check_in_student,
    get_student_attendance_history,
    get_active_shift_task,
    submit_shift_task,
    mark_attendance as persist_attendance,
)
from uuid import UUID

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


@router.post("/check-in", response_model=AttendanceCheckInResponse, status_code=status.HTTP_200_OK)
async def check_in(
    body: AttendanceCheckInRequest,
    current_user: Annotated[User, Depends(require_identity_verified)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Intelligent Shift-Validated Check-In:
    - Validates assigned shift timing
    - Offline: Geofencing + ArcFace biometrics + 2 random 10-min shift tasks
    - Online: Digital productivity proof (sprint goal / commit link / IDE screenshot)
    """
    record, tasks_count = await check_in_student(
        db,
        student=current_user,
        request=body,
    )
    return AttendanceCheckInResponse(
        status="success",
        message="Checked in successfully! Shift is active.",
        attendance_id=record.id,
        work_mode=record.work_mode,
        check_in_time=record.check_in,
        location_verified=record.location_verified,
        face_verified=record.face_verified,
        tasks_scheduled=tasks_count,
    )


@router.get("/history", response_model=AttendanceHistoryResponse)
async def get_history(
    current_user: Annotated[User, Depends(require_identity_verified)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Fetch student's complete attendance history with LeetCode-style statistics.
    """
    return await get_student_attendance_history(db, student_id=current_user.id)


@router.get("/shift-tasks/active", response_model=ShiftTaskActiveResponse)
async def get_active_task(
    current_user: Annotated[User, Depends(require_identity_verified)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Check if a 10-minute random compliance task or admin surprise check is pending.
    """
    return await get_active_shift_task(db, student_id=current_user.id)


@router.post("/shift-tasks/{task_id}/submit", response_model=dict)
async def submit_task(
    task_id: UUID,
    body: ShiftTaskSubmitRequest,
    current_user: Annotated[User, Depends(require_identity_verified)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Submit active 10-minute task within the countdown timer.
    """
    task = await submit_shift_task(
        db,
        student_id=current_user.id,
        task_id=task_id,
        submission=body.submission,
    )
    return {
        "status": "success",
        "message": "Task submitted successfully!",
        "task_id": str(task.id),
        "task_status": task.status,
    }


@router.post("", response_model=AttendanceResponse, status_code=status.HTTP_200_OK)
async def mark_attendance(
    body: AttendanceMarkRequest,
    current_user: Annotated[User, Depends(require_identity_verified)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Mark daily attendance (Legacy simple check-in).
    """
    from datetime import datetime, timezone
    await persist_attendance(
        db=db,
        student_id=current_user.id,
        company_id=body.company_id,
    )
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
