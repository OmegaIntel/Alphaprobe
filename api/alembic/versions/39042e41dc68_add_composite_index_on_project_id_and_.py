"""add composite index on project_id and updated_at

Revision ID: 39042e41dc68
Revises: 725184128027
Create Date: 2025-05-06 14:58:31.518053

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '39042e41dc68'
down_revision: Union[str, None] = '725184128027'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "ix_reports_table_proj_upd",
        "reports_table",
        ["project_id", "updated_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_reports_table_proj_upd", table_name="reports_table")
