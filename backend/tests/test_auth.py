"""
Authentication tests — registration, login, JWT, refresh, logout.
"""

import pytest
from httpx import AsyncClient

from tests.conftest import TEST_USER, register_user, login_user


# ---------------------------------------------------------------------------
# Registration
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    resp = await client.post("/api/v1/auth/register", json=TEST_USER.copy())
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == TEST_USER["email"].lower()


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    await register_user(client)
    user2 = TEST_USER.copy()
    user2["registration_number"] = "DS2026002"
    user2["mobile_number"] = "9876543211"
    resp = await client.post("/api/v1/auth/register", json=user2)
    assert resp.status_code == 409
    assert "email" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_duplicate_registration_number(client: AsyncClient):
    await register_user(client)
    user2 = TEST_USER.copy()
    user2["email"] = "other@example.com"
    user2["mobile_number"] = "9876543211"
    resp = await client.post("/api/v1/auth/register", json=user2)
    assert resp.status_code == 409
    assert "registration number" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_duplicate_mobile(client: AsyncClient):
    await register_user(client)
    user2 = TEST_USER.copy()
    user2["email"] = "other@example.com"
    user2["registration_number"] = "DS2026002"
    resp = await client.post("/api/v1/auth/register", json=user2)
    assert resp.status_code == 409
    assert "mobile" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    user = TEST_USER.copy()
    user["password"] = "weak"
    resp = await client.post("/api/v1/auth/register", json=user)
    assert resp.status_code == 422  # Pydantic validation error


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    await register_user(client)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": TEST_USER["email"], "password": TEST_USER["password"]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["name"] == TEST_USER["name"]


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await register_user(client)
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": TEST_USER["email"], "password": "WrongPass@999"},
    )
    assert resp.status_code == 401
    assert "invalid" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_login_nonexistent_email(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@example.com", "password": "Whatever@123"},
    )
    assert resp.status_code == 401
    assert "invalid" in resp.json()["detail"].lower()


# ---------------------------------------------------------------------------
# Auth status
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_auth_status_unauthenticated(client: AsyncClient):
    resp = await client.get("/api/v1/auth/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["authenticated"] is False
    assert data["user"] is None


@pytest.mark.asyncio
async def test_auth_status_authenticated(client: AsyncClient):
    tokens = await register_user(client)
    resp = await client.get(
        "/api/v1/auth/status",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["authenticated"] is True
    assert data["user"]["email"] == TEST_USER["email"].lower()


# ---------------------------------------------------------------------------
# JWT validation
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_invalid_jwt(client: AsyncClient):
    resp = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_jwt_invalid_uuid_sub(client: AsyncClient):
    from jose import jwt
    from app.core.config import settings
    token = jwt.encode({"sub": "not-a-valid-uuid", "type": "access"}, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    resp = await client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 401
    assert "invalid token payload" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_no_auth_header(client: AsyncClient):
    resp = await client.get("/api/v1/users/me")
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Refresh token
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_refresh_token_rotation(client: AsyncClient):
    tokens = await register_user(client)
    refresh = tokens["refresh_token"]

    resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh},
    )
    assert resp.status_code == 200
    new_tokens = resp.json()
    assert new_tokens["access_token"] != tokens["access_token"]
    assert new_tokens["refresh_token"] != refresh


@pytest.mark.asyncio
async def test_refresh_token_reuse_detection(client: AsyncClient):
    tokens = await register_user(client)
    old_refresh = tokens["refresh_token"]

    # First refresh — should succeed
    resp1 = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert resp1.status_code == 200

    # Reuse the OLD token — should fail (revoked)
    resp2 = await client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert resp2.status_code == 401


@pytest.mark.asyncio
async def test_invalid_refresh_token(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "completely-invalid-token"},
    )
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    tokens = await register_user(client)
    resp = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert resp.status_code == 200

    # Refresh should now fail
    resp2 = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert resp2.status_code == 401


@pytest.mark.asyncio
async def test_logout_all(client: AsyncClient):
    tokens = await register_user(client)
    resp = await client.post(
        "/api/v1/auth/logout-all",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert resp.status_code == 200

    # Refresh should fail
    resp2 = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert resp2.status_code == 401
