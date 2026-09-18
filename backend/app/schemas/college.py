"""
College schemas for directory queries.
"""

from uuid import UUID
from pydantic import BaseModel


class CollegeResponse(BaseModel):
    id: UUID
    name: str
    city: str
    state: str
    country: str
    code: str | None
    is_active: bool

    model_config = {"from_attributes": True}
