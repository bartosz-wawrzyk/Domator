import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.payments import Payment
from app.db.models.loans import Loan

class PaymentRepository:
    @staticmethod
    async def get_by_id(db: AsyncSession, payment_id: uuid.UUID) -> Payment | None:
        result = await db.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        return result.scalar_one_or_none()
    
    @staticmethod
    async def verify_ownership(db: AsyncSession, payment_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await db.execute(
            select(Payment.id)
            .join(Loan, Payment.loan_id == Loan.id)
            .where(
                Payment.id == payment_id,
                Loan.user_id == user_id
            )
        )
        return result.scalar_one_or_none() is not None
    
    @staticmethod
    async def delete(db: AsyncSession, payment: Payment) -> None:
        await db.delete(payment)
        await db.commit()

    @staticmethod
    async def update(db: AsyncSession, payment: Payment, update_data: dict) -> Payment:
        for key, value in update_data.items():
            if value is not None:
                setattr(payment, key, value)
        
        await db.commit()
        await db.refresh(payment)
        return payment