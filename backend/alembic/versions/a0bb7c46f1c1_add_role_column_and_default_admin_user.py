"""add role column and default admin user

Revision ID: a0bb7c46f1c1
Revises: 86ff0485fba5
Create Date: 2026-04-13 21:15:24.050136

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

from app.core.security import hash_password

revision: str = 'a0bb7c46f1c1'
down_revision: Union[str, Sequence[str], None] = '86ff0485fba5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('role', sa.String(length=20), nullable=False, server_default='USER'), schema='dmt')

    admin_password_hash = hash_password("Admin123!")

    op.execute(f"""
        INSERT INTO dmt.users (id, email, login, password_hash, is_active, is_verified, created_at, updated_at, last_login_at, role)
        VALUES (
            gen_random_uuid(),
            'admin@localhost',
            'admin',
            '{admin_password_hash}',
            true,
            false,
            NOW(),
            NOW(),
            NULL,
            'ADMIN'
        )
        ON CONFLICT (email) DO NOTHING;
    """)

    pass


def downgrade() -> None:
    op.execute("DELETE FROM dmt.users WHERE login = 'admin' AND role = 'ADMIN'")
    op.drop_column('users', 'role', schema='dmt')

    pass