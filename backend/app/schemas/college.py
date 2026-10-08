"""
College schemas for directory queries.
"""

from uuid import UUID
from datetime import datetime
from pydantic import BaseModel


class CollegeResponse(BaseModel):
    id: UUID
    name: str
    city: str
    state: str
    country: str
    code: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CollegeListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[CollegeResponse]
