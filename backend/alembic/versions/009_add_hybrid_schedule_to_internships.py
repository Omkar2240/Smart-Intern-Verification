"""Add hybrid_schedule to internships table

Revision ID: 009_add_hybrid_schedule
Revises: 008_add_shift_timings_and_tasks
Create Date: 2026-10-09

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "009_add_hybrid_schedule"
down_revision: Union[str, None] = "008_add_shift_timings_and_tasks"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if insp.has_table("internships"):
        internship_cols = [c["name"] for c in insp.get_columns("internships")]
        if "hybrid_schedule" not in internship_cols:
            op.add_column("internships", sa.Column("hybrid_schedule", sa.String(512), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    insp = sa.inspect(bind)

    if insp.has_table("internships"):
        internship_cols = [c["name"] for c in insp.get_columns("internships")]
        if "hybrid_schedule" in internship_cols:
            op.drop_column("internships", "hybrid_schedule")
