"""
User response schemas.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    registration_number: str
    mobile_number: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
