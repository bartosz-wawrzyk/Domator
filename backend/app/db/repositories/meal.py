import uuid
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import joinedload
from datetime import datetime
from app.db.models.meal import Meal, ProteinType, BaseType

class MealRepository:
    
    @staticmethod
    async def create(db: AsyncSession, meal_obj: Meal) -> Meal:
        db.add(meal_obj)
        await db.commit()
        await db.refresh(meal_obj)
        return meal_obj

    @staticmethod
    async def get_by_id(db: AsyncSession, meal_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Meal]:
        result = await db.execute(
            select(Meal)
            .options(joinedload(Meal.protein_type), joinedload(Meal.base_type))
            .where(Meal.id == meal_id, Meal.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_by_user(db: AsyncSession, user_id: uuid.UUID) -> List[Meal]:
        result = await db.execute(
            select(Meal)
            .options(joinedload(Meal.protein_type), joinedload(Meal.base_type))
            .where(Meal.user_id == user_id)
            .order_by(Meal.name)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update(db: AsyncSession, meal: Meal, update_data: dict) -> Meal:
        for key, value in update_data.items():
            if hasattr(meal, key) and value is not None:
                setattr(meal, key, value)
        
        meal.updated_at = datetime.now()
        await db.commit()
        await db.refresh(meal)
        return meal

    @staticmethod
    async def delete(db: AsyncSession, meal: Meal) -> None:
        await db.delete(meal)
        await db.commit()

    @staticmethod
    async def get_protein_types(db: AsyncSession) -> List[ProteinType]:
        result = await db.execute(select(ProteinType).order_by(ProteinType.category))
        return list(result.scalars().all())

    @staticmethod
    async def get_base_types(db: AsyncSession) -> List[BaseType]:
        result = await db.execute(select(BaseType).order_by(BaseType.category))
        return list(result.scalars().all())