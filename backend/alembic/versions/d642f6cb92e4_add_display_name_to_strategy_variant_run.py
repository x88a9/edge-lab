"""add display_name to strategy variant run

Revision ID: d642f6cb92e4
Revises: 5eb9f71bd3fe
Create Date: 2026-02-19 23:32:44.798236

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd642f6cb92e4'
down_revision: Union[str, Sequence[str], None] = '5eb9f71bd3fe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    op.add_column("strategies", sa.Column("display_name", sa.String(255), nullable=True))
    op.add_column("variants", sa.Column("display_name", sa.String(255), nullable=True))
    op.add_column("runs", sa.Column("display_name", sa.String(255), nullable=True))

    # Backfill existing data
    op.execute("UPDATE strategies SET display_name = name")
    op.execute("UPDATE variants SET display_name = name")
    op.execute("UPDATE runs SET display_name = 'Unnamed Run'")

    # Enforce NOT NULL
    op.alter_column("strategies", "display_name", nullable=False)
    op.alter_column("variants", "display_name", nullable=False)
    op.alter_column("runs", "display_name", nullable=False)



def downgrade():
    op.drop_column("strategies", "display_name")
    op.drop_column("variants", "display_name")
    op.drop_column("runs", "display_name")

