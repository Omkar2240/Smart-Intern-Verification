"""
Department schemas for public college directory queries.
"""

from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DepartmentDirectoryResponse(BaseModel):
    id: UUID
    name: str
    code: str

    model_config = ConfigDict(from_attributes=True)
