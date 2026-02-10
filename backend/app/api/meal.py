import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.deps import get_db, get_current_user
from app.db.repositories.meal import MealRepository
from app.db.models.meal import (
    Meal, MealCreate, MealUpdate, 
    ProteinType, BaseType, DictCreate, DictUpdate
)
from app.services.meal_service import generate_default_user_data

router = APIRouter(prefix="/meals", tags=["Meals & Nutrition"])

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_meal(
    data: MealCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    meal = Meal(
        user_id=current_user.id,
        id_protein_type=data.id_protein_type,
        id_base_type=data.id_base_type,
        name=data.name,
        description=data.description,
        is_weekend_dish=data.is_weekend_dish
    )
    new_meal = await MealRepository.create(db, meal)
    return {"message": "Meal created", "id": new_meal.id}

@router.get("/", status_code=status.HTTP_200_OK)
async def list_meals(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    return await MealRepository.get_all_by_user(db, current_user.id)

@router.get("/simple-list", status_code=status.HTTP_200_OK)
async def list_meals_simple(
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """
    Returns a list of the user's meals limited to ID and name only.
    """
    query = select(Meal.id, Meal.name).where(Meal.user_id == current_user.id)
    result = await db.execute(query)
    
    meals = result.all()
    return [{"id": m.id, "name": m.name} for m in meals]
    
@router.get("/{meal_id}", status_code=status.HTTP_200_OK)
async def get_meal_details(
    meal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
):
    meal = await MealRepository.get_by_id(db, meal_id, current_user.id)
    
    if not meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal not found"
        )
    
    return meal

@router.patch("/{meal_id}")
async def update_meal(
    meal_id: uuid.UUID,
    data: MealUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    meal = await MealRepository.get_by_id(db, meal_id, current_user.id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    
    updated = await MealRepository.update(db, meal, data.model_dump(exclude_unset=True))
    return {"message": "Updated", "id": updated.id}

@router.delete("/{meal_id}")
async def delete_meal(meal_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    meal = await MealRepository.get_by_id(db, meal_id, current_user.id)
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    await MealRepository.delete(db, meal)
    return {"message": "Deleted"}

@router.get("/proteins/all")
async def get_proteins(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    return await MealRepository.get_protein_types(db)

@router.post("/proteins/")
async def create_protein(data: DictCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    protein = ProteinType(**data.model_dump())
    db.add(protein)
    await db.commit()
    return protein
    
@router.patch("/proteins/{p_id}")
async def update_protein(
    p_id: uuid.UUID, 
    data: DictUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    protein = await db.get(ProteinType, p_id)
    if not protein:
        raise HTTPException(status_code=404, detail="Protein type not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(protein, key, value)
    
    await db.commit()
    await db.refresh(protein)
    return protein

@router.delete("/proteins/{p_id}")
async def delete_protein(p_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    check = await db.execute(select(func.count(Meal.id)).where(Meal.id_protein_type == p_id))
    if check.scalar() > 0:
        raise HTTPException(status_code=400, detail="Cannot delete: Protein is used in existing meals")
    
    res = await db.get(ProteinType, p_id)
    if res:
        await db.delete(res)
        await db.commit()
    return {"message": "Deleted"}

@router.get("/bases/all")
async def get_bases(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    return await MealRepository.get_base_types(db)

@router.post("/bases/")
async def create_base(data: DictCreate, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    base = BaseType(**data.model_dump())
    db.add(base)
    await db.commit()
    return base
    
@router.patch("/bases/{b_id}")
async def update_base(
    b_id: uuid.UUID, 
    data: DictUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    base = await db.get(BaseType, b_id)
    if not base:
        raise HTTPException(status_code=404, detail="Base type not found")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(base, key, value)
    
    await db.commit()
    await db.refresh(base)
    return base

@router.delete("/bases/{b_id}")
async def delete_base(b_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    check = await db.execute(select(func.count(Meal.id)).where(Meal.id_base_type == b_id))
    if check.scalar() > 0:
        raise HTTPException(status_code=400, detail="Cannot delete: Base type is used in existing meals")
    
    res = await db.get(BaseType, b_id)
    if res:
        await db.delete(res)
        await db.commit()
    return {"message": "Deleted"}

@router.get("/search", status_code=status.HTTP_200_OK)
async def search_meals(
    name: str, 
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    return await MealRepository.search_meals(db, current_user.id, name)
