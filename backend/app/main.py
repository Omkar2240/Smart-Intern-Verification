"""
TrackIntern Backend — main application entry point.
"""

import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
import app.models  # noqa: F401

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist on startup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        logger.warning(f"Could not automatically create tables at startup: {e}")
    yield


app = FastAPI(
    title="TrackIntern API",
    description="Backend API for the TrackIntern mobile internship attendance and verification application.",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 API routes
app.include_router(v1_router)

from fastapi import Request
from fastapi.responses import JSONResponse
from app.dependencies.verification import IdentityVerificationRequiredException

@app.exception_handler(IdentityVerificationRequiredException)
async def identity_verification_exception_handler(request: Request, exc: IdentityVerificationRequiredException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "code": exc.code,
        },
    )



@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {"message": "TrackIntern API is running", "version": "0.1.0"}