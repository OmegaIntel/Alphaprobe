"""empty message

Revision ID: f2e8430e2403
Revises: 5772c0f28071, 5fb7feba0299
Create Date: 2024-10-07 15:13:04.748779

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2e8430e2403'
down_revision: Union[str, None] = ('5772c0f28071', '5fb7feba0299')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
