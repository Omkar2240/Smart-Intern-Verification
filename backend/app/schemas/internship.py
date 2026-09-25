"""
Pydantic schemas for Internship CRUD and verification status updates.
"""

from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class InternshipBase(BaseModel):
    company_name: str
    role: str
    department: str | None = None
    internship_type: str = "on_site"  # on_site, remote, hybrid
    location: str | None = None
    supervisor_name: str | None = None
    supervisor_email: str | None = None
    supervisor_phone: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    stipend: str | None = None
    offer_letter_url: str | None = None


class InternshipCreate(InternshipBase):
    pass


class InternshipUpdate(BaseModel):
    company_name: str | None = None
    role: str | None = None
    department: str | None = None
    internship_type: str | None = None
    location: str | None = None
    supervisor_name: str | None = None
    supervisor_email: str | None = None
    supervisor_phone: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    stipend: str | None = None
    offer_letter_url: str | None = None
    is_active: bool | None = None


class InternshipStatusUpdate(BaseModel):
    verification_stage: str  # "submitted" | "tp_review" | "mentor_review" | "verified" | "rejected"
    status: str | None = None  # "pending" | "verified" | "rejected"
    rejection_reason: str | None = None


class InternshipResponse(InternshipBase):
    id: UUID
    user_id: UUID
    verification_stage: str
    status: str
    rejection_reason: str | None = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
