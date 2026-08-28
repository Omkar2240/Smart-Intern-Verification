"""
User & profile tests — current user, profile CRUD.
"""

import pytest
from httpx import AsyncClient

from tests.conftest import TEST_USER, register_user


# ---------------------------------------------------------------------------
# Current user
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient):
    tokens = await register_user(client)
    resp = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == TEST_USER["email"].lower()
    assert data["name"] == TEST_USER["name"]
    assert "password_hash" not in data
    assert "password" not in data


@pytest.mark.asyncio
async def test_get_current_user_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Profile CRUD
# ---------------------------------------------------------------------------

PROFILE_DATA = {
    "college": "XYZ Engineering College",
    "branch": "Computer Science",
    "roll_number": "CS2026-042",
}


@pytest.mark.asyncio
async def test_create_profile(client: AsyncClient):
    tokens = await register_user(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    resp = await client.post("/api/v1/users/me/profile", json=PROFILE_DATA, headers=headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["college"] == PROFILE_DATA["college"]
    assert data["branch"] == PROFILE_DATA["branch"]
    assert data["roll_number"] == PROFILE_DATA["roll_number"]
    assert data["has_college_id"] is False


@pytest.mark.asyncio
async def test_create_profile_duplicate(client: AsyncClient):
    tokens = await register_user(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    await client.post("/api/v1/users/me/profile", json=PROFILE_DATA, headers=headers)
    resp = await client.post("/api/v1/users/me/profile", json=PROFILE_DATA, headers=headers)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_get_profile(client: AsyncClient):
    tokens = await register_user(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    await client.post("/api/v1/users/me/profile", json=PROFILE_DATA, headers=headers)
    resp = await client.get("/api/v1/users/me/profile", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["college"] == PROFILE_DATA["college"]


@pytest.mark.asyncio
async def test_get_profile_not_found(client: AsyncClient):
    tokens = await register_user(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    resp = await client.get("/api/v1/users/me/profile", headers=headers)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient):
    tokens = await register_user(client)
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}

    await client.post("/api/v1/users/me/profile", json=PROFILE_DATA, headers=headers)
    resp = await client.patch(
        "/api/v1/users/me/profile",
        json={"college": "ABC University"},
        headers=headers,
    )
    assert resp.status_code == 200
    assert resp.json()["college"] == "ABC University"
    assert resp.json()["branch"] == PROFILE_DATA["branch"]  # unchanged
