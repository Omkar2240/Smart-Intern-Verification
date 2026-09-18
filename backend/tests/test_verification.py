"""
Tests for identity verification workflow: college selection, ID card upload, face enrollment.
"""

import io
import pytest
from httpx import AsyncClient
from PIL import Image, ImageDraw
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.college import College
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

    # Status check should show current_step is now college_id
    resp_after_select = await client.get("/api/v1/verification/status", headers=headers)
    assert resp_after_select.json()["current_step"] == "college_id"
    assert resp_after_select.json()["college_verified"] is True

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
