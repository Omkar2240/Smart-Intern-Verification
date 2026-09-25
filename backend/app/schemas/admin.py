"""
Admin schemas for verification review queue, college administration, whitelist rosters, and analytics.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


from app.schemas.internship import InternshipResponse


class AdminVerificationItem(BaseModel):
    user_id: UUID
    user_name: str
    user_email: str
    registration_number: str
    mobile_number: str
    is_verified: bool = False
    college_id: UUID | None = None
    college_name: str | None = None
    college_status: str
    college_id_status: str
    face_status: str
    overall_status: str
    extracted_metadata: dict | None = None
    rejection_reason: str | None = None
    has_card_image: bool = False
    has_face_embedding: bool = False
    internships: list[InternshipResponse] = Field(default_factory=list)
    created_at: datetime
    verified_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminVerificationListResponse(BaseModel):
    total: int
    items: list[AdminVerificationItem]
    page: int = 1
    page_size: int = 20


class AdminInternshipItem(BaseModel):
    id: UUID
    user_id: UUID
    student_name: str
    student_email: str
    student_registration_number: str
    student_mobile: str
    college_name: str | None = None
    company_name: str
    role: str
    department: str | None = None
    internship_type: str
    location: str | None = None
    supervisor_name: str | None = None
    supervisor_email: str | None = None
    supervisor_phone: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    stipend: str | None = None
    offer_letter_url: str | None = None
    verification_stage: str
    status: str
    rejection_reason: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminInternshipListResponse(BaseModel):
    total: int
    items: list[AdminInternshipItem]
    page: int = 1
    page_size: int = 20


class AdminInternshipStatusUpdate(BaseModel):
    verification_stage: str
    status: str | None = None
    rejection_reason: str | None = None


class AdminRejectRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500, description="Mandatory reason for rejecting verification")


class AdminActionResponse(BaseModel):
    success: bool
    message: str
    overall_status: str


class AdminCollegeCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    country: str = "India"
    code: str | None = Field(None, max_length=50)


class AdminCollegeUpdate(BaseModel):
    name: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    code: str | None = None
    is_active: bool | None = None


class AdminRosterEntry(BaseModel):
    id: UUID
    college_id: UUID
    student_name: str
    registration_number: str
    email: str | None = None
    department: str | None = None
    is_claimed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminRosterUploadResponse(BaseModel):
    success: bool
    added_count: int
    skipped_count: int
    message: str


class AdminAnalyticsSummary(BaseModel):
    total_users: int
    verified_users: int
    pending_reviews: int
    rejected_verifications: int
    active_colleges: int
    total_internships: int = 0
    pending_internships: int = 0
    verified_internships: int = 0
