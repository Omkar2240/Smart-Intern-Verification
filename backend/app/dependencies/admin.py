"""
Admin Authorization Dependencies — ensures user has administrative privileges.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_active_user
from app.models.user import User
from app.core.constants import (
    ADMIN_ROLES,
    is_admin_role,
    is_super_admin_role,
    is_college_admin_role,
    is_department_admin_role,
)


async def require_admin(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """
    Ensure the authenticated user has an administrative role.
    Raises 403 Forbidden if the user is a standard student.
    """
    if not is_admin_role(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required",
        )
    return current_user


async def require_super_admin(
    current_user: Annotated[User, Depends(require_admin)],
) -> User:
    """
    Ensure the authenticated user is a Super Admin.
    """
    if not is_super_admin_role(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super administrative privileges required",
        )
    return current_user


async def require_college_admin(
    current_user: Annotated[User, Depends(require_admin)],
) -> User:
    """
    Ensure the authenticated user has college-level admin privileges or higher.
    """
    if not is_college_admin_role(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="College-level administrative privileges required",
        )
    return current_user


async def require_department_admin(
    current_user: Annotated[User, Depends(require_admin)],
) -> User:
    """
    Ensure the authenticated user has department-level admin privileges or higher.
    """
    if not is_department_admin_role(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Department-level administrative privileges required",
        )
    return current_user
