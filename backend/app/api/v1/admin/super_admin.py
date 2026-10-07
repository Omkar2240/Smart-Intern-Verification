"""Super-admin-only platform management endpoints.

Review and attendance endpoints stay in their existing modules; this router
contains only the previously missing platform-management surface.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import (
    get_db,
    require_college_admin,
    require_department_admin,
    require_super_admin,
)
from app.models.user import User
from app.schemas.college import CollegeListResponse
from app.schemas.admin import (
    AdminAuditLogResponse, AdminDepartmentCreate, AdminDepartmentResponse,
    AdminDepartmentUpdate, AdminStatusUpdate, AdminStudentCreate, AdminStudentResponse,
    AdminStudentUpdate,
    AdminSystemConfigResponse, AdminSystemConfigUpdate, AdminUserCreate, AdminUserResponse,
    AdminPermissionOption,
)
from app.core.constants import ADMIN_PERMISSION_CATALOG
from app.services.super_admin_service import SuperAdminService

router = APIRouter(prefix="/admin", tags=["Super Admin"])


@router.get("/colleges", response_model=CollegeListResponse)
async def list_colleges(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_super_admin)],
    search: str | None = None,
    include_inactive: bool = False,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List colleges for platform administration, including inactive records when requested."""
    return await SuperAdminService.list_colleges(
        db, search, include_inactive, page, page_size
    )


@router.get("/departments")
async def list_departments(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_department_admin)],
    college_id: UUID | None = None, search: str | None = None,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
):
    return await SuperAdminService.list_departments(db, college_id, search, page, page_size, current_admin)


@router.post("/departments", response_model=AdminDepartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_department(data: AdminDepartmentCreate, db: Annotated[AsyncSession, Depends(get_db)], current_admin: Annotated[User, Depends(require_college_admin)]):
    return await SuperAdminService.create_department(db, data, current_admin)


@router.put("/departments/{department_id}", response_model=AdminDepartmentResponse)
async def update_department(department_id: UUID, data: AdminDepartmentUpdate, db: Annotated[AsyncSession, Depends(get_db)], current_admin: Annotated[User, Depends(require_department_admin)]):
    return await SuperAdminService.update_department(db, department_id, data, current_admin)


@router.get("/admins")
async def list_admins(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_college_admin)],
    role: str | None = None, college_id: UUID | None = None, search: str | None = None,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
):
    return await SuperAdminService.list_admins(db, role, college_id, search, page, page_size, current_admin)


@router.post("/admins", response_model=AdminUserResponse, status_code=status.HTTP_201_CREATED)
async def create_admin(data: AdminUserCreate, db: Annotated[AsyncSession, Depends(get_db)], current_admin: Annotated[User, Depends(require_college_admin)]):
    return await SuperAdminService.create_admin(db, data, current_admin)


@router.get("/permissions", response_model=list[AdminPermissionOption])
async def list_admin_permissions(
    _: Annotated[User, Depends(require_college_admin)],
):
    return [
        {"key": key, "label": label, "description": description}
        for key, label, description in ADMIN_PERMISSION_CATALOG
    ]


@router.patch("/admins/{admin_id}/status", response_model=AdminUserResponse)
async def update_admin_status(admin_id: UUID, data: AdminStatusUpdate, db: Annotated[AsyncSession, Depends(get_db)], _: Annotated[User, Depends(require_super_admin)]):
    return await SuperAdminService.set_admin_status(db, admin_id, data.is_active)


@router.get("/students")
async def list_students(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_department_admin)],
    college_id: UUID | None = None, department_id: UUID | None = None,
    verification_status: str | None = None, search: str | None = None,
    page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
):
    return await SuperAdminService.list_students(db, college_id, department_id, verification_status, search, page, page_size, current_admin)


@router.post("/students", response_model=AdminStudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    data: AdminStudentCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_college_admin)],
):
    return await SuperAdminService.create_student(db, data, current_admin)


@router.patch("/students/{student_id}", response_model=AdminStudentResponse)
async def update_student(
    student_id: UUID,
    data: AdminStudentUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_college_admin)],
):
    return await SuperAdminService.update_student(db, student_id, data, current_admin)


@router.get("/audit-logs")
async def list_audit_logs(
    db: Annotated[AsyncSession, Depends(get_db)], _: Annotated[User, Depends(require_super_admin)],
    action: str | None = None, page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
):
    return await SuperAdminService.list_audit_logs(db, action, page, page_size)


@router.get("/system-config/{key}", response_model=AdminSystemConfigResponse)
async def get_system_config(key: str, db: Annotated[AsyncSession, Depends(get_db)], _: Annotated[User, Depends(require_super_admin)]):
    return await SuperAdminService.get_config(db, key)


@router.get("/system-config", response_model=list[AdminSystemConfigResponse])
async def list_system_config(
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_super_admin)],
):
    from app.models.system_config import SystemConfig
    return (await db.execute(select(SystemConfig).order_by(SystemConfig.key.asc()))).scalars().all()


@router.put("/system-config", response_model=AdminSystemConfigResponse)
async def put_system_config(
    data: AdminSystemConfigUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    _: Annotated[User, Depends(require_super_admin)],
):
    return await SuperAdminService.update_config(db, data.key, data.value, data.description)


@router.put("/system-config/{key}", response_model=AdminSystemConfigResponse)
async def update_system_config(key: str, data: AdminSystemConfigUpdate, db: Annotated[AsyncSession, Depends(get_db)], _: Annotated[User, Depends(require_super_admin)]):
    return await SuperAdminService.update_config(db, key, data.value, data.description)
