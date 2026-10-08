"""
Tests for identity verification workflow: college selection, ID card upload, face enrollment.
"""

import io
import pytest
from httpx import AsyncClient
from PIL import Image, ImageDraw
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.college import College
from app.models.department import Department
from tests.conftest import register_user


def create_dummy_id_card(college_name: str = "G. H. Raisoni College", student_name: str = "Omkar Ramgirwar") -> bytes:
    """Generate a valid document image in memory."""
    img = Image.new("RGB", (600, 400), color=(240, 240, 245))
    draw = ImageDraw.Draw(img)
    draw.text((40, 40), college_name, fill=(10, 30, 80))
    draw.text((40, 100), f"Student Name: {student_name}", fill=(20, 20, 20))
    draw.text((40, 150), "Roll No: 2026ENG001", fill=(20, 20, 20))
    draw.text((40, 200), "Branch: Computer Science", fill=(20, 20, 20))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.mark.asyncio
async def test_verification_workflow(client: AsyncClient, db_session: AsyncSession):
    # Register test user
    reg = await register_user(client)
    token = reg["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Seed test college
    college = College(
        name="G. H. Raisoni College of Engineering, Nagpur",
        city="Nagpur",
        state="Maharashtra",
        country="India",
        code="GHRCEN",
        is_active=True,
    )
    db_session.add(college)
    await db_session.commit()
    await db_session.refresh(college)
    department = Department(
        college_id=college.id,
        name="Computer Science",
        code="CSE",
        is_active=True,
    )
    db_session.add(department)
    await db_session.commit()
    await db_session.refresh(department)

    # 1. Check initial status
    resp_init = await client.get("/api/v1/verification/status", headers=headers)
    assert resp_init.status_code == 200
    status_data = resp_init.json()
    assert status_data["is_verified"] is False
    assert status_data["current_step"] == "college_selection"
    assert status_data["overall_status"] == "not_started"

    # 2. Step 1: Select College
    resp_select = await client.post(
        "/api/v1/verification/college",
        json={"college_id": str(college.id)},
        headers=headers,
    )
    assert resp_select.status_code == 200
    assert resp_select.json()["step_status"] == "selected"

    # Status check should require department selection next
    resp_after_select = await client.get("/api/v1/verification/status", headers=headers)
    assert resp_after_select.json()["current_step"] == "department_selection"
    assert resp_after_select.json()["college_verified"] is True

    resp_department = await client.post(
        "/api/v1/verification/department",
        json={"department_id": str(department.id)},
        headers=headers,
    )
    assert resp_department.status_code == 200

    resp_after_department = await client.get("/api/v1/verification/status", headers=headers)
    assert resp_after_department.json()["current_step"] == "college_id"

    # 3. Step 2: Upload College ID Card
    id_card_bytes = create_dummy_id_card()
    files = {
        "file": ("college_id.jpg", id_card_bytes, "image/jpeg"),
    }
    resp_upload = await client.post(
        "/api/v1/verification/college-id",
        files=files,
        headers=headers,
    )
    assert resp_upload.status_code == 200
    upload_data = resp_upload.json()
    assert upload_data["success"] is True
    assert upload_data["step_status"] in ("verified", "manual_review")

    # Status check should advance to face step
    resp_after_id = await client.get("/api/v1/verification/status", headers=headers)
    assert resp_after_id.json()["current_step"] == "face"

    # 4. Step 3: Face Enrollment
    # Test rejection on non-image / corrupted
    resp_bad_face = await client.post(
        "/api/v1/verification/face",
        files={"file": ("bad.jpg", b"not-a-real-image", "image/jpeg")},
        headers=headers,
    )
    assert resp_bad_face.status_code == 400

    # Now simulate face enrollment via service mock or direct valid call
    from unittest.mock import patch
    from app.services.face.service import FaceEnrollmentResult

    mock_result = FaceEnrollmentResult(
        embedding_bytes=b"\x00" * 2048,
        quality_score=0.92,
        liveness_score=0.88,
        bbox=(50, 50, 150, 150),
        model_name="ArcFace",
        model_version="1.0",
    )

    with patch("app.services.verification_service.face_service.process_face_image", return_value=mock_result):
        valid_img_bytes = create_dummy_id_card()  # Valid image format
        resp_face = await client.post(
            "/api/v1/verification/face",
            files={"file": ("face.jpg", valid_img_bytes, "image/jpeg")},
            headers=headers,
        )
        assert resp_face.status_code == 200
        face_data = resp_face.json()
        assert face_data["step_status"] == "verified"

    # 5. Check completed status
    resp_final = await client.get("/api/v1/verification/status", headers=headers)
    final_data = resp_final.json()
    assert final_data["face_verified"] is True
    assert final_data["current_step"] == "completed"

    # 6. Multiples guard: Already verified user cannot re-select college, re-upload ID, or re-enroll face
    resp_reselect = await client.post(
        "/api/v1/verification/college",
        json={"college_id": str(college.id)},
        headers=headers,
    )
    assert resp_reselect.status_code == 400
    assert "already completed" in resp_reselect.json()["detail"].lower()


@pytest.mark.asyncio
async def test_duplicate_face_rejected(client: AsyncClient, db_session: AsyncSession):
    """
    Ensure that if another user tries to enroll with an existing registered user's face,
    the system detects 1:N duplicate face match and rejects with HTTP 409.
    """
    from unittest.mock import patch
    import numpy as np
    from app.services.face.recognizer import recognizer
    from app.services.face.service import FaceEnrollmentResult

    # User 1 registers and verifies face
    reg1 = await register_user(
        client,
        {
            "name": "Original User",
            "email": "orig.user@example.com",
            "registration_number": "2026ORIG001",
            "mobile_number": "9998881111",
            "password": "StrongPassword@123",
        },
    )
    token1 = reg1["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    college = College(
        name="Raisoni Institute of Information Tech",
        city="Nagpur",
        state="Maharashtra",
        country="India",
        code="RIIT",
        is_active=True,
    )
    db_session.add(college)
    await db_session.commit()
    await db_session.refresh(college)

    department = Department(
        college_id=college.id,
        name="Computer Science",
        code="CSE",
        is_active=True,
    )
    db_session.add(department)
    await db_session.commit()
    await db_session.refresh(department)

    await client.post("/api/v1/verification/college", json={"college_id": str(college.id)}, headers=headers1)
    await client.post("/api/v1/verification/department", json={"department_id": str(department.id)}, headers=headers1)
    await client.post(
        "/api/v1/verification/college-id",
        files={"file": ("id1.jpg", create_dummy_id_card(student_name="Original User"), "image/jpeg")},
        headers=headers1,
    )

    # Standard deterministic embedding for Face A
    rng = np.random.default_rng(999)
    emb_a = rng.normal(0, 1, 512).astype(np.float32)
    emb_a /= np.linalg.norm(emb_a)
    emb_bytes_a = recognizer.embedding_to_bytes(emb_a)

    mock_res_a = FaceEnrollmentResult(
        embedding_bytes=emb_bytes_a,
        quality_score=0.95,
        liveness_score=0.92,
        bbox=(50, 50, 150, 150),
        model_name="ArcFace",
        model_version="1.0",
    )

    with patch("app.services.verification_service.face_service.process_face_image", return_value=mock_res_a):
        resp1 = await client.post(
            "/api/v1/verification/face",
            files={"file": ("face1.jpg", create_dummy_id_card(), "image/jpeg")},
            headers=headers1,
        )
        assert resp1.status_code == 200

    # User 2 registers new account
    reg2 = await register_user(
        client,
        {
            "name": "Second User",
            "email": "second.user@example.com",
            "registration_number": "2026SEC002",
            "mobile_number": "9998882222",
            "password": "StrongPassword@123",
        },
    )
    token2 = reg2["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    await client.post("/api/v1/verification/college", json={"college_id": str(college.id)}, headers=headers2)
    await client.post("/api/v1/verification/department", json={"department_id": str(department.id)}, headers=headers2)
    await client.post(
        "/api/v1/verification/college-id",
        files={"file": ("id2.jpg", create_dummy_id_card(student_name="Second User"), "image/jpeg")},
        headers=headers2,
    )

    # User 2 attempts to use User 1's face
    with patch("app.services.verification_service.face_service.process_face_image", return_value=mock_res_a):
        resp_dup = await client.post(
            "/api/v1/verification/face",
            files={"file": ("face_dup.jpg", create_dummy_id_card(), "image/jpeg")},
            headers=headers2,
        )
        assert resp_dup.status_code == 409
        assert "already registered" in resp_dup.json()["detail"].lower()


@pytest.mark.asyncio
async def test_face_validation_probe(client: AsyncClient):
    reg = await register_user(client)
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    # Blank/empty image test
    resp = await client.post(
        "/api/v1/verification/face/validate",
        files={"file": ("probe.jpg", b"", "image/jpeg")},
        headers=headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["detected"] is False
    assert "No image data" in data["message"]

