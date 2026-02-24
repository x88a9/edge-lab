"""phase 4.1 enforce single default portfolio per user

Revision ID: 3c1d9b7e4a10
Revises: 2afacec8f9ad
Create Date: 2026-02-24

"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = "3c1d9b7e4a10"
down_revision: Union[str, Sequence[str], None] = "2afacec8f9ad"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(
        "uq_portfolios_user_default",
        "portfolios",
        ["user_id"],
        unique=True,
        postgresql_where=sa.text("is_default = true"),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_portfolios_user_default",
        table_name="portfolios",
    )