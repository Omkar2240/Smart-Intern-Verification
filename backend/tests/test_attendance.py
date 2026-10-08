import pytest
from datetime import datetime, timezone
from httpx import AsyncClient

from app.models.internship import Internship
from app.services.attendance_service import (
    calculate_haversine_distance,
    validate_shift_time,
)


def test_haversine_distance():
    # Distance between two identical coordinates is 0
    d0 = calculate_haversine_distance(12.9716, 77.5946, 12.9716, 77.5946)
    assert round(d0, 2) == 0.0

    # Short distance in Bangalore (~111 meters for ~0.001 deg lat)
    d1 = calculate_haversine_distance(12.9716, 77.5946, 12.9726, 77.5946)
    assert 100 < d1 < 120


def test_validate_shift_time_window():
    internship = Internship(
        shift_start_time="09:00",
        shift_end_time="17:00",
    )

    # 1. 08:44 is before the 15-minute grace period (starts at 08:45) -> Invalid
    early_dt = datetime(2026, 10, 9, 8, 44, tzinfo=timezone.utc)
    valid, msg = validate_shift_time(internship, early_dt)
    assert not valid
    assert "Shift starts at 09:00" in msg

    # 2. 08:46 is within the 15-minute grace period -> Valid
    grace_dt = datetime(2026, 10, 9, 8, 46, tzinfo=timezone.utc)
    valid, _ = validate_shift_time(internship, grace_dt)
    assert valid

    # 3. 12:30 is during shift -> Valid
    mid_dt = datetime(2026, 10, 9, 12, 30, tzinfo=timezone.utc)
    valid, _ = validate_shift_time(internship, mid_dt)
    assert valid

    # 4. 17:05 is after shift end -> Invalid
    late_dt = datetime(2026, 10, 9, 17, 5, tzinfo=timezone.utc)
    valid, msg = validate_shift_time(internship, late_dt)
    assert not valid
    assert "Shift ended at 17:00" in msg


def test_validate_shift_time_no_restriction():
    internship = Internship(
        shift_start_time=None,
        shift_end_time=None,
    )
    any_dt = datetime(2026, 10, 9, 23, 59, tzinfo=timezone.utc)
    valid, _ = validate_shift_time(internship, any_dt)
    assert valid


@pytest.mark.asyncio
async def test_offline_check_in_biometric_face_verification(client: AsyncClient, db_session, monkeypatch):
    """
    Test that offline check-in strictly requires face verification against the enrolled user,
    detects biometric mismatches from other persons, and only allows check-in when verified.
    """
    import uuid
    from app.models.identity_verification import IdentityVerification
    from app.models.face_embedding import FaceEmbedding
    from app.models.internship import Internship
    from tests.conftest import register_user

    # 1. Register student
    reg = await register_user(client)
    token = reg["access_token"]
    user_id = uuid.UUID(reg["user"]["id"])
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Mark identity verification as 'verified' in DB
    iv = IdentityVerification(
        user_id=user_id,
        college_status="selected",
        college_id_status="verified",
        face_status="verified",
        overall_status="verified",
    )
    db_session.add(iv)

    # 3. Add enrolled face embedding for user
    fake_embedding = b"\x00" * 2048
    emb = FaceEmbedding(
        user_id=user_id,
        model_name="ArcFace",
        model_version="1.0",
        embedding=fake_embedding,
        dimension=512,
        is_active=True,
        quality_score=0.95,
    )
    db_session.add(emb)

    # 4. Add active internship
    internship = Internship(
        user_id=user_id,
        company_name="Acme Corp",
        role="SWE Intern",
        internship_type="on_site",
        shift_start_time="00:00",
        shift_end_time="23:59",
        is_active=True,
    )
    db_session.add(internship)
    await db_session.commit()

    # 5. Offline check-in without face_image_base64 must fail with 400
    res_no_face = await client.post(
        "/api/v1/attendance/check-in",
        json={"work_mode": "offline", "latitude": 12.97, "longitude": 77.59},
        headers=headers,
    )
    assert res_no_face.status_code == 400
    assert "face verification is required" in res_no_face.json()["detail"].lower()

    # 6. Test /verify-face endpoint when another person's face is used (mock verify_against_stored returning mismatch)
    from app.services.face.service import face_service
    monkeypatch.setattr(
        face_service,
        "verify_against_stored",
        lambda face_bytes, enrolled_emb, threshold=0.65: (False, 0.23),
    )

    test_b64 = "dGVzdF9mYWNlX2ltYWdlX2Jhc2U2NA=="
    res_mismatch = await client.post(
        "/api/v1/attendance/verify-face",
        json={"face_image_base64": test_b64},
        headers=headers,
    )
    assert res_mismatch.status_code == 200
    data_mismatch = res_mismatch.json()
    assert data_mismatch["verified"] is False
    assert data_mismatch["match_score"] == 0.23
    assert "mismatch" in data_mismatch["message"].lower()

    # 7. Check-in with mismatched face must be BLOCKED
    res_checkin_mismatch = await client.post(
        "/api/v1/attendance/check-in",
        json={"work_mode": "offline", "latitude": 12.97, "longitude": 77.59, "face_image_base64": test_b64},
        headers=headers,
    )
    assert res_checkin_mismatch.status_code == 400
    assert "mismatch detected" in res_checkin_mismatch.json()["detail"].lower()

    # 8. Test when genuine enrolled user's face is verified
    monkeypatch.setattr(
        face_service,
        "verify_against_stored",
        lambda face_bytes, enrolled_emb, threshold=0.65: (True, 0.92),
    )

    res_verify_ok = await client.post(
        "/api/v1/attendance/verify-face",
        json={"face_image_base64": test_b64},
        headers=headers,
    )
    assert res_verify_ok.status_code == 200
    data_ok = res_verify_ok.json()
    assert data_ok["verified"] is True
    assert data_ok["match_score"] == 0.92

    # 9. Check-in with verified face must SUCCEED
    res_checkin_ok = await client.post(
        "/api/v1/attendance/check-in",
        json={"work_mode": "offline", "latitude": 12.97, "longitude": 77.59, "face_image_base64": test_b64},
        headers=headers,
    )
    assert res_checkin_ok.status_code == 200
    checkin_data = res_checkin_ok.json()
    assert checkin_data["status"] == "success"
    assert checkin_data["face_verified"] is True
    assert checkin_data["work_mode"] == "offline"
