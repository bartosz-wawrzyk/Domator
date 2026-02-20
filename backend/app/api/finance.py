import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract, case
from fastapi import UploadFile, File
from datetime import datetime
from app.services.finance_service import FinanceService
from app.db.deps import get_db, get_current_user
from app.db.models.user import User
from app.db.models.finance import (
    Account, AccountCreate, AccountRead,
    Category, CategoryCreate, CategoryRead,
    ImportRule, ImportRuleCreate, ImportRuleRead, 
    Transaction, Category
)
from app.db.repositories.finance import FinanceRepository

router = APIRouter(prefix="/finance", tags=["Finance"])

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
    """Creates a new account (e.g., Santander, mBank)."""
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
        raise HTTPException(status_code=404, detail="Account does not exist or you do not have permission to access it.")

    tx_check = await db.execute(
        select(Transaction).where(Transaction.account_id == account_id).limit(1)
    )
    if tx_check.scalars().first():
        raise HTTPException(
            status_code=400, 
            detail="You cannot delete an account that contains transactions. Delete the transaction history first."
        )

    rules_check = await db.execute(
        select(ImportRule).where(ImportRule.account_id == account_id).limit(1)
    )
    if rules_check.scalars().first():
        raise HTTPException(
            status_code=400, 
            detail="This account has assigned import rules. Delete them before deleting the account."
        )

    deleted = await FinanceRepository.delete_account(db, account_id, current_user.id)
    return {"message": "Account deleted successfully"}

@router.get("/categories", response_model=List[CategoryRead])
async def get_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves the list of categories defined by the logged-in user."""
    return await FinanceRepository.get_user_categories(db, current_user.id)

@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new expense category."""
    category = Category(
        user_id=current_user.id, 
        name=data.name
    )
    return await FinanceRepository.create_category(db, category)

@router.put("/categories/{category_id}", response_model=CategoryRead)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates the name of a category."""
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
    """Deletes a category only if it has no assigned rules or transactions."""

    category = await FinanceRepository.get_category_by_id(db, category_id)
    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")

    rules_check = await db.execute(
        select(ImportRule).where(ImportRule.category_id == category_id).limit(1)
    )
    if rules_check.scalars().first():
        raise HTTPException(
            status_code=400, 
            detail="You cannot delete a category that is used in import rules. Delete the rules first."
        )

    tx_check = await db.execute(
        select(Transaction).where(Transaction.category_id == category_id).limit(1)
    )
    if tx_check.scalars().first():
        raise HTTPException(
            status_code=400, 
            detail="This category has assigned transactions. Change the category of the transactions before deleting it."
        )

    await db.delete(category)
    await db.commit()
    return {"message": "Category deleted successfully"}

@router.put("/rules/{rule_id}", response_model=ImportRuleRead)
async def update_rule(
    rule_id: uuid.UUID,
    data: ImportRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates the keyword or assigned category in an import rule."""

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
    """Deletes the import rule, provided that there are no related transactions."""
    
    rule_query = select(ImportRule).join(Account).where(
        ImportRule.id == rule_id, 
        Account.user_id == current_user.id
    )
    res = await db.execute(rule_query)
    rule = res.scalars().first()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found.")

    tx_check_query = select(Transaction).where(
        Transaction.account_id == rule.account_id,
        Transaction.category_id == rule.category_id,
        Transaction.title.ilike(f"%{rule.keyword}%")
    ).limit(1)
    
    tx_res = await db.execute(tx_check_query)
    if tx_res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete a rule that has already been used to categorize transactions."
        )

    await db.delete(rule)
    await db.commit()
    return {"message": "Rule deleted successfully"}

@router.get("/rules/{account_id}", response_model=List[ImportRuleRead])
async def get_rules(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves import rules for a specific account."""
    return await FinanceRepository.get_account_rules(db, account_id)

@router.post("/rules", response_model=ImportRuleRead, status_code=status.HTTP_201_CREATED)
async def create_rule(
    data: ImportRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adds an assignment rule (e.g., BIEDRONKA -> Groceries)."""
    rule = ImportRule(
        account_id=data.account_id,
        category_id=data.category_id,
        keyword=data.keyword.upper()
    )
    return await FinanceRepository.create_import_rule(db, rule)

@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes the import rule."""
    deleted = await FinanceRepository.delete_import_rule(db, rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Rule deleted"}

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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="An unexpected error occurred while parsing the file.")

    if not transactions:
        raise HTTPException(
            status_code=400, 
            detail="No transactions found in the file. Please check that you selected the correct bank."
        )

    rules = await FinanceRepository.get_account_rules(db, account_id)
    enriched_transactions = FinanceService.match_categories(transactions, rules)

    return enriched_transactions

@router.post("/import/confirm/{account_id}")
async def import_confirm(
    account_id: uuid.UUID,
    transactions_data: List[dict], 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.db.models.finance import Transaction
    from datetime import datetime
    from decimal import Decimal
    
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
    except Exception as e:
        raise HTTPException(
            status_code=400, 
            detail="Duplicate transactions detected or database error"
        )
    
@router.get("/stats/monthly/{account_id}")
async def get_monthly_stats(
    account_id: uuid.UUID,
    month: int, 
    year: int, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats_query = (
        select(
            func.coalesce(Category.name, "Nieskategoryzowane").label("cat_name"),
            func.sum(Transaction.amount).label("total")
        )
        .join(Category, Transaction.category_id == Category.id, isouter=True)
        .where(
            Transaction.account_id == account_id,
            extract('month', Transaction.date) == month,
            extract('year', Transaction.date) == year,
            Transaction.amount < 0
        )
        .group_by("cat_name")
    )
    
    result = await db.execute(stats_query)
    categories_data = [
        {"name": row.cat_name, "value": abs(float(row.total))}
        for row in result.all()
    ]

    summary_query = (
            select(
                func.sum(Transaction.amount).label("total"),
                case(
                    (Transaction.amount > 0, "income"), 
                    else_="expense"
                ).label("type")
            )
            .where(
                Transaction.account_id == account_id,
                extract('month', Transaction.date) == month,
                extract('year', Transaction.date) == year
            )
            .group_by("type")
        )

    summary_result = await db.execute(summary_query)
    summary = {"income": 0.0, "expense": 0.0, "balance": 0.0}
    
    for row in summary_result.all():
        if row.type == "income":
            summary["income"] = float(row.total)
        else:
            summary["expense"] = abs(float(row.total))
    
    summary["balance"] = summary["income"] - summary["expense"]

    return {
        "summary": summary,
        "categories": categories_data
    }

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
    month_names = ["Sty", "Lut", "Mar", "Kwi", "Maj", "Cze", "Lip", "Sie", "Wrz", "Paź", "Lis", "Gru"]

    for m in range(1, 13):
        data = months_map.get(m, {"income": 0.0, "expense": 0.0})
        yearly_data.append({
            "month_num": m,
            "name": month_names[m-1],
            "income": round(data["income"], 2),
            "expense": round(data["expense"], 2),
            "balance": round(data["income"] - data["expense"], 2)
        })

    return {
        "year": year,
        "data": yearly_data
    }