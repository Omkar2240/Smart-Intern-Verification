"""
TrackIntern Backend — main application entry point.
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router as v1_router
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TrackIntern API",
    description="Backend API for the TrackIntern mobile internship attendance and verification application.",
    version="0.1.0",
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


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {"message": "TrackIntern API is running", "version": "0.1.0"}