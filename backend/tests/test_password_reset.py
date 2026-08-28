"""
Password reset flow tests.
"""

import pytest
from httpx import AsyncClient

from tests.conftest import TEST_USER, register_user

# NOTE: In dev mode, verification/reset tokens are logged to console.
# These tests verify the API responses and error handling.
# Full token flow testing requires either mocking the email service
# or capturing logged tokens from the service.


@pytest.mark.asyncio
async def test_forgot_password_existing_user(client: AsyncClient):
    """Should always return 200 regardless of whether the email exists."""
    await register_user(client)
    resp = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": TEST_USER["email"]},
    )
    assert resp.status_code == 200
    assert "sent" in resp.json()["message"].lower()


@pytest.mark.asyncio
async def test_forgot_password_nonexistent_user(client: AsyncClient):
    """Should still return 200 to prevent account enumeration."""
    resp = await client.post(
        "/api/v1/auth/forgot-password",
        json={"email": "nobody@example.com"},
    )
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_reset_password_invalid_token(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "invalid-token", "new_password": "NewStrong@Pass1"},
    )
    assert resp.status_code == 400
    assert "invalid" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_reset_password_weak_new_password(client: AsyncClient):
    """Pydantic should reject weak passwords."""
    resp = await client.post(
        "/api/v1/auth/reset-password",
        json={"token": "some-token", "new_password": "weak"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_verify_email_invalid_token(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/verify-email",
        json={"token": "invalid-token"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_resend_verification(client: AsyncClient):
    """Should always return 200."""
    resp = await client.post(
        "/api/v1/auth/resend-verification",
        json={"email": "nobody@example.com"},
    )
    assert resp.status_code == 200
