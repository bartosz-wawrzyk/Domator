import uuid
from typing import List, Optional
from decimal import Decimal
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from sqlalchemy import select, extract, func, case

from app.services.finance_service import FinanceService
from app.db.deps import get_db, get_current_user
from app.db.models.user import User
from app.db.models.finance import (
    Account, AccountCreate, AccountRead,
    Category, CategoryCreate, CategoryRead,
    ImportRule, ImportRuleCreate, ImportRuleRead, 
    Transaction, TransactionRead, TransactionCategoryUpdate
)
from app.db.repositories.finance import FinanceRepository

router = APIRouter(prefix="/finance", tags=["Finance"])

# --- ACCOUNTS ---

@router.get("/accounts", response_model=List[AccountRead])
async def get_accounts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves the list of accounts for the logged-in user."""
    return await FinanceRepository.get_user_accounts(db, current_user.id)

@router.post("/accounts", response_model=AccountRead, status_code=status.HTTP_201_CREATED)
async def create_account(
    data: AccountCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new account."""
    account = Account(
        user_id=current_user.id,
        name=data.name,
        bank_type=data.bank_type
    )
    return await FinanceRepository.create_account(db, account)

@router.delete("/accounts/{account_id}")
async def delete_account(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a user account only if it is empty."""
    accounts = await FinanceRepository.get_user_accounts(db, current_user.id)
    account = next((a for a in accounts if a.id == account_id), None)
    
    if not account:
        raise HTTPException(status_code=404, detail="Account not found.")

    tx_check = await db.execute(select(Transaction).where(Transaction.account_id == account_id).limit(1))
    if tx_check.scalars().first():
        raise HTTPException(status_code=400, detail="Cannot delete account with transactions.")

    rules_check = await db.execute(select(ImportRule).where(ImportRule.account_id == account_id).limit(1))
    if rules_check.scalars().first():
        raise HTTPException(status_code=400, detail="Account has assigned rules.")

    await FinanceRepository.delete_account(db, account_id, current_user.id)
    return {"message": "Account deleted successfully"}

# --- CATEGORIES ---

@router.get("/categories", response_model=List[CategoryRead])
async def get_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await FinanceRepository.get_user_categories(db, current_user.id)

@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = Category(user_id=current_user.id, name=data.name)
    return await FinanceRepository.create_category(db, category)

@router.put("/categories/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = await FinanceRepository.get_category_by_id(db, category_id)
    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")
    
    category.name = data.name
    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = await FinanceRepository.get_category_by_id(db, category_id)
    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")

    rules_check = await db.execute(select(ImportRule).where(ImportRule.category_id == category_id).limit(1))
    if rules_check.scalars().first():
        raise HTTPException(status_code=400, detail="Category is used in rules.")

    tx_check = await db.execute(select(Transaction).where(Transaction.category_id == category_id).limit(1))
    if tx_check.scalars().first():
        raise HTTPException(status_code=400, detail="Category is used in transactions.")

    await db.delete(category)
    await db.commit()
    return {"message": "Category deleted successfully"}

# --- RULES ---

@router.get("/rules/{account_id}", response_model=List[ImportRuleRead])
async def get_rules(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not await FinanceRepository.is_account_owner(db, account_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    return await FinanceRepository.get_account_rules(db, account_id)

@router.post("/rules", response_model=ImportRuleRead, status_code=status.HTTP_201_CREATED)
async def create_rule(
    data: ImportRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not await FinanceRepository.is_account_owner(db, data.account_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    rule = ImportRule(
        account_id=data.account_id,
        category_id=data.category_id,
        keyword=data.keyword.upper()
    )
    return await FinanceRepository.create_import_rule(db, rule)

@router.put("/rules/{rule_id}", response_model=ImportRuleRead)
async def update_rule(
    rule_id: uuid.UUID,
    data: ImportRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule_query = select(ImportRule).join(Account).where(
        ImportRule.id == rule_id, 
        Account.user_id == current_user.id
    )
    res = await db.execute(rule_query)
    rule = res.scalars().first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.keyword = data.keyword.upper()
    rule.category_id = data.category_id
    
    await db.commit()
    await db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule_query = select(ImportRule).join(Account).where(
        ImportRule.id == rule_id, 
        Account.user_id == current_user.id
    )
    res = await db.execute(rule_query)
    rule = res.scalars().first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found.")

    await db.delete(rule)
    await db.commit()
    return {"message": "Rule deleted successfully"}

@router.post("/rules/{rule_id}/apply")
async def apply_rule(
    rule_id: uuid.UUID, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Applies a rule to existing uncategorized transactions."""
    rule_query = select(ImportRule).join(Account).where(
        ImportRule.id == rule_id, 
        Account.user_id == current_user.id
    )
    res = await db.execute(rule_query)
    rule = res.scalars().first()
    if not rule: 
        raise HTTPException(status_code=404, detail="Rule not found")
    
    count = await FinanceRepository.apply_rule_to_existing_transactions(db, rule)
    return {"message": f"Updated {count} transactions"}

# --- TRANSACTIONS ---

@router.get("/transactions/{account_id}", response_model=List[TransactionRead])
async def get_transactions(
    account_id: uuid.UUID, 
    month: int, 
    year: int, 
    limit: int = 200, 
    offset: int = 0, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if not await FinanceRepository.is_account_owner(db, account_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    return await FinanceRepository.get_monthly_transactions(db, account_id, month, year, limit, offset)

@router.patch("/transactions/{transaction_id}/category", response_model=TransactionRead)
async def update_transaction_category(
    transaction_id: uuid.UUID, 
    data: TransactionCategoryUpdate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    tx_query = select(Transaction).join(Account).where(
        Transaction.id == transaction_id, 
        Account.user_id == current_user.id
    )
    tx_res = await db.execute(tx_query)
    if not tx_res.scalars().first(): 
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    await FinanceRepository.update_transaction_category(db, transaction_id, data.category_id)
    
    res = await db.execute(
        select(Transaction)
        .options(joinedload(Transaction.category))
        .where(Transaction.id == transaction_id)
    )
    return res.scalars().first()

@router.get("/accounts/{account_id}/available-years")
async def get_available_years(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves a list of unique years for which transactions exist on a given account."""

    if not await FinanceRepository.is_account_owner(db, account_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    query = (
        select(func.distinct(extract('year', Transaction.date)))
        .where(Transaction.account_id == account_id)
        .order_by(extract('year', Transaction.date).desc())
    )

    result = await db.execute(query)
    years = [int(row[0]) for row in result.all()]

    current_year = datetime.now().year
    if current_year not in years:
        years.append(current_year)
        years.sort(reverse=True)

    return {"years": years}

# --- STATS ---

@router.get("/stats/monthly/{account_id}")
async def get_monthly_stats(
    account_id: uuid.UUID,
    month: int, 
    year: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not await FinanceRepository.is_account_owner(db, account_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return await FinanceRepository.get_monthly_stats(db, account_id, month, year)

@router.get("/stats/yearly/{account_id}")
async def get_yearly_stats(
    account_id: uuid.UUID,
    year: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    yearly_query = (
        select(
            extract('month', Transaction.date).label("month"),
            func.sum(case((Transaction.amount > 0, Transaction.amount), else_=0)).label("income"),
            func.sum(case((Transaction.amount < 0, func.abs(Transaction.amount)), else_=0)).label("expense")
        )
        .where(
            Transaction.account_id == account_id,
            extract('year', Transaction.date) == year
        )
        .group_by("month")
        .order_by("month")
    )

    result = await db.execute(yearly_query)
    months_map = {int(row.month): {"income": float(row.income), "expense": float(row.expense)} for row in result.all()}
    
    yearly_data = []
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    for m in range(1, 13):
        data = months_map.get(m, {"income": 0.0, "expense": 0.0})
        yearly_data.append({
            "month_num": m,
            "name": month_names[m-1],
            "income": round(data["income"], 2),
            "expense": round(data["expense"], 2),
            "balance": round(data["income"] - data["expense"], 2)
        })

    return {"year": year, "data": yearly_data}

@router.post("/import/preview/{account_id}")
async def import_preview(
    account_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Account).where(Account.id == account_id, Account.user_id == current_user.id)
    result = await db.execute(query)
    account = result.scalars().first()
    
    if not account:
        raise HTTPException(status_code=404, detail="Account does not exist or access denied.")

    content_bytes = await file.read()
    try:
        content = content_bytes.decode('utf-8')
    except UnicodeDecodeError:
        content = content_bytes.decode('cp1250') 

    try:
        transactions = FinanceService.parse_csv(content, bank_type=account.bank_type)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Parsing error: {str(e)}")

    rules = await FinanceRepository.get_account_rules(db, account_id)
    return FinanceService.match_categories(transactions, rules)

@router.post("/import/confirm/{account_id}")
async def import_confirm(
    account_id: uuid.UUID,
    transactions_data: List[dict], 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    to_save = []
    for item in transactions_data:
        dt = item["date"]
        if isinstance(dt, str):
            dt = datetime.fromisoformat(dt.replace('Z', '+00:00'))

        tx = Transaction(
            account_id=account_id,
            category_id=item.get("category_id"),
            date=dt,
            amount=Decimal(str(item["amount"])),
            title=item["title"],
            raw_hash=item["raw_hash"]
        )
        to_save.append(tx)
    
    try:
        await FinanceRepository.save_transactions(db, to_save)
        return {"message": f"Successfully imported {len(to_save)} transactions"}
    except Exception:
        raise HTTPException(status_code=400, detail="Import failed (possible duplicates).")