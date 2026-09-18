"""
Tests for Admin Review Queue, Decisions, Biometric Resets, Analytics, and Roster Management.
"""

from uuid import uuid4
import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.college import College
from app.models.identity_verification import IdentityVerification
from app.models.face_embedding import FaceEmbedding
from app.models.admin_audit_log import AdminAuditLog
from app.models.college_student_roster import CollegeStudentRoster
from app.core.security import create_access_token
from tests.conftest import register_user


async def create_admin_user(db: AsyncSession, role: str = "college_admin") -> tuple[User, str]:
    """Helper to create an admin user and return (User, JWT token)."""
    uid = uuid4().hex[:6]
    admin = User(
        email=f"admin_{uid}@example.com",
        name="Admin User",
        registration_number=f"ADM_{uid}",
        mobile_number=f"99{uid.ljust(8, '0')[:8]}",
        password_hash="hashed_pw_placeholder",
        is_active=True,
        is_verified=True,
        role=role,
    )
    db.add(admin)
    await db.commit()
    await db.refresh(admin)
    token = create_access_token(admin.id)
    return admin, token


@pytest.mark.asyncio
async def test_admin_access_control(client: AsyncClient, db_session: AsyncSession):
    """Ensure student users get 403 Forbidden on admin endpoints."""
    # 1. Student access
    reg = await register_user(client)
    student_token = reg["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    resp = await client.get("/api/v1/admin/verifications", headers=student_headers)
    assert resp.status_code == 403
    assert "Administrative privileges required" in resp.json()["detail"]

    # 2. Admin access
    _, admin_token = await create_admin_user(db_session, role="college_admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    resp_admin = await client.get("/api/v1/admin/verifications", headers=admin_headers)
    assert resp_admin.status_code == 200
    assert "items" in resp_admin.json()
    assert "total" in resp_admin.json()


@pytest.mark.asyncio
async def test_admin_list_verifications_and_filtering(client: AsyncClient, db_session: AsyncSession):
    """Test listing verifications with status and search filters."""
    _, admin_token = await create_admin_user(db_session)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Create a college
    college = College(name="IIT Bombay", city="Mumbai", state="Maharashtra", country="India", code="IITB", is_active=True)
    db_session.add(college)
    await db_session.commit()
    await db_session.refresh(college)

    # Create 2 students with verifications
    student1 = User(
        email="rahul@iitb.ac.in",
        name="Rahul Sharma",
        registration_number="IITB2026_01",
        mobile_number="9111111111",
        password_hash="hashed_pw",
        role="student",
    )
    student2 = User(
        email="sneha@iitb.ac.in",
        name="Sneha Patil",
        registration_number="IITB2026_02",
        mobile_number="9222222222",
        password_hash="hashed_pw",
        role="student",
    )
    db_session.add_all([student1, student2])
    await db_session.commit()
    await db_session.refresh(student1)
    await db_session.refresh(student2)

    iv1 = IdentityVerification(
        user_id=student1.id,
        college_id=college.id,
        college_id_status="manual_review",
        face_status="verified",
        overall_status="pending",
    )
    iv2 = IdentityVerification(
        user_id=student2.id,
        college_id=college.id,
        college_id_status="verified",
        face_status="verified",
        overall_status="verified",
    )
    db_session.add_all([iv1, iv2])
    await db_session.commit()

    # Query all
    resp_all = await client.get("/api/v1/admin/verifications", headers=admin_headers)
    assert resp_all.status_code == 200
    data = resp_all.json()
    assert data["total"] == 2

    # Query manual_review only
    resp_mr = await client.get("/api/v1/admin/verifications?status=manual_review", headers=admin_headers)
    assert resp_mr.status_code == 200
    data_mr = resp_mr.json()
    assert data_mr["total"] == 1
    assert data_mr["items"][0]["user_name"] == "Rahul Sharma"

    # Query search
    resp_search = await client.get("/api/v1/admin/verifications?search=sneha", headers=admin_headers)
    assert resp_search.status_code == 200
    data_search = resp_search.json()
    assert data_search["total"] == 1
    assert data_search["items"][0]["user_email"] == "sneha@iitb.ac.in"


@pytest.mark.asyncio
async def test_admin_approve_and_reject_verification(client: AsyncClient, db_session: AsyncSession):
    """Test approving and rejecting student identity verification."""
    admin, admin_token = await create_admin_user(db_session)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    student = User(
        email="test_review@example.com",
        name="Review Candidate",
        registration_number="REV101",
        mobile_number="9333333333",
        password_hash="hashed_pw",
        role="student",
    )
    db_session.add(student)
    await db_session.commit()
    await db_session.refresh(student)

    iv = IdentityVerification(
        user_id=student.id,
        college_id_status="manual_review",
        face_status="verified",  # Face already verified
        overall_status="pending",
    )
    db_session.add(iv)
    await db_session.commit()

    # 1. Approve verification
    resp_approve = await client.post(
        f"/api/v1/admin/verifications/{student.id}/approve",
        headers=admin_headers,
    )
    assert resp_approve.status_code == 200
    assert resp_approve.json()["success"] is True
    assert resp_approve.json()["overall_status"] == "verified"

    # Verify DB state
    await db_session.refresh(iv)
    await db_session.refresh(student)
    assert iv.college_id_status == "verified"
    assert iv.overall_status == "verified"
    assert student.is_verified is True
    assert iv.verified_at is not None

    # Check Audit Log
    log = (
        await db_session.execute(
            select(AdminAuditLog).where(
                AdminAuditLog.admin_id == admin.id,
                AdminAuditLog.action == "APPROVE_COLLEGE_ID",
            )
        )
    ).scalar_one_or_none()
    assert log is not None
    assert log.target_user_id == student.id

    # 2. Reject verification
    resp_reject = await client.post(
        f"/api/v1/admin/verifications/{student.id}/reject",
        json={"reason": "ID Card photo is completely blurry and expired"},
        headers=admin_headers,
    )
    assert resp_reject.status_code == 200
    assert resp_reject.json()["success"] is True
    assert resp_reject.json()["overall_status"] == "rejected"

    await db_session.refresh(iv)
    await db_session.refresh(student)
    assert iv.college_id_status == "rejected"
    assert iv.overall_status == "rejected"
    assert iv.rejection_reason == "ID Card photo is completely blurry and expired"
    assert student.is_verified is False


@pytest.mark.asyncio
async def test_admin_reset_biometrics(client: AsyncClient, db_session: AsyncSession):
    """Test admin resetting a student's facial biometric enrollment."""
    admin, admin_token = await create_admin_user(db_session)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    student = User(
        email="biometric_reset@example.com",
        name="Bio Student",
        registration_number="BIO999",
        mobile_number="9444444444",
        password_hash="hashed_pw",
        role="student",
        is_verified=True,
    )
    db_session.add(student)
    await db_session.commit()
    await db_session.refresh(student)

    # Add mock face embedding
    emb = FaceEmbedding(
        user_id=student.id,
        embedding=b"\x01" * 1024,
        dimension=512,
        quality_score=0.95,
    )
    iv = IdentityVerification(
        user_id=student.id,
        college_id_status="verified",
        face_status="verified",
        overall_status="verified",
    )
    db_session.add_all([emb, iv])
    await db_session.commit()

    # Call reset biometrics
    resp_reset = await client.post(
        f"/api/v1/admin/verifications/{student.id}/reset-biometrics",
        headers=admin_headers,
    )
    assert resp_reset.status_code == 200
    assert resp_reset.json()["success"] is True

    # Verify embeddings deleted and status reverted
    remaining_embs = (
        await db_session.execute(select(FaceEmbedding).where(FaceEmbedding.user_id == student.id))
    ).scalars().all()
    assert len(remaining_embs) == 0

    await db_session.refresh(iv)
    await db_session.refresh(student)
    assert iv.face_status == "not_started"
    assert iv.overall_status == "pending"
    assert student.is_verified is False


@pytest.mark.asyncio
async def test_admin_analytics_summary(client: AsyncClient, db_session: AsyncSession):
    """Test analytics dashboard KPIs endpoint."""
    _, admin_token = await create_admin_user(db_session)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    resp = await client.get("/api/v1/admin/analytics/summary", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_users" in data
    assert "verified_users" in data
    assert "pending_reviews" in data
    assert "rejected_verifications" in data
    assert "active_colleges" in data


@pytest.mark.asyncio
async def test_admin_college_crud_and_roster_upload(client: AsyncClient, db_session: AsyncSession):
    """Test college creation, update, and student roster CSV upload."""
    _, admin_token = await create_admin_user(db_session)
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create college
    create_payload = {
        "name": "MIT World Peace University",
        "city": "Pune",
        "state": "Maharashtra",
        "country": "India",
        "code": "MITWPU",
    }
    resp_create = await client.post("/api/v1/admin/colleges", json=create_payload, headers=admin_headers)
    assert resp_create.status_code == 201
    college_data = resp_create.json()
    college_id = college_data["id"]
    assert college_data["name"] == "MIT World Peace University"

    # 2. Update college
    update_payload = {"city": "Kothrud, Pune"}
    resp_update = await client.put(f"/api/v1/admin/colleges/{college_id}", json=update_payload, headers=admin_headers)
    assert resp_update.status_code == 200
    assert resp_update.json()["city"] == "Kothrud, Pune"

    # 3. Upload student roster CSV
    csv_content = (
        "student_name,registration_number,email,department\n"
        "Aarav Sharma,MIT2026_CS_01,aarav@mitwpu.edu,Computer Science\n"
        "Diya Mehta,MIT2026_IT_02,diya@mitwpu.edu,Information Technology\n"
        "Aarav Sharma,MIT2026_CS_01,duplicate@mitwpu.edu,Computer Science\n"  # Duplicate reg_no
    )
    files = {"file": ("students.csv", csv_content.encode("utf-8"), "text/csv")}
    resp_roster = await client.post(
        f"/api/v1/admin/colleges/{college_id}/roster/upload",
        files=files,
        headers=admin_headers,
    )
    assert resp_roster.status_code == 200
    roster_res = resp_roster.json()
    assert roster_res["success"] is True
    assert roster_res["added_count"] == 2
    assert roster_res["skipped_count"] == 1

    # Verify records in database
    from uuid import UUID
    roster_entries = (
        await db_session.execute(
            select(CollegeStudentRoster).where(CollegeStudentRoster.college_id == UUID(college_id))
        )
    ).scalars().all()
    assert len(roster_entries) == 2
