from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.user import User

class UserRepository:

    @staticmethod
    async def get_by_email_or_login(
        session: AsyncSession,
        identifier: str,
    ) -> User | None:
        result = await session.execute(
            select(User).where(
                or_(
                    User.email == identifier,
                    User.login == identifier,
                )
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create(
        session: AsyncSession,
        user: User,
    ) -> User:
        session.add(user)
        await session.commit()
        await session.refresh(user)
        return user

    @staticmethod
    async def get_by_id(db: AsyncSession, user_id: str):
        return await db.get(User, user_id)