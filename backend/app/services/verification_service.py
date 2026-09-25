"""
Verification Service — manages the multi-step identity verification onboarding workflow.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional, Tuple

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.college import College
from app.models.face_embedding import FaceEmbedding
from app.models.identity_verification import IdentityVerification
from app.models.user import User
from app.schemas.verification import VerificationStatusResponse
from app.services.document.verifier import college_id_verifier
from app.services.face.service import face_service, FaceError
from app.storage.local import LocalStorage


class VerificationServiceError(Exception):
    """Base exception for verification domain errors."""
    def __init__(self, detail: str, status_code: int = 400):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


class VerificationService:
    """
    Coordinates verification steps and enforces database-backed status transitions.
    """

    def __init__(self):
        self.storage = LocalStorage()
        self.doc_verifier = college_id_verifier
        self.face_service = face_service

    async def get_or_create_verification(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> IdentityVerification:
        """Fetch existing verification record or create an initial one."""
        stmt = (
            select(IdentityVerification)
            .options(selectinload(IdentityVerification.college))
            .where(IdentityVerification.user_id == user_id)
        )
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()

        if record is None:
            record = IdentityVerification(
                user_id=user_id,
                college_status="not_started",
                college_id_status="not_started",
                face_status="not_started",
                overall_status="not_started",
            )
            db.add(record)
            await db.commit()
            await db.refresh(record)

        return record

    async def get_status(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
    ) -> VerificationStatusResponse:
        """Calculate and return full verification status."""
        record = await self.get_or_create_verification(db, user_id)

        college_name = None
        if record.college:
            college_name = record.college.name

        return VerificationStatusResponse(
            is_verified=record.overall_status == "verified",
            current_step=record.current_step,
            college_id=record.college_id,
            college_name=college_name,
            college_verified=record.college_status == "selected",
            college_id_verified=record.college_id_status in ("verified", "manual_review"),
            college_id_status=record.college_id_status,
            face_verified=record.face_status == "verified",
            face_status=record.face_status,
            overall_status=record.overall_status,
            rejection_reason=record.rejection_reason,
        )

    async def select_college(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        college_id: uuid.UUID,
    ) -> IdentityVerification:
        """Select college for the user."""
        # Validate college
        college_stmt = select(College).where(College.id == college_id, College.is_active.is_(True))
        college_res = await db.execute(college_stmt)
        college = college_res.scalar_one_or_none()

        if not college:
            raise VerificationServiceError("Selected college does not exist or is inactive.", status_code=404)

        record = await self.get_or_create_verification(db, user_id)

        record.college_id = college.id
        record.college_status = "selected"
        # If overall status was not started, advance to pending
        if record.overall_status == "not_started":
            record.overall_status = "pending"

        await db.commit()
        await db.refresh(record)
        return record

    async def upload_college_id(
        self,
        db: AsyncSession,
        user: User,
        file_bytes: bytes,
        content_type: str,
    ) -> Tuple[IdentityVerification, dict]:
        """Validate and verify college ID document."""
        record = await self.get_or_create_verification(db, user.id)

        if record.college_status != "selected" or not record.college_id:
            raise VerificationServiceError(
                "Please select your college before uploading your college ID card.",
                status_code=400,
            )

        # Fetch college details
        college_stmt = select(College).where(College.id == record.college_id)
        college_res = await db.execute(college_stmt)
        college = college_res.scalar_one_or_none()
        if not college:
            raise VerificationServiceError("College record not found.", status_code=404)

        # Run document verification
        verif_result = self.doc_verifier.verify_document(
            image_bytes=file_bytes,
            content_type=content_type,
            user=user,
            college=college,
        )

        if verif_result.status == "rejected":
            record.college_id_status = "rejected"
            record.rejection_reason = verif_result.rejection_reason
            record.extracted_metadata = verif_result.extracted_fields
            await db.commit()
            await db.refresh(record)
            raise VerificationServiceError(
                verif_result.rejection_reason or "College ID card rejected.",
                status_code=400,
            )

        # Save file securely to local storage
        storage_ref = await self.storage.save_file(
            file_content=file_bytes,
            content_type=content_type,
            subdirectory="college_ids",
        )

        record.college_id_storage_ref = storage_ref
        record.college_id_status = verif_result.status  # "verified" or "manual_review"
        record.extracted_metadata = {
            **verif_result.extracted_fields,
            "review_notes": verif_result.review_notes,
            "match_score": verif_result.match_score,
        }
        record.rejection_reason = None

        self._recompute_overall_status(record)

        await db.commit()
        await db.refresh(record)
        return record, record.extracted_metadata

    async def enroll_face(
        self,
        db: AsyncSession,
        user: User,
        image_bytes: bytes,
    ) -> IdentityVerification:
        """Run face detection, quality, liveness, and store ArcFace embedding."""
        record = await self.get_or_create_verification(db, user.id)

        if record.college_id_status not in ("verified", "manual_review"):
            raise VerificationServiceError(
                "Please complete and submit your college ID verification before face enrollment.",
                status_code=400,
            )

        try:
            face_result = self.face_service.process_face_image(image_bytes)
        except Exception as e:
            record.face_status = "rejected"
            record.rejection_reason = str(e)
            await db.commit()
            raise VerificationServiceError(str(e), status_code=400)

        # Deactivate any previous embeddings for this user
        await db.execute(
            update(FaceEmbedding)
            .where(FaceEmbedding.user_id == user.id)
            .values(is_active=False)
        )

        # Store new active face embedding
        embedding_record = FaceEmbedding(
            user_id=user.id,
            model_name=face_result.model_name,
            model_version=face_result.model_version,
            embedding=face_result.embedding_bytes,
            dimension=512,
            is_active=True,
            quality_score=face_result.quality_score,
        )
        db.add(embedding_record)

        record.face_status = "verified"
        record.rejection_reason = None
        self._recompute_overall_status(record)

        if record.overall_status == "verified":
            user.is_verified = True
            db.add(user)

        await db.commit()
        await db.refresh(record)
        return record

    def _recompute_overall_status(self, record: IdentityVerification):
        """Update overall status based on sub-step statuses."""
        if (
            record.college_status == "selected"
            and record.face_status == "verified"
        ):
            if record.college_id_status == "verified":
                record.overall_status = "verified"
                record.verified_at = datetime.now(timezone.utc)
            elif record.college_id_status == "manual_review":
                record.overall_status = "manual_review"
            else:
                record.overall_status = "pending"
        else:
            record.overall_status = "pending"


verification_service = VerificationService()
