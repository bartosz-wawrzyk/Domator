import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.activity_log import UserActivityLog
from sqlalchemy import select
from typing import List

class ActivityLogRepository:
    @staticmethod
    async def create_log(
        session: AsyncSession,
        user_id: str | None,
        action: str,
        status: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
        location: str | None = None,
        details: dict | None = None
    ):
        log_entry = UserActivityLog(
            user_id=user_id,
            action=action,
            status=status,
            ip_address=ip_address,
            user_agent=user_agent,
            location=location,
            details=details
        )
        session.add(log_entry)
        await session.flush()
        
    @staticmethod
    async def get_user_logs(
        session: AsyncSession,
        user_id: uuid.UUID,
        limit: int = 20
    ) -> List[UserActivityLog]:
        query = (
            select(UserActivityLog)
            .where(UserActivityLog.user_id == user_id)
            .order_by(UserActivityLog.timestamp.desc())
            .limit(limit)
        )
        result = await session.execute(query)
        return result.scalars().all()