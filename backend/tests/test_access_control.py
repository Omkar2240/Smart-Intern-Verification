"""
Tests for access control dependency (require_identity_verified) on company & attendance routes.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.identity_verification import IdentityVerification
from tests.conftest import register_user


@pytest.mark.asyncio
async def test_unverified_user_blocked_from_companies_and_attendance(
    client: AsyncClient,
    db_session: AsyncSession,
):
    # Register and get auth token
    reg = await register_user(client)
    token = reg["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Attempt to create company without identity verification -> 403 Forbidden
    resp_comp = await client.post(
        "/api/v1/companies",
        json={"name": "Acme Innovations", "location": "Nagpur"},
        headers=headers,
    )
    assert resp_comp.status_code == 403
    comp_json = resp_comp.json()
    assert comp_json["code"] == "IDENTITY_VERIFICATION_REQUIRED"
    assert "Identity verification required" in comp_json["detail"]

    # 2. Attempt to mark attendance without identity verification -> 403 Forbidden
    resp_att = await client.post(
        "/api/v1/attendance",
        json={"company_id": "comp-1"},
        headers=headers,
    )
    assert resp_att.status_code == 403
    att_json = resp_att.json()
    assert att_json["code"] == "IDENTITY_VERIFICATION_REQUIRED"

    # 3. Simulate completion of identity verification
    user_id = reg["user"]["id"]
    from uuid import UUID
    from datetime import datetime, timezone

    verif = IdentityVerification(
        user_id=UUID(user_id),
        college_status="selected",
        college_id_status="verified",
        face_status="verified",
        overall_status="verified",
        verified_at=datetime.now(timezone.utc),
    )
    db_session.add(verif)
    await db_session.commit()

    # 4. Verified user can now create company
    resp_comp_ok = await client.post(
        "/api/v1/companies",
        json={"name": "Acme Innovations", "location": "Nagpur"},
        headers=headers,
    )
    assert resp_comp_ok.status_code == 201
    assert resp_comp_ok.json()["name"] == "Acme Innovations"

    # 5. Verified user can now mark attendance
    resp_att_ok = await client.post(
        "/api/v1/attendance",
        json={"company_id": "comp-1"},
        headers=headers,
    )
    assert resp_att_ok.status_code == 200
    assert resp_att_ok.json()["status"] == "success"
