import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.deps import get_db, get_current_user
from app.db.repositories.vehicle import VehicleRepository
from app.db.repositories.fuel import FuelRepository
from app.db.models.fuel import FuelLog, FuelLogCreate, FuelLogUpdate, FuelLogRead
from app.services.fuel_service import FuelService

router = APIRouter(prefix="/vehicles/{vehicle_id}/fuel", tags=["Fuel"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_fuel_log(
    vehicle_id: uuid.UUID,
    data: FuelLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    fuel_log = FuelLog(**data.model_dump())
    new_log = await FuelRepository.create(db, fuel_log)
    return {"message": "Fuel log added", "id": new_log.id}

@router.get("/", response_model=list[FuelLogRead])
async def list_fuel_logs(
    vehicle_id: uuid.UUID,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return await FuelRepository.get_all_by_vehicle(db, vehicle_id, limit, offset)

@router.get("/consumption")
async def get_fuel_consumption(
    vehicle_id: uuid.UUID,
    fuel_type: str = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return await FuelService.calculate_consumption(db, vehicle_id, fuel_type)

@router.patch("/{log_id}", status_code=status.HTTP_200_OK)
async def update_fuel_log(
    vehicle_id: uuid.UUID,
    log_id: uuid.UUID,
    data: FuelLogUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    fuel_log = await FuelRepository.get_by_id(db, log_id)
    if not fuel_log or fuel_log.vehicle_id != vehicle.id:
        raise HTTPException(status_code=404, detail="Fuel log not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated_log = await FuelRepository.update(db, fuel_log, update_data)
    
    return {
        "message": "Fuel log updated successfully",
        "log_id": updated_log.id
    }

@router.delete("/{log_id}")
async def delete_fuel_log(
    vehicle_id: uuid.UUID,
    log_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    log = await FuelRepository.get_by_id(db, log_id)
    
    if not vehicle or not log or log.vehicle_id != vehicle.id:
        raise HTTPException(status_code=404, detail="Log not found")

    await FuelRepository.delete(db, log)
    return {"message": "Log deleted"}