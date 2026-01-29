import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

from app.db.deps import get_db, get_current_user
from app.db.repositories.vehicle import VehicleRepository
from app.db.models.vehicle import Vehicle, VehicleCreate, VehicleUpdate 

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    data: VehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = Vehicle(
        user_id=current_user.id,
        brand=data.brand,
        model=data.model,
        production_year=data.production_year,
        vin=data.vin,
        registration_number=data.registration_number,
        fuel_type=data.fuel_type,
        current_mileage=data.current_mileage,
        last_service_date=data.last_service_date,
        last_service_mileage=data.last_service_mileage,
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    vehicle = await VehicleRepository.create(db, vehicle)
    return {"message": "Vehicle created successfully", "vehicle_id": vehicle.id}

@router.get("/", status_code=status.HTTP_200_OK)
async def list_user_vehicles(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicles = await VehicleRepository.get_all_by_user(db, current_user.id)
    return vehicles

@router.get("/{vehicle_id}", status_code=status.HTTP_200_OK)
async def get_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    return vehicle

@router.patch("/{vehicle_id}", status_code=status.HTTP_200_OK)
async def update_vehicle(
    vehicle_id: uuid.UUID,
    data: VehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )
    
    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    updated_vehicle = await VehicleRepository.update(db, vehicle, update_data)
    return {
        "message": "Vehicle updated successfully",
        "vehicle_id": updated_vehicle.id
    }

@router.delete("/{vehicle_id}", status_code=status.HTTP_200_OK)
async def delete_vehicle(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vehicle not found"
        )

    await VehicleRepository.delete(db, vehicle)
    return {"message": "Vehicle deleted successfully"}