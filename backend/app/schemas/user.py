"""
User response schemas.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator

from app.core.constants import DEFAULT_USER_ROLE


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    registration_number: str
    mobile_number: str
    role: str = DEFAULT_USER_ROLE  # student
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        if len(value) < 2:
            raise ValueError("Name must be at least 2 characters")
        return value
