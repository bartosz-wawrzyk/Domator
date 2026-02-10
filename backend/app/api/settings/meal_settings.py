from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.deps import get_db, get_current_user
from app.db.repositories.settings.meal_settings import MealSettingsRepository
from app.services.meal_service import generate_default_user_data
from pydantic import BaseModel, Field
from typing import Optional
import uuid

router = APIRouter()

class MealSettingsUpdate(BaseModel):
    default_servings: Optional[int] = Field(None, ge=1, le=10)
    scale_by_two_days: Optional[bool] = None
    shopping_day_of_week: Optional[int] = Field(None, ge=1, le=7)
    shopping_list_days_range: Optional[int] = Field(None, ge=1, le=31)

@router.get("/")
async def get_meal_settings(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Retrieves meal planner settings for the current user."""
    repo = MealSettingsRepository(db)
    return await repo.get_config(current_user.id)

@router.patch("/")
async def update_meal_settings(
    data: MealSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Updates configuration parameters (e.g., number of people or shopping day)."""
    repo = MealSettingsRepository(db)
    update_data = data.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data available for update")
        
    return await repo.update_config(current_user.id, **update_data)

@router.post("/setup-defaults")
async def setup_defaults(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Generates a starter set of dishes and ingredients if the user does not already have them."""
    try:
        user_id_str = str(current_user.id)
        # Wywołanie serwisu z naszą nową logiką sprawdzającą
        was_added = await generate_default_user_data(db, user_id_str)
        
        if was_added:
            return {
                "status": "created",
                "message": "Default dishes and ingredients have been successfully added to your account!"
            }
        else:
            return {
                "status": "skipped",
                "message": "Your account already has a base of dishes. No changes were made."
            }
            
    except Exception as e:
        # Możesz tu dodać logger.error(e) dla lepszego debugowania
        raise HTTPException(status_code=500, detail=f"Error generating default data: {str(e)}")