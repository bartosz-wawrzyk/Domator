"""add table meal_settings

Revision ID: 7d13f5522f84
Revises: a0bb7c46f1c1
Create Date: 2026-04-13 22:01:40.825004

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '7d13f5522f84'
down_revision: Union[str, Sequence[str], None] = 'a0bb7c46f1c1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('meal_settings',
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('default_servings', sa.Integer(), nullable=False),
    sa.Column('scale_by_two_days', sa.Boolean(), nullable=False),
    sa.Column('shopping_day_of_week', sa.Integer(), nullable=False),
    sa.Column('shopping_list_days_range', sa.Integer(), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['dmt.users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('user_id'),
    schema='dmt'
    )


def downgrade() -> None:
    op.drop_table('meal_settings', schema='dmt')