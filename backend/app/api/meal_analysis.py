from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.deps import get_db, get_current_user
from datetime import date

router = APIRouter()

@router.get("/shopping-list")
async def get_shopping_list(
    start_date: date, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.db.repositories.meal_analysis import MealAnalysisRepository
    repo = MealAnalysisRepository(db)
    return await repo.get_shopping_list(current_user.id, start_date)