"""
Student profile schemas.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ProfileCreate(BaseModel):
    college: str
    branch: str
    roll_number: str


class ProfileUpdate(BaseModel):
    college: str | None = None
    branch: str | None = None
    roll_number: str | None = None


class ProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    college: str
    branch: str
    roll_number: str
    has_college_id: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_model(cls, profile) -> "ProfileResponse":
        return cls(
            id=profile.id,
            user_id=profile.user_id,
            college=profile.college,
            branch=profile.branch,
            roll_number=profile.roll_number,
            has_college_id=profile.college_id_path is not None,
            created_at=profile.created_at,
            updated_at=profile.updated_at,
        )
