"""Add workplace_lat and workplace_lng to internships table

Revision ID: 010_add_workplace_coords
Revises: 009_add_hybrid_schedule
Create Date: 2026-10-09
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "010_add_workplace_coords"
down_revision: Union[str, None] = "009_add_hybrid_schedule"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if insp.has_table("internships"):
        internship_cols = [c["name"] for c in insp.get_columns("internships")]
        if "workplace_lat" not in internship_cols:
            op.add_column("internships", sa.Column("workplace_lat", sa.Float(), nullable=True))
        if "workplace_lng" not in internship_cols:
            op.add_column("internships", sa.Column("workplace_lng", sa.Float(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if insp.has_table("internships"):
        internship_cols = [c["name"] for c in insp.get_columns("internships")]
        if "workplace_lat" in internship_cols:
            op.drop_column("internships", "workplace_lat")
        if "workplace_lng" in internship_cols:
            op.drop_column("internships", "workplace_lng")
