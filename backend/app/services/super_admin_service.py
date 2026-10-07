"""Platform-wide super-admin operations kept separate from review workflows."""

import uuid
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.constants import (
    ADMIN_ROLES,
    ACTIVE_STATUS,
    COLLEGE_ADMIN_ROLE,
    DEPARTMENT_ADMIN_ROLE,
    DEFAULT_INTERNSHIP_STATUS,
    DEFAULT_USER_ROLE,
    DEFAULT_VERIFICATION_STATUS,
    COMPLETED_INTERNSHIP_STATUS,
    SUPER_ADMIN_ROLE,
    ADMIN_PERMISSION_KEYS,
)
from app.core.security import hash_password
from app.models.admin_audit_log import AdminAuditLog
from app.models.college import College
from app.models.department import Department
from app.models.identity_verification import IdentityVerification
from app.models.internship import Internship
from app.models.system_config import SystemConfig
from app.models.user import User
from app.schemas.admin import (
    AdminAuditLogResponse,
    AdminDepartmentCreate,
    AdminDepartmentResponse,
    AdminDepartmentUpdate,
    AdminStudentCreate,
    AdminStudentResponse,
    AdminStudentUpdate,
    AdminSystemConfigResponse,
    AdminUserCreate,
    AdminUserResponse,
)


def _not_found(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class SuperAdminService:
    @staticmethod
    async def list_colleges(
        db: AsyncSession, search: str | None, include_inactive: bool, page: int, page_size: int
    ) -> dict:
        conditions = []
        if not include_inactive:
            conditions.append(College.is_active.is_(True))
        if search and search.strip():
            term = f"%{search.strip()}%"
            conditions.append(
                or_(
                    College.name.ilike(term),
                    College.city.ilike(term),
                    College.state.ilike(term),
                    College.code.ilike(term),
                )
            )

        predicate = and_(*conditions) if conditions else None
        count_stmt = select(func.count(College.id))
        query = select(College).order_by(College.name.asc())
        if predicate is not None:
            count_stmt = count_stmt.where(predicate)
            query = query.where(predicate)
        total = (await db.execute(count_stmt)).scalar_one()
        rows = (
            await db.execute(
                query.offset((page - 1) * page_size).limit(page_size)
            )
        ).scalars().all()
        return {"total": total, "page": page, "page_size": page_size, "items": rows}

    @staticmethod
    async def list_departments(
        db: AsyncSession, college_id: UUID | None, search: str | None, page: int,
        page_size: int, actor: User | None = None,
    ) -> dict:
        conditions = []
        if actor and actor.role in (COLLEGE_ADMIN_ROLE, DEPARTMENT_ADMIN_ROLE):
            if not actor.college_id:
                raise HTTPException(status_code=403, detail="College admin is not assigned to a college")
            if college_id and college_id != actor.college_id:
                raise HTTPException(status_code=403, detail="You can only access your college")
            college_id = actor.college_id
            if actor.role == DEPARTMENT_ADMIN_ROLE:
                if not actor.department_id:
                    raise HTTPException(
                        status_code=403,
                        detail="Department admin is not assigned to a department",
                    )
                conditions.append(Department.id == actor.department_id)
        if college_id:
            conditions.append(Department.college_id == college_id)
        if search and search.strip():
            term = f"%{search.strip()}%"
            conditions.append(or_(Department.name.ilike(term), Department.code.ilike(term)))

        count_stmt = select(func.count(Department.id))
        query = select(Department).options(selectinload(Department.college))
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
            query = query.where(and_(*conditions))
        total = (await db.execute(count_stmt)).scalar_one()
        rows = (
            await db.execute(
                query.order_by(Department.name.asc())
                .offset((page - 1) * page_size)
                .limit(page_size)
            )
        ).scalars().all()
        items = []
        for row in rows:
            student_count = (
                await db.execute(
                    select(func.count(User.id)).where(
                        User.department_id == row.id, User.role == DEFAULT_USER_ROLE
                    )
                )
            ).scalar_one()
            # Count active internships where the department string matches this department's code
            active_internships = (
                await db.execute(
                    select(func.count(Internship.id)).where(
                        Internship.department == row.code, Internship.is_active == True
                    )
                )
            ).scalar_one()
            items.append(
                AdminDepartmentResponse.model_validate(
                    {**row.__dict__, "student_count": student_count, "active_internships": active_internships}
                )
            )
        return {"total": total, "page": page, "page_size": page_size, "items": items}

    @staticmethod
    async def create_department(
        db: AsyncSession, data: AdminDepartmentCreate, actor: User | None = None
    ) -> Department:
        if actor and actor.role == COLLEGE_ADMIN_ROLE and actor.college_id != data.college_id:
            raise HTTPException(status_code=403, detail="You can only manage your college")
        college = await db.get(College, data.college_id)
        if not college or not college.is_active:
            raise _not_found("College not found")
        duplicate = await db.execute(
            select(Department).where(
                Department.college_id == data.college_id, Department.code == data.code.strip()
            )
        )
        if duplicate.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Department code already exists for this college")
        department = Department(
            college_id=data.college_id,
            name=data.name.strip(),
            code=data.code.strip().upper(),
            hod_name=data.hod_name,
            hod_email=data.hod_email,
        )
        db.add(department)
        await db.commit()
        await db.refresh(department)
        return department

    @staticmethod
    async def update_department(
        db: AsyncSession, department_id: UUID, data: AdminDepartmentUpdate,
        actor: User | None = None,
    ) -> Department:
        department = await db.get(Department, department_id)
        if not department:
            raise _not_found("Department not found")
        if actor and actor.role == COLLEGE_ADMIN_ROLE and actor.college_id != department.college_id:
            raise HTTPException(status_code=403, detail="You can only manage your college")
        if actor and actor.role == DEPARTMENT_ADMIN_ROLE:
            if not actor.department_id:
                raise HTTPException(
                    status_code=403,
                    detail="Department admin is not assigned to a department",
                )
            if actor.department_id != department.id:
                raise HTTPException(status_code=403, detail="You can only manage your department")
        values = data.model_dump(exclude_unset=True)
        if "code" in values:
            values["code"] = values["code"].strip().upper()
            duplicate = await db.execute(
                select(Department).where(
                    Department.college_id == department.college_id,
                    Department.code == values["code"],
                    Department.id != department.id,
                )
            )
            if duplicate.scalar_one_or_none():
                raise HTTPException(status_code=409, detail="Department code already exists for this college")
        for key, value in values.items():
            setattr(department, key, value.strip() if isinstance(value, str) else value)
        await db.commit()
        await db.refresh(department)
        return department

    @staticmethod
    async def list_admins(
        db: AsyncSession, role: str | None, college_id: UUID | None, search: str | None,
        page: int, page_size: int, actor: User | None = None,
    ) -> dict:
        conditions = [User.role.in_(ADMIN_ROLES)]
        if actor and actor.role == COLLEGE_ADMIN_ROLE:
            if not actor.college_id:
                raise HTTPException(status_code=403, detail="College admin is not assigned to a college")
            if college_id and college_id != actor.college_id:
                raise HTTPException(status_code=403, detail="You can only access your college")
            college_id = actor.college_id
            # College admins manage department admins only. Enforce this in the
            # service so callers cannot widen the list by omitting the role filter.
            role = "department_admin"
        if role:
            if role not in ADMIN_ROLES:
                raise HTTPException(status_code=400, detail="Invalid administrator role")
            conditions.append(User.role == role)
        if college_id:
            conditions.append(User.college_id == college_id)
        if search and search.strip():
            term = f"%{search.strip()}%"
            conditions.append(or_(User.name.ilike(term), User.email.ilike(term)))
        total = (await db.execute(select(func.count(User.id)).where(and_(*conditions)))).scalar_one()
        rows = (
            await db.execute(
                select(User)
                .options(selectinload(User.college), selectinload(User.department))
                .where(and_(*conditions))
                .order_by(User.created_at.desc())
                .offset((page - 1) * page_size).limit(page_size)
            )
        ).scalars().all()
        return {
            "total": total, "page": page, "page_size": page_size,
            "items": [
                AdminUserResponse.model_validate(
                    {
                        **row.__dict__,
                        "college_name": row.college.name if row.college else None,
                        "department_name": row.department.name if row.department else None,
                    }
                )
                for row in rows
            ],
        }

    @staticmethod
    async def create_admin(
        db: AsyncSession, data: AdminUserCreate, actor: User | None = None
    ) -> User:
        if data.role not in ADMIN_ROLES or data.role == SUPER_ADMIN_ROLE:
            raise HTTPException(status_code=400, detail="Only college_admin, department_admin, and admin users can be created")
        unknown_permissions = sorted(set(data.permissions) - ADMIN_PERMISSION_KEYS)
        if unknown_permissions:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown permissions: {', '.join(unknown_permissions)}",
            )
        if data.role == DEPARTMENT_ADMIN_ROLE and not data.department_id:
            raise HTTPException(status_code=400, detail="Department is required for a department admin")
        if actor and actor.role == COLLEGE_ADMIN_ROLE:
            if not actor.college_id:
                raise HTTPException(status_code=403, detail="College admin is not assigned to a college")
            if data.role != DEPARTMENT_ADMIN_ROLE:
                raise HTTPException(
                    status_code=403,
                    detail="College admins can only create department admins for their college",
                )
            # The authenticated admin's college is authoritative. Do not trust
            # a client-supplied college_id, including a missing value.
            data.college_id = actor.college_id
        if data.department_id:
            department = await db.get(Department, data.department_id)
            if not department:
                raise HTTPException(status_code=400, detail="Department not found")
            if data.college_id and department.college_id != data.college_id:
                raise HTTPException(status_code=400, detail="Department does not belong to the selected college")
            if not data.college_id:
                data.college_id = department.college_id
        if actor and actor.role == COLLEGE_ADMIN_ROLE and data.department_id:
            department = await db.get(Department, data.department_id)
            if not department or department.college_id != actor.college_id:
                raise HTTPException(status_code=403, detail="Department does not belong to your college")
        existing = await db.execute(select(User).where(User.email == data.email.lower().strip()))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email is already registered")
        user = User(
            name=data.name.strip(), email=data.email.lower().strip(),
            registration_number=f"ADMIN-{uuid.uuid4().hex}"[:50],
            mobile_number=f"admin-{uuid.uuid4().hex[:12]}",
            password_hash=hash_password(data.password), role=data.role,
            college_id=data.college_id, department_id=data.department_id,
            permissions=data.permissions,
            is_active=True, is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def set_admin_status(db: AsyncSession, admin_id: UUID, is_active: bool) -> User:
        user = await db.get(User, admin_id)
        if not user or user.role not in ADMIN_ROLES:
            raise _not_found("Administrator not found")
        user.is_active = is_active
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def list_students(
        db: AsyncSession, college_id: UUID | None, department_id: UUID | None,
        verification_status: str | None, search: str | None, page: int, page_size: int,
        actor: User | None = None,
    ) -> dict:
        conditions = [User.role == DEFAULT_USER_ROLE]
        if actor and actor.role == COLLEGE_ADMIN_ROLE:
            if not actor.college_id:
                raise HTTPException(status_code=403, detail="College admin is not assigned to a college")
            if college_id and college_id != actor.college_id:
                raise HTTPException(status_code=403, detail="You can only access your college")
            college_id = actor.college_id
        elif actor and actor.role == DEPARTMENT_ADMIN_ROLE:
            if not actor.college_id or not actor.department_id:
                raise HTTPException(
                    status_code=403,
                    detail="Department admin is not assigned to a college and department",
                )
            if college_id and college_id != actor.college_id:
                raise HTTPException(status_code=403, detail="You can only access your college")
            if department_id and department_id != actor.department_id:
                raise HTTPException(status_code=403, detail="You can only access your department")
            college_id = actor.college_id
            department_id = actor.department_id
        if college_id:
            conditions.append(
                or_(
                    User.college_id == college_id,
                    IdentityVerification.college_id == college_id,
                )
            )
        if department_id:
            conditions.append(User.department_id == department_id)
        if verification_status:
            conditions.append(IdentityVerification.overall_status == verification_status)
        if search and search.strip():
            term = f"%{search.strip()}%"
            conditions.append(or_(User.name.ilike(term), User.email.ilike(term), User.registration_number.ilike(term)))
        base = select(User).outerjoin(IdentityVerification).options(
            selectinload(User.college), selectinload(User.department),
            selectinload(User.identity_verification).selectinload(IdentityVerification.college),
            selectinload(User.internships)
        ).where(and_(*conditions))
        total = (await db.execute(select(func.count(User.id)).outerjoin(IdentityVerification).where(and_(*conditions)))).scalar_one()
        rows = (await db.execute(base.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size))).scalars().unique().all()
        items = []
        for row in rows:
            internship_status = ACTIVE_STATUS if any(i.is_active for i in row.internships) else (COMPLETED_INTERNSHIP_STATUS if row.internships else DEFAULT_INTERNSHIP_STATUS)
            effective_college = row.college
            if not effective_college and row.identity_verification:
                effective_college = row.identity_verification.college
            items.append(AdminStudentResponse(
                id=row.id, name=row.name, email=row.email, registration_number=row.registration_number,
                mobile_number=row.mobile_number,
                college_id=effective_college.id if effective_college else None,
                college_name=effective_college.name if effective_college else None,
                department_id=row.department_id, department_name=row.department.name if row.department else None,
                verification_status=row.identity_verification.overall_status if row.identity_verification else DEFAULT_VERIFICATION_STATUS,
                internship_status=internship_status, is_verified=row.is_verified, created_at=row.created_at,
            ))
        return {"total": total, "page": page, "page_size": page_size, "items": items}

    @staticmethod
    async def create_student(
        db: AsyncSession, data: AdminStudentCreate, actor: User
    ) -> AdminStudentResponse:
        if actor.role == COLLEGE_ADMIN_ROLE:
            if not actor.college_id:
                raise HTTPException(status_code=403, detail="College admin is not assigned to a college")
            if data.college_id and actor.college_id != data.college_id:
                raise HTTPException(status_code=403, detail="You can only create students for your college")
            data.college_id = actor.college_id
        if not data.college_id:
            raise HTTPException(status_code=422, detail="College is required")
        if not data.department_id:
            raise HTTPException(status_code=422, detail="Department is required")
        if actor.role == COLLEGE_ADMIN_ROLE and actor.college_id != data.college_id:
            raise HTTPException(status_code=403, detail="You can only create students for your college")
        college = await db.get(College, data.college_id)
        if not college or not college.is_active:
            raise _not_found("College not found")
        department = None
        department = await db.get(Department, data.department_id)
        if not department or department.college_id != data.college_id or not department.is_active:
            raise HTTPException(status_code=400, detail="Department does not belong to the selected college")
        registration_number = (data.registration_number or f"PENDING-{uuid.uuid4().hex}").strip()[:50]
        email = (data.email or f"pending-{uuid.uuid4().hex}@student.local").lower().strip()
        mobile_number = (data.mobile_number or f"pending-{uuid.uuid4().hex[:12]}").strip()
        duplicate = await db.execute(
            select(User).where(
                or_(
                    User.email == email,
                    User.registration_number == registration_number,
                    User.mobile_number == mobile_number,
                )
            )
        )
        if duplicate.scalar_one_or_none():
            raise HTTPException(status_code=409, detail="Email, registration number, or mobile number is already registered")
        student = User(
            name=data.name.strip(),
            email=email,
            registration_number=registration_number,
            mobile_number=mobile_number,
            password_hash=hash_password(data.password or uuid.uuid4().hex),
            role=DEFAULT_USER_ROLE,
            college_id=data.college_id,
            department_id=data.department_id,
            is_active=True,
            is_verified=False,
        )
        db.add(student)
        await db.commit()
        await db.refresh(student)
        return AdminStudentResponse(
            id=student.id, name=student.name, email=student.email,
            registration_number=student.registration_number,
            mobile_number=student.mobile_number, college_id=student.college_id,
            college_name=college.name, department_id=student.department_id,
            department_name=department.name if department else None,
            verification_status=DEFAULT_VERIFICATION_STATUS,
            internship_status=DEFAULT_INTERNSHIP_STATUS,
            is_verified=student.is_verified, created_at=student.created_at,
        )

    @staticmethod
    async def update_student(
        db: AsyncSession, student_id: UUID, data: AdminStudentUpdate, actor: User
    ) -> AdminStudentResponse:
        student = await db.get(User, student_id)
        if not student or student.role != DEFAULT_USER_ROLE:
            raise _not_found("Student not found")
        if actor.role == COLLEGE_ADMIN_ROLE:
            if not actor.college_id or student.college_id != actor.college_id:
                raise HTTPException(status_code=403, detail="You can only manage students in your college")
            if data.college_id and data.college_id != actor.college_id:
                raise HTTPException(status_code=403, detail="You can only assign students to your college")

        values = data.model_dump(exclude_unset=True)
        if "college_id" in values and values["college_id"] is None:
            raise HTTPException(status_code=422, detail="College cannot be cleared")
        if "department_id" in values and values["department_id"] is None:
            raise HTTPException(status_code=422, detail="Department cannot be cleared")
        target_college_id = values.get("college_id", student.college_id)
        target_department_id = values.get("department_id", student.department_id)
        if not target_college_id:
            raise HTTPException(status_code=422, detail="College is required")
        if not target_department_id:
            raise HTTPException(status_code=422, detail="Department is required")
        college = await db.get(College, target_college_id)
        department = await db.get(Department, target_department_id)
        if not college or not college.is_active:
            raise _not_found("College not found")
        if not department or not department.is_active or department.college_id != target_college_id:
            raise HTTPException(status_code=400, detail="Department does not belong to the selected college")

        normalized = {}
        for key, value in values.items():
            if key == "password":
                normalized["password_hash"] = hash_password(value)
            elif key in {"name", "registration_number", "mobile_number"}:
                normalized[key] = value.strip()
            elif key == "email":
                normalized[key] = value.lower().strip()
            else:
                normalized[key] = value
        normalized["college_id"] = target_college_id
        normalized["department_id"] = target_department_id
        duplicate_fields = [
            getattr(User, key) == value
            for key, value in normalized.items()
            if key in {"email", "registration_number", "mobile_number"}
        ]
        if duplicate_fields:
            duplicate = await db.execute(
                select(User).where(User.id != student.id, or_(*duplicate_fields))
            )
            if duplicate.scalar_one_or_none():
                raise HTTPException(status_code=409, detail="Email, registration number, or mobile number is already registered")
        for key, value in normalized.items():
            setattr(student, key, value)
        await db.commit()
        refreshed = await db.execute(
            select(User)
            .options(
                selectinload(User.college),
                selectinload(User.department),
                selectinload(User.identity_verification),
                selectinload(User.internships),
            )
            .where(User.id == student.id)
        )
        student = refreshed.scalar_one()
        internship_status = (
            ACTIVE_STATUS
            if any(internship.is_active for internship in student.internships)
            else (COMPLETED_INTERNSHIP_STATUS if student.internships else DEFAULT_INTERNSHIP_STATUS)
        )
        return AdminStudentResponse(
            id=student.id, name=student.name, email=student.email,
            registration_number=student.registration_number, mobile_number=student.mobile_number,
            college_id=student.college_id, college_name=college.name,
            department_id=student.department_id, department_name=department.name,
            verification_status=(
                student.identity_verification.overall_status
                if student.identity_verification
                else DEFAULT_VERIFICATION_STATUS
            ),
            internship_status=internship_status,
            is_verified=student.is_verified, created_at=student.created_at,
        )

    @staticmethod
    async def list_audit_logs(db: AsyncSession, action: str | None, page: int, page_size: int) -> dict:
        conditions = [AdminAuditLog.action == action] if action else []
        total = (await db.execute(select(func.count(AdminAuditLog.id)).where(and_(*conditions) if conditions else True))).scalar_one()
        rows = (await db.execute(
            select(AdminAuditLog).where(and_(*conditions) if conditions else True)
            .order_by(AdminAuditLog.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        )).scalars().all()
        return {"total": total, "page": page, "page_size": page_size, "items": rows}

    @staticmethod
    async def get_config(db: AsyncSession, key: str) -> SystemConfig:
        config = await db.get(SystemConfig, key)
        if not config:
            raise _not_found("System configuration key not found")
        return config

    @staticmethod
    async def update_config(db: AsyncSession, key: str, value: dict, description: str | None) -> SystemConfig:
        config = await db.get(SystemConfig, key)
        if config:
            config.value = value
            if description is not None:
                config.description = description
        else:
            config = SystemConfig(key=key, value=value, description=description)
            db.add(config)
        await db.commit()
        await db.refresh(config)
        return config
