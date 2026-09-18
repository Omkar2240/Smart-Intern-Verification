"""
Tests for Colleges API endpoints.
"""

import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.college import College


@pytest.mark.asyncio
async def test_list_and_search_colleges(client: AsyncClient, db_session: AsyncSession):
    # Insert test colleges
    c1 = College(
        name="G. H. Raisoni College of Engineering, Nagpur",
        city="Nagpur",
        state="Maharashtra",
        country="India",
        code="GHRCEN",
        is_active=True,
    )
    c2 = College(
        name="Indian Institute of Technology, Bombay",
        city="Mumbai",
        state="Maharashtra",
        country="India",
        code="IITB",
        is_active=True,
    )
    db_session.add_all([c1, c2])
    await db_session.commit()

    # 1. List all active colleges
    resp = await client.get("/api/v1/colleges")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2
    names = [c["name"] for c in data]
    assert "G. H. Raisoni College of Engineering, Nagpur" in names

    # 2. Search for "Raisoni"
    resp_search = await client.get("/api/v1/colleges?search=Raisoni")
    assert resp_search.status_code == 200
    search_data = resp_search.json()
    assert len(search_data) == 1
    assert search_data[0]["code"] == "GHRCEN"

    # 3. Search for non-existent
    resp_empty = await client.get("/api/v1/colleges?search=NonExistentUniv123")
    assert resp_empty.status_code == 200
    assert len(resp_empty.json()) == 0

    # 4. Get by ID
    resp_detail = await client.get(f"/api/v1/colleges/{c1.id}")
    assert resp_detail.status_code == 200
    assert resp_detail.json()["name"] == c1.name

    # 5. Get by invalid ID
    resp_404 = await client.get(f"/api/v1/colleges/{uuid.uuid4()}")
    assert resp_404.status_code == 404
