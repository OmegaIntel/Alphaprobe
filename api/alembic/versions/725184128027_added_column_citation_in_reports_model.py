"""added column citation in reports model

Revision ID: 725184128027
Revises: dfa7ee0e1858
Create Date: 2025-05-05 17:32:42.817268

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '725184128027'
down_revision: Union[str, None] = 'dfa7ee0e1858'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
