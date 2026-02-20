import uuid
from typing import Sequence, List
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.finance import Account, Category, ImportRule, Transaction

class FinanceRepository:

    @staticmethod
    async def create_account(session: AsyncSession, account: Account) -> Account:
        session.add(account)
        await session.commit()
        await session.refresh(account)
        return account

    @staticmethod
    async def get_user_accounts(session: AsyncSession, user_id: uuid.UUID) -> Sequence[Account]:
        result = await session.execute(
            select(Account).where(Account.user_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def delete_account(session: AsyncSession, account_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = delete(Account).where(
            Account.id == account_id, 
            Account.user_id == user_id
        )
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
        result = await session.execute(
            select(Category).where(Category.user_id == user_id)
        )
        return result.scalars().all()

    @staticmethod
    async def delete_category(session: AsyncSession, category_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        stmt = delete(Category).where(
            Category.id == category_id, 
            Category.user_id == user_id
        )
        result = await session.execute(stmt)
        await session.commit()
        return result.rowcount > 0

    @staticmethod
    async def create_import_rule(session: AsyncSession, rule: ImportRule) -> ImportRule:
        session.add(rule)
        await session.commit()
        await session.refresh(rule)
        return rule

    @staticmethod
    async def get_account_rules(session: AsyncSession, account_id: uuid.UUID) -> Sequence[ImportRule]:
        result = await session.execute(
            select(ImportRule).where(ImportRule.account_id == account_id)
        )
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
    async def get_transactions_by_account(session: AsyncSession, account_id: uuid.UUID) -> Sequence[Transaction]:
        result = await session.execute(
            select(Transaction)
            .where(Transaction.account_id == account_id)
            .order_by(Transaction.date.desc())
        )
        return result.scalars().all()
    
    @staticmethod
    async def get_category_by_id(db: AsyncSession, category_id: uuid.UUID):
        result = await db.execute(select(Category).where(Category.id == category_id))
        return result.scalars().first()