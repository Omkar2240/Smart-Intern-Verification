"""
Test fixtures — in-memory SQLite async database + test client.
"""

import asyncio
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app as fastapi_app

# Import models so tables are registered on Base.metadata
import app.models  # noqa: F401

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    _engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await _engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """Yield a fresh session that rolls back after each test."""
    async_session = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    async with async_session() as session:
        async with session.begin():
            try:
                yield session
            finally:
                await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Async test client with DB session override."""

    async def _override_get_db():
        yield db_session

    fastapi_app.dependency_overrides[get_db] = _override_get_db

    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    fastapi_app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

TEST_USER = {
    "name": "Omkar Ramgirwar",
    "email": "omkar@example.com",
    "registration_number": "DS2026001",
    "mobile_number": "9876543210",
    "password": "StrongPassword@123",
}


async def register_user(client: AsyncClient, user_data: dict | None = None) -> dict:
    """Helper: register a user and return the response JSON."""
    data = user_data or TEST_USER.copy()
    resp = await client.post("/api/v1/auth/register", json=data)
    return resp.json()


async def login_user(client: AsyncClient, email: str | None = None, password: str | None = None) -> dict:
    """Helper: login and return the response JSON."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={
            "email": email or TEST_USER["email"],
            "password": password or TEST_USER["password"],
        },
    )
    return resp.json()
