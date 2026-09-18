"""
Admin Authorization Dependencies — ensures user has administrative privileges.
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status

from app.api.deps import get_current_active_user
from app.models.user import User


ALLOWED_ADMIN_ROLES = {"super_admin", "college_admin", "admin"}


async def require_admin(
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> User:
    """
    Ensure the authenticated user has an administrative role.
    Raises 403 Forbidden if the user is a standard student.
    """
    if current_user.role not in ALLOWED_ADMIN_ROLES:
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
    if current_user.role not in {"super_admin", "admin"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super administrative privileges required",
        )
    return current_user
