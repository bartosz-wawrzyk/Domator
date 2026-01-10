import uuid
from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field, ConfigDict

from app.db.deps import get_db, get_current_user
from app.db.models.payments import Payment, PaymentType
from app.db.models.loans import Loan

router = APIRouter(prefix="/payments", tags=["Payments"])

class PaymentCreate(BaseModel):
    loan_id: uuid.UUID
    amount: Decimal = Field(..., gt=0, max_digits=12, decimal_places=2)
    type: PaymentType
    paid_at: Optional[date] = Field(
        default_factory=date.today,
        description="Payment date in YYYY-MM-DD format. If missing, today's date will be used."
    )

    model_config = ConfigDict(from_attributes=True)

class PaymentOut(BaseModel):
    amount: Decimal
    type: PaymentType
    paid_at: date

    model_config = ConfigDict(from_attributes=True)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_in: PaymentCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    loan_check = await db.execute(
        select(Loan.id).where(Loan.id == payment_in.loan_id)
    )
    if not loan_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Loan not found")

    new_payment = Payment(
        **payment_in.model_dump()
    )

    db.add(new_payment)
    try:
        await db.commit()
        await db.refresh(new_payment)
    except Exception:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

    return {
        "message": "Payment added successfully",
        "payment_id": str(new_payment.id),
        "paid_at": new_payment.paid_at.isoformat()
    }

@router.get(
    "/loan/{loan_id}",
    response_model=list[PaymentOut],
    status_code=status.HTTP_200_OK
)
async def get_loan_payments(
    loan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    loan = await db.execute(
        select(Loan.id).where(Loan.id == loan_id)
    )
    if not loan.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Loan not found")

    result = await db.execute(
        select(
            Payment.amount,
            Payment.type,
            Payment.paid_at
        )
        .where(Payment.loan_id == loan_id)
        .order_by(Payment.paid_at.desc())
    )

    payments = result.all()

    return payments