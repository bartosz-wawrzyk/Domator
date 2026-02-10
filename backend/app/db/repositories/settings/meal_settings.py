import uuid
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.settings.meal_settings import MealSettings

class MealSettingsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_config(self, user_id: uuid.UUID) -> MealSettings:
        """Retrieves the configuration. If it does not exist, creates a default one for the user."""
        query = select(MealSettings).where(MealSettings.user_id == user_id)
        result = await self.session.execute(query)
        config = result.scalar_one_or_none()

        if not config:
            config = MealSettings(user_id=user_id)
            self.session.add(config)
            await self.session.commit()
            await self.session.refresh(config)
        
        return config

    async def update_config(self, user_id: uuid.UUID, **kwargs) -> MealSettings:
        """Updates configuration fields."""
        query = (
            update(MealSettings)
            .where(MealSettings.user_id == user_id)
            .values(**kwargs)
        )
        await self.session.execute(query)
        await self.session.commit()
        return await self.get_config(user_id)