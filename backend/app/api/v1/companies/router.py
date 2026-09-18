"""
Companies API routes — protected by mandatory identity verification.
"""

from typing import Annotated
from pydantic import BaseModel
from fastapi import APIRouter, Depends, status

from app.api.deps import require_identity_verified
from app.models.user import User

router = APIRouter(prefix="/companies", tags=["Companies"])


class CompanyCreateRequest(BaseModel):
    name: str
    location: str | None = None
    industry: str | None = None


class CompanyResponse(BaseModel):
    id: str
    name: str
    location: str | None = None
    created_by: str


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    body: CompanyCreateRequest,
    current_user: Annotated[User, Depends(require_identity_verified)],
):
    """
    Register a new company for internship.
    Protected: Only users who have completed identity verification can register a company.
    """
    return CompanyResponse(
        id="comp-mock-12345",
        name=body.name,
        location=body.location,
        created_by=str(current_user.id),
    )


@router.get("", response_model=list[CompanyResponse])
async def list_companies(
    current_user: Annotated[User, Depends(require_identity_verified)],
):
    """
    List user companies.
    Protected: Only verified users can view companies.
    """
    return [
        CompanyResponse(
            id="comp-mock-12345",
            name="HQ Tech Labs",
            location="Nagpur, India",
            created_by=str(current_user.id),
        )
    ]
