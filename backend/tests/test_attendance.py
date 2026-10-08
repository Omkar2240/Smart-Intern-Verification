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
