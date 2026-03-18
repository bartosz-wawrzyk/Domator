import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.deps import get_db, get_current_user
from app.db.repositories.vehicle import VehicleRepository
from app.db.repositories.insurance import InsuranceRepository
from app.db.models.insurance import InsurancePolicy, InsuranceCreate, InsuranceUpdate, InsuranceRead

router = APIRouter(prefix="/vehicles/{vehicle_id}/insurance", tags=["Insurance"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_policy(
    vehicle_id: uuid.UUID,
    data: InsuranceCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    policy_data = data.model_dump()
    policy_data["vehicle_id"] = vehicle_id
    
    policy = InsurancePolicy(**policy_data)
    new_policy = await InsuranceRepository.create(db, policy)
    return {"message": "Policy created", "id": new_policy.id}

@router.get("/", response_model=list[InsuranceRead])
async def list_policies(
    vehicle_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    return await InsuranceRepository.get_all_by_vehicle(db, vehicle_id)

@router.patch("/{policy_id}")
async def update_policy(
    vehicle_id: uuid.UUID,
    policy_id: uuid.UUID,
    data: InsuranceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    policy = await InsuranceRepository.get_by_id(db, policy_id)
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    
    if not policy or not vehicle or policy.vehicle_id != vehicle.id:
        raise HTTPException(status_code=404, detail="Policy not found")

    update_data = data.model_dump(exclude_unset=True)
    await InsuranceRepository.update(db, policy, update_data)
    return {"message": "Policy updated"}
    
@router.delete("/{policy_id}", status_code=status.HTTP_200_OK)
async def delete_policy(
    vehicle_id: uuid.UUID,
    policy_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    vehicle = await VehicleRepository.get_by_id(db, vehicle_id, current_user.id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    policy = await InsuranceRepository.get_by_id(db, policy_id)
    
    if not policy or policy.vehicle_id != vehicle.id:
        raise HTTPException(status_code=404, detail="Policy not found or access denied")

    await InsuranceRepository.delete(db, policy)
    
    return {"message": "Insurance policy deleted successfully"}