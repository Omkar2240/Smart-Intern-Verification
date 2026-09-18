"""
Admin Service — business logic for verification review, audit logs, rosters, and college management.
"""

from datetime import datetime, timezone
import io
import csv
from uuid import UUID
from typing import BinaryIO

from fastapi import HTTPException, status
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.college import College
from app.models.identity_verification import IdentityVerification
from app.models.face_embedding import FaceEmbedding
from app.models.admin_audit_log import AdminAuditLog
from app.models.college_student_roster import CollegeStudentRoster
from app.schemas.admin import (
    AdminVerificationItem,
    AdminVerificationListResponse,
    AdminActionResponse,
    AdminCollegeCreate,
    AdminCollegeUpdate,
    AdminAnalyticsSummary,
    AdminRosterUploadResponse,
)


class AdminService:
    @staticmethod
    async def list_verifications(
        db: AsyncSession,
        status_filter: str | None = None,
        search: str | None = None,
        college_id: UUID | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> AdminVerificationListResponse:
        """
        List student verifications with filtering for the Admin Review Queue.
        """
        query = (
            select(IdentityVerification)
            .join(IdentityVerification.user)
            .outerjoin(IdentityVerification.college)
            .options(
                selectinload(IdentityVerification.user).selectinload(User.face_embeddings),
                selectinload(IdentityVerification.college),
            )
        )

        conditions = []
        if status_filter and status_filter != "all":
            if status_filter == "manual_review":
                conditions.append(IdentityVerification.college_id_status == "manual_review")
            elif status_filter == "verified":
                conditions.append(IdentityVerification.overall_status == "verified")
            elif status_filter == "rejected":
                conditions.append(IdentityVerification.overall_status == "rejected")
            elif status_filter == "pending":
                conditions.append(IdentityVerification.overall_status == "pending")

        if college_id:
            conditions.append(IdentityVerification.college_id == college_id)

        if search:
            search_pattern = f"%{search}%"
            conditions.append(
                or_(
                    User.name.ilike(search_pattern),
                    User.email.ilike(search_pattern),
                    User.registration_number.ilike(search_pattern),
                )
            )

        if conditions:
            query = query.where(and_(*conditions))

        # Count total
        count_query = (
            select(func.count(IdentityVerification.id))
            .join(IdentityVerification.user)
            .outerjoin(IdentityVerification.college)
        )
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total_res = await db.execute(count_query)
        total = total_res.scalar() or 0

        # Pagination & ordering (manual review first, then recent)
        query = query.order_by(
            (IdentityVerification.college_id_status == "manual_review").desc(),
            IdentityVerification.updated_at.desc(),
        ).offset((page - 1) * page_size).limit(page_size)

        result = await db.execute(query)
        records = result.scalars().all()

        items = []
        for r in records:
            items.append(
                AdminVerificationItem(
                    user_id=r.user_id,
                    user_name=r.user.name,
                    user_email=r.user.email,
                    registration_number=r.user.registration_number,
                    mobile_number=r.user.mobile_number,
                    college_id=r.college_id,
                    college_name=r.college.name if r.college else None,
                    college_status=r.college_status,
                    college_id_status=r.college_id_status,
                    face_status=r.face_status,
                    overall_status=r.overall_status,
                    extracted_metadata=r.extracted_metadata,
                    rejection_reason=r.rejection_reason,
                    has_card_image=bool(r.college_id_storage_ref),
                    has_face_embedding=bool(r.user.face_embeddings),
                    created_at=r.created_at,
                    verified_at=r.verified_at,
                )
            )

        return AdminVerificationListResponse(
            total=total,
            items=items,
            page=page,
            page_size=page_size,
        )

    @staticmethod
    async def get_verification_item(db: AsyncSession, user_id: UUID) -> IdentityVerification:
        result = await db.execute(
            select(IdentityVerification)
            .where(IdentityVerification.user_id == user_id)
            .options(
                selectinload(IdentityVerification.user).selectinload(User.face_embeddings),
                selectinload(IdentityVerification.college),
            )
        )
        iv = result.scalar_one_or_none()
        if not iv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Verification record not found for user",
            )
        return iv

    @staticmethod
    async def approve_verification(
        db: AsyncSession,
        user_id: UUID,
        admin_user: User,
        ip_address: str | None = None,
    ) -> AdminActionResponse:
        """
        Admin manually approves the student's College ID document.
        """
        iv = await AdminService.get_verification_item(db, user_id)

        iv.college_id_status = "verified"
        iv.rejection_reason = None

        # Check if face is also verified
        if iv.face_status == "verified":
            iv.overall_status = "verified"
            iv.verified_at = datetime.now(timezone.utc)
            iv.user.is_verified = True
        else:
            iv.overall_status = "pending"

        # Record audit log
        audit = AdminAuditLog(
            admin_id=admin_user.id,
            action="APPROVE_COLLEGE_ID",
            target_user_id=user_id,
            details={
                "college_id": str(iv.college_id) if iv.college_id else None,
                "overall_status": iv.overall_status,
            },
            ip_address=ip_address,
        )
        db.add(audit)
        await db.commit()
        await db.refresh(iv)

        return AdminActionResponse(
            success=True,
            message=f"College ID approved successfully. Current overall status: {iv.overall_status}",
            overall_status=iv.overall_status,
        )

    @staticmethod
    async def reject_verification(
        db: AsyncSession,
        user_id: UUID,
        reason: str,
        admin_user: User,
        ip_address: str | None = None,
    ) -> AdminActionResponse:
        """
        Admin rejects the student's College ID document with an explicit reason.
        """
        iv = await AdminService.get_verification_item(db, user_id)

        iv.college_id_status = "rejected"
        iv.overall_status = "rejected"
        iv.rejection_reason = reason
        iv.user.is_verified = False

        # Record audit log
        audit = AdminAuditLog(
            admin_id=admin_user.id,
            action="REJECT_COLLEGE_ID",
            target_user_id=user_id,
            details={"reason": reason},
            ip_address=ip_address,
        )
        db.add(audit)
        await db.commit()
        await db.refresh(iv)

        return AdminActionResponse(
            success=True,
            message=f"Verification rejected: {reason}",
            overall_status=iv.overall_status,
        )

    @staticmethod
    async def reset_biometrics(
        db: AsyncSession,
        user_id: UUID,
        admin_user: User,
        ip_address: str | None = None,
    ) -> AdminActionResponse:
        """
        Reset a student's facial biometric enrollment so they can re-enroll.
        """
        iv = await AdminService.get_verification_item(db, user_id)

        # Delete existing face embeddings
        await db.execute(select(FaceEmbedding).where(FaceEmbedding.user_id == user_id))
        embeddings_res = await db.execute(select(FaceEmbedding).where(FaceEmbedding.user_id == user_id))
        for emb in embeddings_res.scalars().all():
            await db.delete(emb)

        iv.face_status = "not_started"
        iv.overall_status = "pending"
        iv.user.is_verified = False

        # Record audit log
        audit = AdminAuditLog(
            admin_id=admin_user.id,
            action="RESET_BIOMETRICS",
            target_user_id=user_id,
            details={"message": "Biometric face embedding deleted for re-enrollment"},
            ip_address=ip_address,
        )
        db.add(audit)
        await db.commit()
        await db.refresh(iv)

        return AdminActionResponse(
            success=True,
            message="Student biometric face enrollment reset successfully",
            overall_status=iv.overall_status,
        )

    @staticmethod
    async def get_analytics_summary(db: AsyncSession) -> AdminAnalyticsSummary:
        """
        Retrieve high-level verification dashboard KPIs.
        """
        total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
        verified_users = (
            await db.execute(
                select(func.count(IdentityVerification.id)).where(IdentityVerification.overall_status == "verified")
            )
        ).scalar() or 0
        pending_reviews = (
            await db.execute(
                select(func.count(IdentityVerification.id)).where(IdentityVerification.college_id_status == "manual_review")
            )
        ).scalar() or 0
        rejected_verifications = (
            await db.execute(
                select(func.count(IdentityVerification.id)).where(IdentityVerification.overall_status == "rejected")
            )
        ).scalar() or 0
        active_colleges = (
            await db.execute(select(func.count(College.id)).where(College.is_active == True))  # noqa: E712
        ).scalar() or 0

        return AdminAnalyticsSummary(
            total_users=total_users,
            verified_users=verified_users,
            pending_reviews=pending_reviews,
            rejected_verifications=rejected_verifications,
            active_colleges=active_colleges,
        )

    @staticmethod
    async def create_college(db: AsyncSession, data: AdminCollegeCreate) -> College:
        college = College(
            name=data.name,
            city=data.city,
            state=data.state,
            country=data.country,
            code=data.code,
            is_active=True,
        )
        db.add(college)
        await db.commit()
        await db.refresh(college)
        return college

    @staticmethod
    async def update_college(db: AsyncSession, college_id: UUID, data: AdminCollegeUpdate) -> College:
        result = await db.execute(select(College).where(College.id == college_id))
        college = result.scalar_one_or_none()
        if not college:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found")

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(college, key, value)

        await db.commit()
        await db.refresh(college)
        return college

    @staticmethod
    async def import_roster_csv(
        db: AsyncSession,
        college_id: UUID,
        file_bytes: bytes,
    ) -> AdminRosterUploadResponse:
        """
        Parse CSV of student rosters: student_name, registration_number, email (optional), department (optional)
        """
        college = (await db.execute(select(College).where(College.id == college_id))).scalar_one_or_none()
        if not college:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found")

        try:
            content = file_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            content = file_bytes.decode("latin-1")

        reader = csv.DictReader(io.StringIO(content))
        added = 0
        skipped = 0

        for row in reader:
            reg_no = row.get("registration_number") or row.get("reg_no") or row.get("roll_number")
            name = row.get("student_name") or row.get("name")
            if not reg_no or not name:
                skipped += 1
                continue

            reg_no = reg_no.strip()
            name = name.strip()
            email = (row.get("email") or "").strip() or None
            department = (row.get("department") or "").strip() or None

            # Check if entry already exists
            existing = (
                await db.execute(
                    select(CollegeStudentRoster).where(
                        and_(
                            CollegeStudentRoster.college_id == college_id,
                            CollegeStudentRoster.registration_number == reg_no,
                        )
                    )
                )
            ).scalar_one_or_none()

            if existing:
                skipped += 1
                continue

            entry = CollegeStudentRoster(
                college_id=college_id,
                student_name=name,
                registration_number=reg_no,
                email=email,
                department=department,
            )
            db.add(entry)
            added += 1

        await db.commit()
        return AdminRosterUploadResponse(
            success=True,
            added_count=added,
            skipped_count=skipped,
            message=f"Roster import complete: {added} students added, {skipped} duplicate/invalid entries skipped.",
        )
