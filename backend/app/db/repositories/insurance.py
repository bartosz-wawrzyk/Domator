import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from app.db.models.insurance import InsurancePolicy

class InsuranceRepository:
    @staticmethod
    async def create(db: AsyncSession, policy: InsurancePolicy) -> InsurancePolicy:
        db.add(policy)
        await db.commit()
        await db.refresh(policy)
        return policy

    @staticmethod
    async def get_by_id(db: AsyncSession, policy_id: uuid.UUID) -> InsurancePolicy | None:
        result = await db.execute(
            select(InsurancePolicy).where(InsurancePolicy.id == policy_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_all_by_vehicle(db: AsyncSession, vehicle_id: uuid.UUID) -> list[InsurancePolicy]:
        result = await db.execute(
            select(InsurancePolicy)
            .where(InsurancePolicy.vehicle_id == vehicle_id) 
            .order_by(InsurancePolicy.start_date.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def delete(db: AsyncSession, policy: InsurancePolicy) -> None:
        await db.delete(policy)
        await db.commit()

    @staticmethod
    async def update(db: AsyncSession, policy: InsurancePolicy, update_data: dict) -> InsurancePolicy:
        for key, value in update_data.items():
            if hasattr(policy, key) and value is not None:
                setattr(policy, key, value)
        
        await db.commit()
        await db.refresh(policy)
        return policy