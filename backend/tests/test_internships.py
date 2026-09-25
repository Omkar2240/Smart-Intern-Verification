"""
Tests for Internship CRUD and verification stage updates.
"""

import pytest
from httpx import AsyncClient

from tests.conftest import register_user


@pytest.mark.asyncio
async def test_internship_crud_and_status(client: AsyncClient):
    # 1. Register & login user
    reg = await register_user(client)
    token = reg["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Initially empty
    resp_empty = await client.get("/api/v1/internships", headers=headers)
    assert resp_empty.status_code == 200
    assert resp_empty.json() == []

    resp_active_none = await client.get("/api/v1/internships/active", headers=headers)
    assert resp_active_none.status_code == 200
    assert resp_active_none.json() is None

    # 3. Create an internship
    payload = {
        "company_name": "Google",
        "role": "Software Engineering Intern",
        "department": "Android",
        "internship_type": "on_site",
        "location": "Bangalore Campus, Block B",
        "supervisor_name": "Sundar P.",
        "supervisor_email": "sundar@example.com",
        "start_date": "2026-06-01",
        "end_date": "2026-08-31",
        "stipend": "₹75,000 / month",
    }
    resp_create = await client.post("/api/v1/internships", json=payload, headers=headers)
    assert resp_create.status_code == 201
    created = resp_create.json()
    internship_id = created["id"]
    assert created["company_name"] == "Google"
    assert created["verification_stage"] == "submitted"
    assert created["status"] == "pending"
    assert created["is_active"] is True

    # 4. Get active internship
    resp_active = await client.get("/api/v1/internships/active", headers=headers)
    assert resp_active.status_code == 200
    active = resp_active.json()
    assert active["id"] == internship_id

    # 5. Update internship
    resp_update = await client.put(
        f"/api/v1/internships/{internship_id}",
        json={"role": "Senior Software Engineering Intern", "department": "DeepMind"},
        headers=headers,
    )
    assert resp_update.status_code == 200
    updated = resp_update.json()
    assert updated["role"] == "Senior Software Engineering Intern"
    assert updated["department"] == "DeepMind"

    # 6. Update verification status (e.g. to tp_review, mentor_review, verified)
    resp_stage = await client.patch(
        f"/api/v1/internships/{internship_id}/status",
        json={"verification_stage": "tp_review"},
        headers=headers,
    )
    assert resp_stage.status_code == 200
    assert resp_stage.json()["verification_stage"] == "tp_review"

    # 7. Update to verified
    resp_verified = await client.patch(
        f"/api/v1/internships/{internship_id}/status",
        json={"verification_stage": "verified"},
        headers=headers,
    )
    assert resp_verified.status_code == 200
    assert resp_verified.json()["verification_stage"] == "verified"
    assert resp_verified.json()["status"] == "verified"

    # 8. Delete internship
    resp_del = await client.delete(f"/api/v1/internships/{internship_id}", headers=headers)
    assert resp_del.status_code == 200
    assert resp_del.json()["success"] is True

    # 9. Ensure list is now empty again
    resp_final = await client.get("/api/v1/internships", headers=headers)
    assert resp_final.status_code == 200
    assert resp_final.json() == []


@pytest.mark.asyncio
async def test_internship_proof_upload_and_retrieve(client: AsyncClient):
    reg = await register_user(client)
    token = reg["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload PDF proof
    fake_pdf = b"%PDF-1.4 ... fake offer letter content ..."
    files = {"file": ("offer_letter.pdf", fake_pdf, "application/pdf")}
    resp_upload = await client.post(
        "/api/v1/internships/upload-proof",
        files=files,
        headers=headers,
    )
    assert resp_upload.status_code == 200
    data = resp_upload.json()
    assert data["success"] is True
    assert "url" in data
    assert "storage_ref" in data
    assert data["filename"] == "offer_letter.pdf"

    # Create internship with this proof
    payload = {
        "company_name": "Microsoft",
        "role": "Cloud Engineering Intern",
        "internship_type": "hybrid",
        "location": "Hyderabad",
        "offer_letter_url": data["url"],
    }
    resp_create = await client.post("/api/v1/internships", json=payload, headers=headers)
    assert resp_create.status_code == 201
    created = resp_create.json()
    assert created["offer_letter_url"] == data["url"]

    # Retrieve uploaded file using ref param
    storage_ref = data["storage_ref"]
    resp_file = await client.get(
        f"/api/v1/internships/proof-file?ref={storage_ref}",
        headers=headers,
    )
    assert resp_file.status_code == 200
    assert resp_file.content == fake_pdf

