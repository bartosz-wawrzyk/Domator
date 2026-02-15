import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

from app.main import app
from app.db.base import Base
from app.db.deps import get_db
from app.core.config import get_settings

settings = get_settings()


TEST_DATABASE_URL = settings.database_url + "_test"

@pytest.fixture
async def db_session():
    """Creates the engine and session inside the same loop in which the test runs."""
    engine = create_async_engine(TEST_DATABASE_URL)
    
    async with engine.begin() as conn:
        await conn.execute(text("CREATE SCHEMA IF NOT EXISTS dmt;"))
        await conn.run_sync(Base.metadata.create_all)

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
    
    session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    
    async with session_factory() as session:
        yield session
    
    async with engine.begin() as conn:
        await conn.execute(text("DROP VIEW IF EXISTS dmt.loan_status CASCADE;"))
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()

@pytest.fixture
async def client(db_session):
    """HTTP client with correct session injection."""
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app), 
        base_url="http://testserver"
    ) as ac:
        yield ac
    
    app.dependency_overrides.clear()