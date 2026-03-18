import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.fuel import FuelLog

class FuelRepository:
    @staticmethod
    async def create(db: AsyncSession, fuel_log: FuelLog) -> FuelLog:
        db.add(fuel_log)
        await db.commit()
        await db.refresh(fuel_log)
        return fuel_log

    @staticmethod
    async def get_by_id(db: AsyncSession, log_id: uuid.UUID) -> FuelLog | None:
        result = await db.execute(
            select(FuelLog).where(FuelLog.id == log_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_by_vehicle(
        db: AsyncSession, 
        vehicle_id: uuid.UUID, 
        limit: int = 20, 
        offset: int = 0
    ) -> list[FuelLog]:
        result = await db.execute(
            select(FuelLog)
            .where(FuelLog.vehicle_id == vehicle_id)
            .order_by(FuelLog.date.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    @staticmethod
    async def delete(db: AsyncSession, fuel_log: FuelLog) -> None:
        await db.delete(fuel_log)
        await db.commit()

    @staticmethod
    async def update(db: AsyncSession, fuel_log: FuelLog, update_data: dict) -> FuelLog:
        for key, value in update_data.items():
            if hasattr(fuel_log, key) and value is not None:
                setattr(fuel_log, key, value)
        
        await db.commit()
        await db.refresh(fuel_log)
        return fuel_log