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
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError
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


from fastapi.encoders import jsonable_encoder

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Format Pydantic/FastAPI 422 validation errors into readable strings
    so frontends can directly display the error message.
    """
    error_messages: list[str] = []
    for err in exc.errors():
        raw_msg = err.get("msg", "Invalid input")
        clean_msg = raw_msg.replace("Value error, ", "").strip()
        loc = err.get("loc", [])
        field = loc[-1] if loc else ""
        if field and field != "body":
            field_name = str(field).replace("_", " ").title()
            error_messages.append(f"{field_name}: {clean_msg}")
        else:
            error_messages.append(clean_msg)

    primary_detail = "\n".join(error_messages) if error_messages else "Invalid request data."

    return JSONResponse(
        status_code=422,
        content={
            "detail": primary_detail,
            "errors": jsonable_encoder(exc.errors()),
            "code": "VALIDATION_ERROR",
        },
    )


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    """
    Catch database uniqueness / constraint violations and return a friendly 409 response.
    """
    orig_msg = str(exc.orig) if hasattr(exc, "orig") else str(exc)
    orig_lower = orig_msg.lower()

    if "users_email_key" in orig_lower or ("email" in orig_lower and "unique" in orig_lower):
        detail = "An account with this email address already exists. Please log in instead."
    elif "users_registration_number_key" in orig_lower or ("registration_number" in orig_lower and "unique" in orig_lower):
        detail = "This registration / PRN number is already registered with an existing account."
    elif "users_mobile_number_key" in orig_lower or ("mobile_number" in orig_lower and "unique" in orig_lower):
        detail = "This mobile number is already registered with another account."
    else:
        detail = "A database conflict occurred with the submitted details. Please verify your information."

    return JSONResponse(
        status_code=409,
        content={
            "detail": detail,
            "code": "RECORD_CONFLICT",
        },
    )



@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {"message": "TrackIntern API is running", "version": "0.1.0"}
# Reload trigger