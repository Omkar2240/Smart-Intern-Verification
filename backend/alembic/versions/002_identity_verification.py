"""Identity verification tables — colleges, identity_verifications, face_embeddings

Revision ID: 002_identity_verification
Revises: 001_initial_auth
Create Date: 2026-09-19

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "002_identity_verification"
down_revision: Union[str, None] = "001_initial_auth"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- colleges ---
    colleges_table = op.create_table(
        "colleges",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("city", sa.String(100), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("country", sa.String(100), nullable=False, server_default="India"),
        sa.Column("code", sa.String(50), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_colleges_name", "colleges", ["name"])
    op.create_index("ix_colleges_is_active", "colleges", ["is_active"])
    op.create_unique_constraint("uq_colleges_code", "colleges", ["code"])

    # Seed initial college: G. H. Raisoni College of Engineering, Nagpur
    op.bulk_insert(
        colleges_table,
        [
            {
                "id": uuid.uuid4(),
                "name": "G. H. Raisoni College of Engineering, Nagpur",
                "city": "Nagpur",
                "state": "Maharashtra",
                "country": "India",
                "code": "GHRCEN",
                "is_active": True,
            }
        ],
    )

    # --- identity_verifications ---
    op.create_table(
        "identity_verifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("college_id", UUID(as_uuid=True), sa.ForeignKey("colleges.id", ondelete="SET NULL"), nullable=True),
        sa.Column("college_status", sa.String(30), nullable=False, server_default="not_started"),
        sa.Column("college_id_status", sa.String(30), nullable=False, server_default="not_started"),
        sa.Column("college_id_storage_ref", sa.String(512), nullable=True),
        sa.Column("extracted_metadata", sa.JSON(), nullable=True),
        sa.Column("face_status", sa.String(30), nullable=False, server_default="not_started"),
        sa.Column("overall_status", sa.String(30), nullable=False, server_default="not_started"),
        sa.Column("rejection_reason", sa.String(512), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_unique_constraint("uq_identity_verifications_user_id", "identity_verifications", ["user_id"])
    op.create_index("ix_identity_verifications_user_id", "identity_verifications", ["user_id"])
    op.create_index("ix_identity_verifications_overall_status", "identity_verifications", ["overall_status"])

    # --- face_embeddings ---
    op.create_table(
        "face_embeddings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("model_name", sa.String(50), nullable=False, server_default="ArcFace"),
        sa.Column("model_version", sa.String(20), nullable=False, server_default="1.0"),
        sa.Column("embedding", sa.LargeBinary(), nullable=False),
        sa.Column("dimension", sa.Integer(), nullable=False, server_default="512"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("quality_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_face_embeddings_user_id", "face_embeddings", ["user_id"])
    op.create_index("ix_face_embeddings_is_active", "face_embeddings", ["is_active"])


def downgrade() -> None:
    op.drop_table("face_embeddings")
    op.drop_table("identity_verifications")
    op.drop_table("colleges")
