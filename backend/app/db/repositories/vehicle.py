import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.db.models.vehicle import Vehicle

class VehicleRepository:
    @staticmethod
    async def create(db: AsyncSession, vehicle: Vehicle) -> Vehicle:
        db.add(vehicle)
        await db.commit()
        await db.refresh(vehicle)
        return vehicle

    @staticmethod
    async def get_by_id(db: AsyncSession, vehicle_id: uuid.UUID, user_id: uuid.UUID) -> Vehicle | None:
        result = await db.execute(
            select(Vehicle).where(
                Vehicle.id == vehicle_id,
                Vehicle.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_by_user(db: AsyncSession, user_id: uuid.UUID) -> list[Vehicle]:
        result = await db.execute(
            select(Vehicle).where(Vehicle.user_id == user_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def delete(db: AsyncSession, vehicle: Vehicle) -> None:
        await db.delete(vehicle)
        await db.commit()

    @staticmethod
    async def update(db: AsyncSession, vehicle: Vehicle, update_data: dict) -> Vehicle:
        for key, value in update_data.items():
            if hasattr(vehicle, key) and value is not None:
                setattr(vehicle, key, value)
        
        vehicle.updated_at = datetime.now() 
        
        await db.commit()
        await db.refresh(vehicle)
        return vehicle