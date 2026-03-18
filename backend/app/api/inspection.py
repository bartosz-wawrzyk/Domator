import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.deps import get_db, get_current_user
from app.db.repositories.vehicle import VehicleRepository
from app.db.repositories.inspection import InspectionRepository
from app.db.models.inspection import TechnicalInspection, InspectionCreate, InspectionUpdate, InspectionRead

router = APIRouter(prefix="/vehicles/{vehicle_id}/inspections", tags=["Inspections"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_inspection(
    vehicle_id: uuid.UUID,
    data: InspectionCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    inspection = TechnicalInspection(**data.model_dump())
    new_inspection = await InspectionRepository.create(db, inspection)
    return {"message": "Inspection added", "id": new_inspection.id}

@router.get("/", response_model=list[InspectionRead])
async def list_inspections(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return await InspectionRepository.get_all_by_vehicle(db, vehicle_id)

@router.patch("/{inspection_id}", status_code=status.HTTP_200_OK)
async def update_inspection(
    vehicle_id: uuid.UUID,
    inspection_id: uuid.UUID,
    data: InspectionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    inspection = await InspectionRepository.get_by_id(db, inspection_id)
    if not inspection or inspection.vehicle_id != vehicle.id:
        raise HTTPException(status_code=404, detail="Inspection not found")

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    updated_inspection = await InspectionRepository.update(db, inspection, update_data)
    
    return {
        "message": "Technical inspection updated successfully",
        "inspection_id": updated_inspection.id
    }
    
@router.delete("/{inspection_id}")
async def delete_inspection(
    vehicle_id: uuid.UUID,
    inspection_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    inspection = await InspectionRepository.get_by_id(db, inspection_id)
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    
    if not inspection or not vehicle or inspection.vehicle_id != vehicle.id:
        raise HTTPException(status_code=404, detail="Inspection not found")

    await InspectionRepository.delete(db, inspection)
    return {"message": "Inspection deleted"}