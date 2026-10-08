"""
Pydantic schemas for Attendance, Shift Check-in, Random Shift Tasks, and Admin Surprise Checks.
"""

from datetime import date, datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class AttendanceCheckInRequest(BaseModel):
    work_mode: str = "offline"  # "offline" | "online"
    latitude: float | None = None
    longitude: float | None = None
    face_image_base64: str | None = None
    digital_task_type: str | None = None  # "sprint_goal" | "github_commit" | "ide_screenshot"
    digital_task_proof: str | None = None


class AttendanceCheckInResponse(BaseModel):
    status: str
    message: str
    attendance_id: UUID
    work_mode: str
    check_in_time: datetime
    location_verified: bool
    face_verified: bool
    tasks_scheduled: int


class AttendanceRecordItem(BaseModel):
    id: UUID
    date: date
    check_in: datetime
    check_out: datetime | None = None
    work_mode: str
    status: str
    location_verified: bool
    face_verified: bool
    digital_task_type: str | None = None
    digital_task_proof: str | None = None
    tasks_assigned_count: int
    tasks_completed_count: int
    admin_requested_check: bool

    model_config = ConfigDict(from_attributes=True)


class AttendanceHistoryResponse(BaseModel):
    total_days: int
    present_days: int
    on_site_count: int
    remote_count: int
    attendance_rate: float
    records: list[AttendanceRecordItem]


class ShiftTaskResponse(BaseModel):
    id: UUID
    task_number: int
    task_type: str
    prompt: str
    scheduled_at: datetime
    expires_at: datetime
    remaining_seconds: int
    status: str
    trigger_source: str

    model_config = ConfigDict(from_attributes=True)


class ShiftTaskActiveResponse(BaseModel):
    has_active_task: bool
    task: ShiftTaskResponse | None = None


class ShiftTaskSubmitRequest(BaseModel):
    submission: str


class AdminRequestCheckRequest(BaseModel):
    student_id: UUID
    prompt: str = "Urgent live attendance check requested by administrator."


class AdminRequestCheckResponse(BaseModel):
    success: bool
    task_id: UUID
    student_id: UUID
    expires_at: datetime
    message: str
