import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.deps import get_db, get_current_user
from app.db.repositories.loan import LoanRepository
from app.db.models.loan import Loan, LoanCreate, LoanUpdate
from datetime import datetime, timezone
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
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    loan = await LoanRepository.create(db, loan)
    return {"message": "Loan created successfully", "loan_id": loan.id}

@router.delete("/{loan_id}", status_code=status.HTTP_200_OK)
async def delete_loan(
    loan_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    loan = await LoanRepository.get_by_id(db, loan_id, current_user.id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    if await LoanRepository.has_payments(db, loan_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete loan with existing payments (installments or prepayments)"
        )

    await LoanRepository.delete(db, loan)
    
    return {"message": "Loan deleted successfully"}

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

@router.patch("/{loan_id}", status_code=status.HTTP_200_OK)
async def update_loan(
    loan_id: uuid.UUID,
    data: LoanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    loan = await LoanRepository.get_by_id(db, loan_id, current_user.id)
    if not loan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Loan not found"
        )
    
    update_data = data.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    updated_loan = await LoanRepository.update(db, loan, update_data)
    
    return {
        "message": "Loan updated successfully",
        "loan_id": updated_loan.id
    }