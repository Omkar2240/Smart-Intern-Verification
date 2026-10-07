"""
Application constants - centralized configuration for roles, status values, and enum values.

This single file contains all constants organized by domain for the TrackIntern backend.

Note: HTTP status codes are not included here - use starlette.status (from FastAPI) instead:
    from fastapi import status
    status_code=status.HTTP_200_OK

Usage:
    from app.core.constants import INTERNSHIP_TYPE_DEFAULT, USER_ROLES, VERIFICATION_STATUS
"""

# =============================================================================
# INTERNSHIP CONSTANTS
# =============================================================================

# Internship type options
INTERNSHIP_TYPE_DEFAULT = "on_site"
INTERNSHIP_TYPES = (
    "on_site",  # On-site/office-based internship
    "remote",  # Remote/work-from-home internship
    "hybrid",  # Hybrid (mix of on-site and remote)
)

# Verification workflow stages
# "submitted" -> "tp_review" -> "mentor_review" -> "verified" (or "rejected")
INTERNSHIP_VERIFICATION_STAGES = (
    "submitted",      # Initial submission by student
    "tp_review",     # Training placement officer review
    "mentor_review", # Faculty mentor review
    "verified",      # Successfully verified
    "rejected",      # Rejected with reason
)

# Internship overall status
INTERNSHIP_STATUSES = (
    "pending",   # Awaiting verification
    "verified",  # Successfully verified
    "rejected",  # Rejected
)


# =============================================================================
# VERIFICATION CONSTANTS
# =============================================================================

# Overall verification status
VERIFICATION_STATUS = (
    "not_started",    # Verification process not initiated
    "pending",        # Verification in progress
    "verified",       # Successfully verified
    "rejected",       # Verification rejected
    "manual_review",  # Requires manual admin review
)

# Default verification statuses
DEFAULT_VERIFICATION_STATUS = "not_started"
DEFAULT_INTERNSHIP_STATUS = "not_started"
COMPLETED_INTERNSHIP_STATUS = "completed"
DEFAULT_COLLEGE_STATUS = "not_started"
DEFAULT_COLLEGE_ID_STATUS = "not_started"
DEFAULT_FACE_STATUS = "not_started"

# College selection status
COLLEGE_STATUS = (
    "not_started",    # College not selected yet
    "selected",       # College selected from list
)

# College ID document verification status
COLLEGE_ID_STATUS = (
    "not_started",    # ID document not uploaded
    "pending",        # OCR processing in progress
    "verified",       # ID document verified
    "rejected",       # ID document rejected
    "manual_review",  # Requires manual admin review
)

# Face biometric verification status
FACE_STATUS = (
    "not_started",    # Face not enrolled
    "pending",        # Face enrollment in progress
    "verified",       # Face verified
    "rejected",       # Face verification rejected
)

# Verification workflow steps (for UI/UX)
VERIFICATION_STEPS = (
    "college_selection",  # Step 1: Select college
    "college_id",         # Step 2: Upload college ID
    "face",               # Step 3: Face enrollment
    "completed",          # Final: All steps complete
)


# =============================================================================
# USER CONSTANTS
# =============================================================================

# User roles
USER_ROLES = (
    "student",            # Regular student user (default)
    "department_admin",   # Department-level administrator
    "college_admin",      # College-level administrator
    "admin",              # Platform administrator
    "super_admin",        # Super administrator with full access
)

# Administrative roles (subset of USER_ROLES)
ADMIN_ROLES = (
    "department_admin",
    "college_admin",
    "admin",
    "super_admin",
)

# Future role placeholder for mentor module:
# "industry_admin" - Internship team lead or HR from industry

# Default values
DEFAULT_USER_ROLE = "student"
DEPARTMENT_ADMIN_ROLE = "department_admin"
COLLEGE_ADMIN_ROLE = "college_admin"
PLATFORM_ADMIN_ROLE = "admin"
SUPER_ADMIN_ROLE = "super_admin"
DEFAULT_COUNTRY = "India"


# =============================================================================
# GENERAL STATUS CONSTANTS
# =============================================================================

# Common status values
ACTIVE_STATUS = "active"
INACTIVE_STATUS = "inactive"
PENDING_STATUS = "pending"
SUCCESS_STATUS = "success"
FAILED_STATUS = "failed"
DELETED_STATUS = "deleted"

# Attendance statuses and supported analytics periods
ATTENDANCE_STATUSES = (
    "present",
    "absent",
    "late",
)
ATTENDANCE_PERIODS = (
    "week",
    "month",
    "quarter",
    "year",
)


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def is_admin_role(role: str) -> bool:
    """Check if a role has administrative privileges."""
    return role in ADMIN_ROLES


def is_super_admin_role(role: str) -> bool:
    """Check if a role has super admin privileges."""
    return role in ("admin", "super_admin")


def is_college_admin_role(role: str) -> bool:
    """Check if a role has college-level admin privileges."""
    return role in ("college_admin", "admin", "super_admin")


def is_department_admin_role(role: str) -> bool:
    """Check if a role has department-level admin privileges."""
    return role in ("department_admin", "college_admin", "admin", "super_admin")


def get_valid_internship_types() -> tuple[str, ...]:
    """Return all valid internship type values."""
    return INTERNSHIP_TYPES


def get_valid_verification_stages() -> tuple[str, ...]:
    """Return all valid verification stage values."""
    return INTERNSHIP_VERIFICATION_STAGES


def get_valid_internship_statuses() -> tuple[str, ...]:
    """Return all valid internship status values."""
    return INTERNSHIP_STATUSES


def get_valid_verification_statuses() -> tuple[str, ...]:
    """Return all valid overall verification status values."""
    return VERIFICATION_STATUS


def get_valid_college_id_statuses() -> tuple[str, ...]:
    """Return all valid college ID verification status values."""
    return COLLEGE_ID_STATUS


def get_valid_face_statuses() -> tuple[str, ...]:
    """Return all valid face verification status values."""
    return FACE_STATUS
