import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.db.models.inspection import TechnicalInspection

class InspectionRepository:
    @staticmethod
    async def create(db: AsyncSession, inspection: TechnicalInspection) -> TechnicalInspection:
        db.add(inspection)
        await db.commit()
        await db.refresh(inspection)
        return inspection

    @staticmethod
    async def get_by_id(db: AsyncSession, inspection_id: uuid.UUID) -> TechnicalInspection | None:
        result = await db.execute(
            select(TechnicalInspection).where(TechnicalInspection.id == inspection_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_by_vehicle(db: AsyncSession, vehicle_id: uuid.UUID) -> list[TechnicalInspection]:
        result = await db.execute(
            select(TechnicalInspection)
            .where(TechnicalInspection.vehicle_id == vehicle_id)
            .order_by(TechnicalInspection.inspection_date.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def delete(db: AsyncSession, inspection: TechnicalInspection) -> None:
        await db.delete(inspection)
        await db.commit()

    @staticmethod
    async def update(db: AsyncSession, inspection: TechnicalInspection, update_data: dict) -> TechnicalInspection:
        for key, value in update_data.items():
            if hasattr(inspection, key) and value is not None:
                setattr(inspection, key, value)
        
        await db.commit()
        await db.refresh(inspection)
        return inspection