import uuid
from datetime import date, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.deps import get_db, get_current_user
from app.db.repositories.meals_planner import MealPlanningRepository
from app.db.models.meal_planner import WeekMealCreate, WeekPlanRead
from app.services.meal_planner import MealPlannerService

router = APIRouter(prefix="/planning", tags=["Meal Planning"])

@router.post("/add-meal", status_code=status.HTTP_201_CREATED)
async def add_meal_to_schedule(
    data: WeekMealCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = MealPlanningRepository(db)
    monday = data.meal_date - timedelta(days=data.meal_date.weekday())
    plan = await repo.get_or_create_week_plan(current_user.id, monday)
    
    await repo.add_meal_to_plan(
        user_id=current_user.id,
        plan_id=plan.id,
        meal_id=data.meal_id,
        target_date=data.meal_date,
        is_two_days=data.is_two_days,
        is_out_of_home=data.is_out_of_home
    )
    return {"message": "Meal added to schedule", "start_date": monday}

@router.get("/week/{monday_date}", response_model=WeekPlanRead)
async def get_weekly_plan(
    monday_date: date,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = MealPlanningRepository(db)
    plan = await repo.get_or_create_week_plan(current_user.id, monday_date)
    return plan

@router.delete("/day/{target_date}")
async def delete_meal_from_day(
    target_date: date,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = MealPlanningRepository(db)
    await repo.remove_meal_from_day(current_user.id, target_date)
    return {"message": f"Meal plan for {target_date} has been cleared"}

@router.post("/set-out-of-home/{target_date}")
async def set_day_out_of_home(
    target_date: date,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = MealPlanningRepository(db)
    monday = target_date - timedelta(days=target_date.weekday())
    plan = await repo.get_or_create_week_plan(current_user.id, monday)
    
    await repo.add_meal_to_plan(
        user_id=current_user.id,
        plan_id=plan.id,
        meal_id=None,
        target_date=target_date,
        is_two_days=False,
        is_out_of_home=True
    )
    return {"message": "Marked as out-of-home"}

@router.get("/generate-proposal/{monday_date}")
async def get_proposal(
    monday_date: date,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = MealPlannerService(db)
    proposal = await service.generate_weekly_proposal(current_user.id, monday_date)
    return proposal

@router.post("/accept-proposal")
async def accept_proposal(
    proposal: List[WeekMealCreate], 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    if not proposal:
        raise HTTPException(status_code=400, detail="The list of suggestions is empty.")
        
    repo = MealPlanningRepository(db)
    
    monday = proposal[0].meal_date - timedelta(days=proposal[0].meal_date.weekday())
    plan = await repo.get_or_create_week_plan(current_user.id, monday)

    for entry in proposal:
        await repo.add_meal_to_plan(
            user_id=current_user.id,
            plan_id=plan.id,
            meal_id=entry.meal_id,
            target_date=entry.meal_date,
            is_two_days=entry.is_two_days,
            is_out_of_home=entry.is_out_of_home
        )
    
    return {"message": f"Saved {len(proposal)} items to the plan"}
    
    
@router.delete("/week/{monday_date}")
async def clear_entire_week(
    monday_date: date,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = MealPlanningRepository(db)
    success = await repo.delete_entire_week(current_user.id, monday_date)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="No plan found for the given date"
        )
        
    return {"message": f"Entire week starting from {monday_date} has been cleared"}
    
@router.get("/month/{year}/{month}")
async def get_monthly_overview(
    year: int,
    month: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    repo = MealPlanningRepository(db)
    meals = await repo.get_monthly_plan(current_user.id, year, month)
    
    calendar_data = []
    for m in meals:
        has_meal = m.meal is not None
        
        calendar_data.append({
            "date": m.meal_date,
            "meal_id": m.meal_id,
            "meal_name": m.meal.name if has_meal else None,
            "is_two_days": getattr(m, 'is_two_days', False),
            "is_out_of_home": m.is_out_of_home,
            "protein_type": m.meal.protein_type.name if has_meal and m.meal.protein_type else None,
            "base_type": m.meal.base_type.name if has_meal and m.meal.base_type else None,
            "note": getattr(m, 'note', '')
        })
        
    return {
        "year": year,
        "month": month,
        "days": calendar_data
    }