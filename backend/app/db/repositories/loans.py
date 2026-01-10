from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.loans import Loan

class LoanRepository:
    @staticmethod
    async def create(db: AsyncSession, loan: Loan) -> Loan:
        db.add(loan)
        await db.commit()
        await db.refresh(loan)
        return loan
