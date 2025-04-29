"""Recreate missing migration

Revision ID: 6b4df23e2501
Revises: 4b100847e587
Create Date: 2025-04-29 19:46:42.497237

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6b4df23e2501'
down_revision: Union[str, None] = '4b100847e587'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
