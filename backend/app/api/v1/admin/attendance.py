"""Admin attendance reporting endpoints."""

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_admin
from app.models.user import User
from app.schemas.attendance import AdminRequestCheckRequest, AdminRequestCheckResponse
from app.services.attendance_service import (
    admin_request_live_check,
    attendance_analytics,
    list_attendance,
)
from app.schemas.admin import AdminAttendanceAnalytics, AdminAttendanceListResponse

router = APIRouter(prefix="/admin", tags=["Admin Attendance"])


@router.get("/attendance", response_model=AdminAttendanceListResponse)
async def get_admin_attendance(
    current_admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    requested_date: Annotated[date | None, Query(alias="date")] = None,
    date_filter: Annotated[str | None, Query()] = None,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    search: Annotated[str | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
):
    return await list_attendance(
        db,
        admin_user=current_admin,
        requested_date=requested_date,
        date_filter=date_filter,
        status_filter=status_filter,
        search=search,
        page=page,
        page_size=page_size,
    )


@router.get("/attendance/analytics", response_model=AdminAttendanceAnalytics)
async def get_admin_attendance_analytics(
    current_admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
    period: Annotated[str, Query(pattern="^(week|month|quarter|year)$")] = "month",
):
    return await attendance_analytics(db, period=period, admin_user=current_admin)


@router.post("/attendance/request-check", response_model=AdminRequestCheckResponse)
async def request_live_attendance_check(
    body: AdminRequestCheckRequest,
    current_admin: Annotated[User, Depends(require_admin)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    On-Demand Live Attendance Check (Surprise Check):
    Can be triggered by College Admin (for their college) or Department Admin (for their department).
    Enforces institutional scope and triggers a 10-minute countdown challenge for the student.
    """
    task = await admin_request_live_check(
        db,
        admin_user=current_admin,
        student_id=body.student_id,
        prompt=body.prompt,
    )
    return AdminRequestCheckResponse(
        success=True,
        task_id=task.id,
        student_id=task.student_id,
        expires_at=task.expires_at,
        message="Live attendance check triggered successfully. Student has 10 minutes to verify.",
    )

