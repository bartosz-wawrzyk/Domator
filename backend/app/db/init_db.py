import uuid
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base

async def init_db():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS dmt"))

        await conn.run_sync(lambda sync_conn: Base.metadata.create_all(bind=sync_conn))

        await conn.execute(text("""
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

        await conn.execute(text("""
            CREATE INDEX IF NOT EXISTS idx_payments_loan_id
            ON dmt.payments (loan_id);
        """))
