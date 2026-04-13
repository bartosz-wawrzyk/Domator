"""Initial migration

Revision ID: 86ff0485fba5
Revises: 
Create Date: 2026-04-13 18:08:28.854986

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '86ff0485fba5'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('base_types',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('category', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name'),
    schema='dmt'
    )
    op.create_table('ingredients',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('category', sa.String(length=100), nullable=False),
    sa.Column('unit', sa.String(length=20), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name'),
    schema='dmt'
    )
    op.create_table('loans',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('installments_count', sa.Integer(), nullable=False),
    sa.Column('due_day', sa.Integer(), nullable=False),
    sa.Column('installment_amount', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default='now()', nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default='now()', nullable=False),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_loans_user_id'), 'loans', ['user_id'], unique=False, schema='dmt')
    op.create_table('protein_types',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('category', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name'),
    schema='dmt'
    )
    op.create_table('users',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('email', sa.String(length=255), nullable=False),
    sa.Column('login', sa.String(length=100), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('is_verified', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_users_email'), 'users', ['email'], unique=True, schema='dmt')
    op.create_index(op.f('ix_dmt_users_login'), 'users', ['login'], unique=True, schema='dmt')
    op.create_table('vehicles',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('brand', sa.String(length=100), nullable=False),
    sa.Column('model', sa.String(length=100), nullable=False),
    sa.Column('production_year', sa.Integer(), nullable=False),
    sa.Column('vin', sa.String(length=17), nullable=False),
    sa.Column('registration_number', sa.String(length=20), nullable=False),
    sa.Column('fuel_type', sa.String(length=20), nullable=False),
    sa.Column('current_mileage', sa.Integer(), nullable=False),
    sa.Column('last_service_date', sa.DateTime(timezone=True), nullable=True),
    sa.Column('last_service_mileage', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_vehicles_registration_number'), 'vehicles', ['registration_number'], unique=True, schema='dmt')
    op.create_index(op.f('ix_dmt_vehicles_user_id'), 'vehicles', ['user_id'], unique=False, schema='dmt')
    op.create_index(op.f('ix_dmt_vehicles_vin'), 'vehicles', ['vin'], unique=True, schema='dmt')
    op.create_table('week_plans',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('start_date', sa.Date(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_week_plans_user_id'), 'week_plans', ['user_id'], unique=False, schema='dmt')
    op.create_table('accounts',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('bank_type', sa.String(length=50), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['dmt.users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_table('categories',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['dmt.users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_table('fuel_logs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('vehicle_id', sa.UUID(), nullable=False),
    sa.Column('date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('mileage', sa.Integer(), nullable=False),
    sa.Column('fuel_type', sa.String(length=20), nullable=False),
    sa.Column('liters', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('price_per_liter', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('total_price', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('is_full', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['vehicle_id'], ['dmt.vehicles.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_fuel_logs_vehicle_id'), 'fuel_logs', ['vehicle_id'], unique=False, schema='dmt')
    op.create_table('insurance_policies',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('vehicle_id', sa.UUID(), nullable=False),
    sa.Column('policy_number', sa.String(length=100), nullable=False),
    sa.Column('insurer_name', sa.String(length=100), nullable=False),
    sa.Column('start_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('end_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('total_cost', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('policy_type', sa.String(length=50), nullable=False),
    sa.Column('agent_contact', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['vehicle_id'], ['dmt.vehicles.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_insurance_policies_vehicle_id'), 'insurance_policies', ['vehicle_id'], unique=False, schema='dmt')
    op.create_table('meals',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('id_protein_type', sa.UUID(), nullable=False),
    sa.Column('id_base_type', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('description', sa.String(), nullable=True),
    sa.Column('is_weekend_dish', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['id_base_type'], ['dmt.base_types.id'], ),
    sa.ForeignKeyConstraint(['id_protein_type'], ['dmt.protein_types.id'], ),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_meals_user_id'), 'meals', ['user_id'], unique=False, schema='dmt')
    op.create_table('payments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('loan_id', sa.UUID(), nullable=False),
    sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('type', sa.Enum('installment', 'prepayment', name='paymenttype'), nullable=False),
    sa.Column('paid_at', sa.Date(), nullable=False),
    sa.ForeignKeyConstraint(['loan_id'], ['dmt.loans.id'], ),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_payments_loan_id'), 'payments', ['loan_id'], unique=False, schema='dmt')
    op.create_table('refresh_tokens',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('token_hash', sa.String(length=64), nullable=False),
    sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
    sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['dmt.users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True, schema='dmt')
    op.create_index(op.f('ix_dmt_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'], unique=False, schema='dmt')
    op.create_table('service_events',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('vehicle_id', sa.UUID(), nullable=False),
    sa.Column('service_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('mileage_at_service', sa.Integer(), nullable=False),
    sa.Column('total_cost', sa.Numeric(precision=10, scale=2), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['vehicle_id'], ['dmt.vehicles.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_service_events_vehicle_id'), 'service_events', ['vehicle_id'], unique=False, schema='dmt')
    op.create_table('technical_inspections',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('vehicle_id', sa.UUID(), nullable=False),
    sa.Column('inspection_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('expiration_date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('current_mileage', sa.Integer(), nullable=False),
    sa.Column('cost', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('station_name', sa.String(length=255), nullable=True),
    sa.Column('station_location', sa.String(length=255), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['vehicle_id'], ['dmt.vehicles.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_technical_inspections_vehicle_id'), 'technical_inspections', ['vehicle_id'], unique=False, schema='dmt')
    op.create_table('user_activity_logs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('ip_address', sa.String(length=45), nullable=True),
    sa.Column('location', sa.String(length=255), nullable=True),
    sa.Column('user_agent', sa.String(length=500), nullable=True),
    sa.Column('action', sa.String(length=100), nullable=False),
    sa.Column('status', sa.String(length=50), nullable=False),
    sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['dmt.users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_table('import_rules',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('account_id', sa.UUID(), nullable=False),
    sa.Column('category_id', sa.UUID(), nullable=False),
    sa.Column('keyword', sa.String(length=255), nullable=False),
    sa.ForeignKeyConstraint(['account_id'], ['dmt.accounts.id'], ),
    sa.ForeignKeyConstraint(['category_id'], ['dmt.categories.id'], ),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_table('meal_ingredients',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('id_meal', sa.UUID(), nullable=False),
    sa.Column('id_ingredient', sa.UUID(), nullable=False),
    sa.Column('base_amount', sa.Float(), nullable=False),
    sa.Column('note', sa.String(length=200), nullable=True),
    sa.ForeignKeyConstraint(['id_ingredient'], ['dmt.ingredients.id'], ondelete='RESTRICT'),
    sa.ForeignKeyConstraint(['id_meal'], ['dmt.meals.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_table('service_items',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('service_event_id', sa.UUID(), nullable=False),
    sa.Column('type', sa.String(length=50), nullable=False),
    sa.Column('description', sa.String(length=255), nullable=False),
    sa.Column('cost', sa.Numeric(precision=10, scale=2), nullable=False),
    sa.Column('is_recurring', sa.Boolean(), nullable=False),
    sa.Column('interval_km', sa.Integer(), nullable=True),
    sa.Column('interval_months', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['service_event_id'], ['dmt.service_events.id'], ),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_service_items_service_event_id'), 'service_items', ['service_event_id'], unique=False, schema='dmt')
    op.create_table('transactions',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('account_id', sa.UUID(), nullable=False),
    sa.Column('category_id', sa.UUID(), nullable=True),
    sa.Column('date', sa.DateTime(timezone=True), nullable=False),
    sa.Column('amount', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('title', sa.String(length=500), nullable=False),
    sa.Column('raw_hash', sa.String(length=255), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['account_id'], ['dmt.accounts.id'], ),
    sa.ForeignKeyConstraint(['category_id'], ['dmt.categories.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('account_id', 'raw_hash', name='uq_transaction_account_hash'),
    schema='dmt'
    )
    op.create_table('week_meals',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('week_plan_id', sa.UUID(), nullable=False),
    sa.Column('meal_id', sa.UUID(), nullable=True),
    sa.Column('meal_date', sa.Date(), nullable=False),
    sa.Column('batch_id', sa.UUID(), nullable=True),
    sa.Column('is_out_of_home', sa.Boolean(), nullable=False),
    sa.Column('note', sa.String(length=500), nullable=True),
    sa.ForeignKeyConstraint(['meal_id'], ['dmt.meals.id'], ),
    sa.ForeignKeyConstraint(['week_plan_id'], ['dmt.week_plans.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    schema='dmt'
    )
    op.create_index(op.f('ix_dmt_week_meals_batch_id'), 'week_meals', ['batch_id'], unique=False, schema='dmt')
    op.create_index(op.f('ix_dmt_week_meals_user_id'), 'week_meals', ['user_id'], unique=False, schema='dmt')
    op.execute(sa.text("""
        CREATE OR REPLACE VIEW dmt.loan_status AS
        SELECT
            l.id AS loan_id,
            l.user_id,
            l.name,
            l.total_amount,
            l.installments_count,
            l.installment_amount,
            l.due_day, 
            COALESCE(SUM(p.amount), 0) AS total_paid,
            l.total_amount - COALESCE(SUM(p.amount), 0) AS remaining,
            COALESCE(
                SUM(CASE WHEN p.type = 'installment' THEN p.amount END),
                0
            ) AS total_installments_paid,
            COALESCE(
                SUM(CASE WHEN p.type = 'prepayment' THEN p.amount END),
                0
            ) AS total_prepayments
        FROM dmt.loans l
        LEFT JOIN dmt.payments p ON p.loan_id = l.id
        GROUP BY l.id;
    """))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_dmt_week_meals_user_id'), table_name='week_meals', schema='dmt')
    op.drop_index(op.f('ix_dmt_week_meals_batch_id'), table_name='week_meals', schema='dmt')
    op.drop_table('week_meals', schema='dmt')
    op.drop_table('transactions', schema='dmt')
    op.drop_index(op.f('ix_dmt_service_items_service_event_id'), table_name='service_items', schema='dmt')
    op.drop_table('service_items', schema='dmt')
    op.drop_table('meal_ingredients', schema='dmt')
    op.drop_table('import_rules', schema='dmt')
    op.drop_table('user_activity_logs', schema='dmt')
    op.drop_index(op.f('ix_dmt_technical_inspections_vehicle_id'), table_name='technical_inspections', schema='dmt')
    op.drop_table('technical_inspections', schema='dmt')
    op.drop_index(op.f('ix_dmt_service_events_vehicle_id'), table_name='service_events', schema='dmt')
    op.drop_table('service_events', schema='dmt')
    op.drop_index(op.f('ix_dmt_refresh_tokens_user_id'), table_name='refresh_tokens', schema='dmt')
    op.drop_index(op.f('ix_dmt_refresh_tokens_token_hash'), table_name='refresh_tokens', schema='dmt')
    op.drop_table('refresh_tokens', schema='dmt')
    op.drop_index(op.f('ix_dmt_payments_loan_id'), table_name='payments', schema='dmt')
    op.drop_table('payments', schema='dmt')
    op.drop_index(op.f('ix_dmt_meals_user_id'), table_name='meals', schema='dmt')
    op.drop_table('meals', schema='dmt')
    op.drop_index(op.f('ix_dmt_insurance_policies_vehicle_id'), table_name='insurance_policies', schema='dmt')
    op.drop_table('insurance_policies', schema='dmt')
    op.drop_index(op.f('ix_dmt_fuel_logs_vehicle_id'), table_name='fuel_logs', schema='dmt')
    op.drop_table('fuel_logs', schema='dmt')
    op.drop_table('categories', schema='dmt')
    op.drop_table('accounts', schema='dmt')
    op.drop_index(op.f('ix_dmt_week_plans_user_id'), table_name='week_plans', schema='dmt')
    op.drop_table('week_plans', schema='dmt')
    op.drop_index(op.f('ix_dmt_vehicles_vin'), table_name='vehicles', schema='dmt')
    op.drop_index(op.f('ix_dmt_vehicles_user_id'), table_name='vehicles', schema='dmt')
    op.drop_index(op.f('ix_dmt_vehicles_registration_number'), table_name='vehicles', schema='dmt')
    op.drop_table('vehicles', schema='dmt')
    op.drop_index(op.f('ix_dmt_users_login'), table_name='users', schema='dmt')
    op.drop_index(op.f('ix_dmt_users_email'), table_name='users', schema='dmt')
    op.drop_table('users', schema='dmt')
    op.drop_table('protein_types', schema='dmt')
    op.drop_index(op.f('ix_dmt_loans_user_id'), table_name='loans', schema='dmt')
    op.drop_table('loans', schema='dmt')
    op.drop_table('ingredients', schema='dmt')
    op.drop_table('base_types', schema='dmt')