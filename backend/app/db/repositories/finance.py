import uuid
from typing import Sequence, List, Optional
from sqlalchemy import select, delete, extract, func, case, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.db.models.finance import Account, Category, ImportRule, Transaction

class FinanceRepository:
    @staticmethod
    async def is_account_owner(session: AsyncSession, account_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        result = await session.execute(
            select(Account).where(Account.id == account_id, Account.user_id == user_id)
        )
        return result.scalars().first() is not None

    @staticmethod
    async def create_account(session: AsyncSession, account: Account) -> Account:
        session.add(account)
        await session.commit()
        await session.refresh(account)
        return account

    @staticmethod
    async def get_user_accounts(session: AsyncSession, user_id: uuid.UUID) -> Sequence[Account]:
                                       
        result = await session.execute(select(Account).where(Account.user_id == user_id))
         
        return result.scalars().all()

    @staticmethod
    async def delete_account(session: AsyncSession, account_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = delete(Account).where(Account.id == account_id, Account.user_id == user_id)
                                      
                                      
         
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount > 0

    @staticmethod
    async def create_category(session: AsyncSession, category: Category) -> Category:
        session.add(category)
        await session.commit()
        await session.refresh(category)
        return category

    @staticmethod
    async def get_user_categories(session: AsyncSession, user_id: uuid.UUID) -> Sequence[Category]:
                                       
        result = await session.execute(select(Category).where(Category.user_id == user_id))
         
        return result.scalars().all()

    @staticmethod
    async def get_category_by_id(db: AsyncSession, category_id: uuid.UUID):
        result = await db.execute(select(Category).where(Category.id == category_id))
        return result.scalars().first()
                                       
    @staticmethod
    async def create_import_rule(session: AsyncSession, rule: ImportRule) -> ImportRule:
        session.add(rule)
        await session.commit()
        await session.refresh(rule)
        return rule

    @staticmethod
    async def get_account_rules(session: AsyncSession, account_id: uuid.UUID) -> Sequence[ImportRule]:
                                       
        result = await session.execute(select(ImportRule).where(ImportRule.account_id == account_id))
         
        return result.scalars().all()

    @staticmethod
    async def delete_import_rule(session: AsyncSession, rule_id: uuid.UUID) -> bool:
        stmt = delete(ImportRule).where(ImportRule.id == rule_id)
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount > 0

    @staticmethod
    async def save_transactions(session: AsyncSession, transactions: List[Transaction]):
        session.add_all(transactions)
        await session.commit()

    @staticmethod
    async def get_monthly_transactions(
        session: AsyncSession, account_id: uuid.UUID, month: int, year: int, limit: int = 50, offset: int = 0
    ) -> Sequence[Transaction]:
        result = await session.execute(
            select(Transaction)
            .options(joinedload(Transaction.category))
            .where(
                Transaction.account_id == account_id,
                extract('month', Transaction.date) == month,
                extract('year', Transaction.date) == year
            )
            .order_by(Transaction.date.desc())
            .limit(limit).offset(offset)
        )
        return result.scalars().all()

    @staticmethod
    async def update_transaction_category(session: AsyncSession, transaction_id: uuid.UUID, category_id: uuid.UUID) -> Optional[Transaction]:
        result = await session.execute(select(Transaction).where(Transaction.id == transaction_id))
        transaction = result.scalars().first()
        if transaction:
            transaction.category_id = category_id
            await session.commit()
            await session.refresh(transaction)
        return transaction

    @staticmethod
    async def apply_rule_to_existing_transactions(session: AsyncSession, rule: ImportRule) -> int:
        stmt = (
            update(Transaction)
            .where(
                Transaction.account_id == rule.account_id,
                Transaction.category_id == None,
                Transaction.title.ilike(f"%{rule.keyword}%")
            )
            .values(category_id=rule.category_id)
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount

    @staticmethod
    async def get_monthly_stats(session: AsyncSession, account_id: uuid.UUID, month: int, year: int):
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
        res = await session.execute(stats_query)
        categories_data = [{"name": r.cat_name, "value": abs(float(r.total))} for r in res.all()]

        summary_query = (
            select(
                func.sum(case((Transaction.amount > 0, Transaction.amount), else_=0)).label("income"),
                func.sum(case((Transaction.amount < 0, Transaction.amount), else_=0)).label("expense")
            )
            .where(
                Transaction.account_id == account_id,
                extract('month', Transaction.date) == month,
                extract('year', Transaction.date) == year
            )
        )
        sum_res = await session.execute(summary_query)
        row = sum_res.one()
        income = float(row.income or 0)
        expense = abs(float(row.expense or 0))
        
        return {
            "summary": {"income": income, "expense": expense, "balance": round(income - expense, 2)},
            "categories": categories_data
        }