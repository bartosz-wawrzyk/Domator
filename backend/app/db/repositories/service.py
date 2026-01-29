import uuid
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from app.db.models.service_event import ServiceEvent
from app.db.models.service_item import ServiceItem
from app.db.models.vehicle import Vehicle

class ServiceRepository:
    @staticmethod
    async def sync_vehicle_cache(db: AsyncSession, vehicle_id: uuid.UUID):
        result = await db.execute(
            select(ServiceEvent)
            .where(ServiceEvent.vehicle_id == vehicle_id)
            .order_by(ServiceEvent.service_date.desc(), ServiceEvent.mileage_at_service.desc())
            .limit(1)
        )
        latest_service = result.scalar_one_or_none()

        vehicle_result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
        vehicle = vehicle_result.scalar_one_or_none()

        if vehicle and latest_service:
            vehicle.current_mileage = max(vehicle.current_mileage, latest_service.mileage_at_service)
            vehicle.last_service_date = latest_service.service_date
            vehicle.last_service_mileage = latest_service.mileage_at_service
            await db.commit()

    @staticmethod
    async def update_event_total_cost(db: AsyncSession, event_id: uuid.UUID):
        sum_result = await db.execute(
            select(func.sum(ServiceItem.cost)).where(ServiceItem.service_event_id == event_id)
        )
        total = sum_result.scalar() or 0

        await db.execute(
            update(ServiceEvent)
            .where(ServiceEvent.id == event_id)
            .values(total_cost=total)
        )
        await db.commit()

    @staticmethod
    async def create_event(db: AsyncSession, event: ServiceEvent) -> ServiceEvent:
        db.add(event)
        await db.commit()
        await db.refresh(event)
        await ServiceRepository.sync_vehicle_cache(db, event.vehicle_id)
        return event

    @staticmethod
    async def get_event_by_id(db: AsyncSession, event_id: uuid.UUID):
        result = await db.execute(select(ServiceEvent).where(ServiceEvent.id == event_id))
        return result.scalar_one_or_none()