import uuid
from sqlalchemy import select, or_, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.user import User
from app.db.models.refresh_token import RefreshToken

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
    async def get_by_id(db: AsyncSession, user_id: uuid.UUID):
        return await db.get(User, user_id)

    @staticmethod
    async def limit_active_sessions(db: AsyncSession, user_id: uuid.UUID, max_sessions: int = 5):
        subquery = (
            select(RefreshToken.id)
            .where(RefreshToken.user_id == user_id)
            .order_by(RefreshToken.created_at.desc())
            .offset(max_sessions)
        )
        
        result = await db.execute(subquery)
        ids_to_delete = result.scalars().all()

        if ids_to_delete:
            await db.execute(
                delete(RefreshToken).where(RefreshToken.id.in_(ids_to_delete))
            )