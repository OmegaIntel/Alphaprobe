"""add workflow enum to projects

Revision ID: 4b100847e587
Revises: ff6a2537222e
Create Date: 2025-04-25 01:31:39.504799
"""

from alembic import op
import sqlalchemy as sa
import enum
from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = '4b100847e587'
down_revision: Union[str, None] = 'ff6a2537222e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Define Python Enum matching your SQLAlchemy model
class WorkflowEnum(str, enum.Enum):
    general = "general"
    due_diligence = "due_diligence"
    market_research = "market_research"
    competitive_analysis = "competitive_analysis"

def upgrade() -> None:
    # Create the ENUM type
    workflow_enum = sa.Enum(
        *[e.value for e in WorkflowEnum],
        name="workflowenum"
    )
    workflow_enum.create(op.get_bind())

    # Add column to projects table
    op.add_column(
        "projects",
        sa.Column(
            "workflow",
            workflow_enum,
            nullable=False,
            server_default="general"
        )
    )


def downgrade() -> None:
    op.drop_column("projects", "workflow")
    sa.Enum(name="workflowenum").drop(op.get_bind())
