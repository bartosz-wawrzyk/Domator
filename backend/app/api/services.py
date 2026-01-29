import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.orm import selectinload
from app.db.deps import get_db, get_current_user
from app.db.models.service_event import ServiceEvent, ServiceEventCreate, ServiceEventUpdate
from app.db.models.service_item import ServiceItem, ServiceItemCreate
from app.db.models.vehicle import Vehicle
from app.db.repositories.service import ServiceRepository

router = APIRouter(prefix="/services", tags=["Service Events"])

@router.post("/events", status_code=status.HTTP_201_CREATED)
async def create_service_event(
    data: ServiceEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle_res = await db.execute(
        select(Vehicle).where(Vehicle.id == data.vehicle_id, Vehicle.user_id == current_user.id)
    )
    vehicle = vehicle_res.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    new_event = ServiceEvent(
        vehicle_id=data.vehicle_id,
        service_date=data.service_date,
        mileage_at_service=data.mileage_at_service,
        notes=data.notes,
        total_cost=0
    )
    
    event = await ServiceRepository.create_event(db, new_event)
    return {"message": "Service event created", "event_id": event.id}

@router.post("/items", status_code=status.HTTP_201_CREATED)
async def add_service_item(
    data: ServiceItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    event_res = await db.execute(
        select(ServiceEvent).join(Vehicle, Vehicle.id == ServiceEvent.vehicle_id)
        .where(ServiceEvent.id == data.service_event_id, Vehicle.user_id == current_user.id)
    )
    event = event_res.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Service event not found")

    new_item = ServiceItem(**data.model_dump())
    db.add(new_item)
    
    await db.flush()
    
    cost_res = await db.execute(
        select(func.sum(ServiceItem.cost)).where(ServiceItem.service_event_id == event.id)
    )
    event.total_cost = cost_res.scalar() or 0
    
    await db.commit()
    return {"message": "Service item added and total cost updated"}

@router.get("/vehicle/{vehicle_id}")
async def get_vehicle_history(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(
        select(ServiceEvent)
        .where(ServiceEvent.vehicle_id == vehicle_id)
        .options(selectinload(ServiceEvent.items)) 
        .order_by(ServiceEvent.service_date.desc())
    )
    events = result.scalars().all()
    return events
    
@router.patch("/events/{event_id}")
async def update_service_event(
    event_id: uuid.UUID,
    data: ServiceEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    result = await db.execute(
        select(ServiceEvent).join(Vehicle, Vehicle.id == ServiceEvent.vehicle_id)
        .where(ServiceEvent.id == event_id, Vehicle.user_id == current_user.id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Service event not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(event, key, value)

    await db.commit()
    
    await ServiceRepository.sync_vehicle_cache(db, event.vehicle_id)
    
    return {"message": "Service event updated and vehicle cache synced"}

@router.delete("/events/{event_id}")
async def delete_service_event(
    event_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    result = await db.execute(
        select(ServiceEvent).join(Vehicle, Vehicle.id == ServiceEvent.vehicle_id)
        .where(ServiceEvent.id == event_id, Vehicle.user_id == current_user.id)
    )
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Service event not found")

    vehicle_id = event.vehicle_id
    
    await db.execute(delete(ServiceItem).where(ServiceItem.service_event_id == event_id))
    
    await db.delete(event)
    await db.commit()

    await ServiceRepository.sync_vehicle_cache(db, vehicle_id)
    
    return {"message": "Service event and items deleted, vehicle cache updated"}
    
@router.delete("/items/{item_id}")
async def delete_service_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    result = await db.execute(
        select(ServiceItem)
        .join(ServiceEvent, ServiceEvent.id == ServiceItem.service_event_id)
        .join(Vehicle, Vehicle.id == ServiceEvent.vehicle_id)
        .where(ServiceItem.id == item_id, Vehicle.user_id == current_user.id)
    )
    item = result.scalar_one_or_none()
    
    if not item:
        raise HTTPException(status_code=404, detail="Service item not found")

    event_id = item.service_event_id
    vehicle_id = None

    event_res = await db.execute(select(ServiceEvent).where(ServiceEvent.id == event_id))
    event = event_res.scalar_one()
    vehicle_id = event.vehicle_id

    await db.delete(item)
    await db.flush()

    cost_res = await db.execute(
        select(func.sum(ServiceItem.cost)).where(ServiceItem.service_event_id == event_id)
    )
    event.total_cost = cost_res.scalar() or 0
    
    await db.commit()
    
    await ServiceRepository.sync_vehicle_cache(db, vehicle_id)
    
    return {"message": "Item deleted and total cost updated"}