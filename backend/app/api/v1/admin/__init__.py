"""Admin API module."""
from app.api.v1.admin.attendance import router as attendance_router

__all__ = ["attendance_router"]
