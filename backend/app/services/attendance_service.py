"""Attendance persistence and admin reporting queries."""

from datetime import date, datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import ATTENDANCE_STATUSES
from app.models.attendance_record import AttendanceRecord
from app.models.user import User
from app.schemas.admin import (
    AdminAttendanceAnalytics,
    AdminAttendanceItem,
    AdminAttendanceListResponse,
)


async def mark_attendance(
    db: AsyncSession,
    *,
    student_id: UUID,
    company_id: str | None,
) -> AttendanceRecord:
    today = datetime.now(timezone.utc).date()
    result = await db.execute(
        select(AttendanceRecord).where(
            AttendanceRecord.student_id == student_id,
            AttendanceRecord.date == today,
        )
    )
    record = result.scalar_one_or_none()
    if record is None:
        record = AttendanceRecord(
            student_id=student_id,
            company_id=company_id,
            date=today,
            check_in=datetime.now(timezone.utc),
            status=ATTENDANCE_STATUSES[0],
        )
        db.add(record)
    elif record.check_out is None:
        record.check_out = datetime.now(timezone.utc)
    await db.flush()
    return record


def _date_range(
    *,
    requested_date: date | None,
    date_filter: str | None,
) -> tuple[date | None, date | None]:
    if requested_date:
        return requested_date, requested_date
    today = datetime.now(timezone.utc).date()
    if date_filter == "today":
        return today, today
    if date_filter == "week":
        return today - timedelta(days=6), today
    if date_filter == "month":
        return today - timedelta(days=29), today
    return None, None


async def list_attendance(
    db: AsyncSession,
    *,
    requested_date: date | None = None,
    date_filter: str | None = None,
    status_filter: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> AdminAttendanceListResponse:
    start_date, end_date = _date_range(
        requested_date=requested_date, date_filter=date_filter
    )
    conditions = []
    if start_date:
        conditions.append(AttendanceRecord.date >= start_date)
    if end_date:
        conditions.append(AttendanceRecord.date <= end_date)
    if status_filter and status_filter != "all":
        conditions.append(AttendanceRecord.status == status_filter)
    if search:
        conditions.append(User.name.ilike(f"%{search}%"))

    count_query = select(func.count(AttendanceRecord.id)).join(User)
    query = (
        select(AttendanceRecord)
        .join(User)
        .options(selectinload(AttendanceRecord.student).selectinload(User.profile))
        .order_by(AttendanceRecord.date.desc(), AttendanceRecord.check_in.desc())
    )
    if conditions:
        count_query = count_query.where(*conditions)
        query = query.where(*conditions)
    total = (await db.execute(count_query)).scalar_one()
    records = (
        await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    ).scalars().all()

    items = []
    for record in records:
        rate_query = select(
            func.count(AttendanceRecord.id),
            func.sum(AttendanceRecord.status.in_(("present", "late")).cast(Integer)),
        ).where(AttendanceRecord.student_id == record.student_id)
        total_days, attended_days = (await db.execute(rate_query)).one()
        rate = (attended_days or 0) / total_days * 100 if total_days else 0
        items.append(
            AdminAttendanceItem(
                id=record.id,
                student_id=record.student_id,
                student_name=record.student.name,
                date=record.date.isoformat(),
                check_in=record.check_in.isoformat(),
                check_out=record.check_out.isoformat() if record.check_out else None,
                status=record.status,
                attendance_rate=round(rate, 2),
            )
        )
    return AdminAttendanceListResponse(
        total=total, items=items, page=page, page_size=page_size
    )


async def attendance_analytics(
    db: AsyncSession,
    *,
    period: str,
) -> AdminAttendanceAnalytics:
    today = datetime.now(timezone.utc).date()
    days = {"week": 7, "month": 30, "quarter": 90, "year": 365}[period]
    start = today - timedelta(days=days - 1)
    records = (
        await db.execute(
            select(AttendanceRecord).where(AttendanceRecord.date >= start)
        )
    ).scalars().all()
    present_today = sum(
        1 for r in records if r.date == today and r.status == ATTENDANCE_STATUSES[0]
    )
    late_today = sum(
        1 for r in records if r.date == today and r.status == ATTENDANCE_STATUSES[2]
    )
    absent_today = sum(
        1 for r in records if r.date == today and r.status == ATTENDANCE_STATUSES[1]
    )
    average = (
        sum(r.status in ("present", "late") for r in records) / len(records) * 100
        if records
        else 0
    )
    return AdminAttendanceAnalytics(
        average_attendance_rate=round(average, 2),
        present_today=present_today,
        absent_today=absent_today,
        late_today=late_today,
        monthly_trend=[],
        department_breakdown=[],
    )
