import uuid
from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field, ConfigDict

from app.db.deps import get_db, get_current_user
from app.db.models.payment import Payment, PaymentType
from app.db.models.loan import Loan
from app.db.repositories.payment import PaymentRepository

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
    id: uuid.UUID
    amount: Decimal
    type: PaymentType
    paid_at: date

    model_config = ConfigDict(from_attributes=True)

class PaymentUpdate(BaseModel):
    amount: Decimal | None = Field(None, gt=0, max_digits=12, decimal_places=2)
    type: PaymentType | None = None
    paid_at: date | None = None
    
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
        select(Payment)
        .where(Payment.loan_id == loan_id)
        .order_by(Payment.paid_at.desc())
    )

    payments = result.scalars().all()
    return payments

@router.delete("/{payment_id}", status_code=status.HTTP_200_OK)
async def delete_payment(
    payment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    payment = await PaymentRepository.get_by_id(db, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if not await PaymentRepository.verify_ownership(db, payment_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this payment"
        )

    await PaymentRepository.delete(db, payment)
    
    return {"message": "Payment deleted successfully"}

@router.patch("/{payment_id}", status_code=status.HTTP_200_OK)
async def update_payment(
    payment_id: uuid.UUID,
    data: PaymentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    payment = await PaymentRepository.get_by_id(db, payment_id)
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    if not await PaymentRepository.verify_ownership(db, payment_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this payment"
        )
    
    update_data = data.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    updated_payment = await PaymentRepository.update(db, payment, update_data)
    
    return {
        "message": "Payment updated successfully",
        "payment_id": updated_payment.id
    }