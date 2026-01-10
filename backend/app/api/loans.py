import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.deps import get_db, get_current_user
from app.db.repositories.loans import LoanRepository
from app.db.models.loans import Loan, LoanCreate
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import text

router = APIRouter(prefix="/loans", tags=["Loans"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_loan(
    data: LoanCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    loan = Loan(
        user_id=current_user.id,
        name=data.name,
        total_amount=data.total_amount,
        installments_count=data.installments_count,
        due_day=data.due_day,
        installment_amount=data.installment_amount,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    loan = await LoanRepository.create(db, loan)
    return {"message": "Loan created successfully", "loan_id": loan.id}

@router.get("/loan_status/{user_id}", response_model=None)
async def get_user_loan_status(user_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    result = await db.execute(
        text("SELECT * FROM dmt.loan_status WHERE user_id = :user_id"),
        {"user_id": str(user_id)}
    )
    rows = result.mappings().all()
    if not rows:
        raise HTTPException(status_code=404, detail="No loans found for this user")
    return rows