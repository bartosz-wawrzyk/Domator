from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.refresh_token import RefreshToken


class RefreshTokenRepository:

    @staticmethod
    async def get_active(
        session: AsyncSession,
        token_hash: str,
    ) -> RefreshToken | None:
        result = await session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.utcnow(),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def revoke(
        session: AsyncSession,
        token: RefreshToken,
    ) -> None:
        token.revoked_at = datetime.utcnow()

    @staticmethod
    async def revoke_by_hash(
        session: AsyncSession,
        token_hash: str,
    ) -> None:
        result = await session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
            )
        )
        token = result.scalar_one_or_none()

        if token:
            token.revoked_at = datetime.utcnow()
            await session.commit()


    @staticmethod
    async def create(
        session: AsyncSession,
        token: RefreshToken,
    ) -> RefreshToken:
        session.add(token)
        await session.commit()
        await session.refresh(token)
        return token
