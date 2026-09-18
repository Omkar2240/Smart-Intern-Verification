"""
Verification schemas for status, college selection, ID card upload, and face enrollment.
"""

from uuid import UUID
from pydantic import BaseModel


class VerificationStatusResponse(BaseModel):
    is_verified: bool
    current_step: str  # "college_selection" | "college_id" | "face" | "completed"
    college_id: UUID | None = None
    college_name: str | None = None
    college_verified: bool
    college_id_verified: bool
    college_id_status: str
    face_verified: bool
    face_status: str
    overall_status: str
    rejection_reason: str | None = None

    model_config = {"from_attributes": True}


class SelectCollegeRequest(BaseModel):
    college_id: UUID


class VerificationStepResponse(BaseModel):
    success: bool
    message: str
    step: str
    step_status: str
    overall_status: str
    extracted_metadata: dict | None = None
