import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.loans import Loan
from app.db.models.payments import Payment
from sqlalchemy import select, exists
from datetime import datetime

class LoanRepository:
    @staticmethod
    async def create(db: AsyncSession, loan: Loan) -> Loan:
        db.add(loan)
        await db.commit()
        await db.refresh(loan)
        return loan

    @staticmethod
    async def get_by_id(db: AsyncSession, loan_id: uuid.UUID, user_id: uuid.UUID) -> Loan | None:
        result = await db.execute(
            select(Loan).where(
                Loan.id == loan_id,
                Loan.user_id == user_id
            )
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def has_payments(db: AsyncSession, loan_id: int) -> bool:
        result = await db.execute(
            select(exists().where(Payment.loan_id == loan_id))
        )
        return result.scalar()
    
    @staticmethod
    async def delete(db: AsyncSession, loan: Loan) -> None:
        await db.delete(loan)
        await db.commit()

    @staticmethod
    async def update(db: AsyncSession, loan: Loan, update_data: dict) -> Loan:
        for key, value in update_data.items():
            if value is not None:
                setattr(loan, key, value)
        
        loan.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(loan)
        return loan