import uuid
from datetime import date, timedelta
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.meal_planner import WeekMeal
from app.db.models.meal import Meal
from app.db.models.meal_ingredients import MealIngredient
from app.db.models.settings.meal_settings import MealSettings

class MealAnalysisRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_shopping_list(self, user_id: uuid.UUID, target_date: date):
        settings_query = select(MealSettings).where(MealSettings.user_id == user_id)
        settings_res = await self.session.execute(settings_query)
        settings = settings_res.scalar_one_or_none()
        
        servings = settings.default_servings if settings else 2
        days_range = settings.shopping_list_days_range if settings else 7

        end_date = target_date + timedelta(days=days_range - 1)

        query = (
            select(WeekMeal)
            .options(
                joinedload(WeekMeal.meal)
                .joinedload(Meal.ingredients_list)
                .joinedload(MealIngredient.ingredient)
            )
            .where(
                WeekMeal.user_id == user_id,
                WeekMeal.meal_date >= target_date,
                WeekMeal.meal_date <= end_date,
                WeekMeal.is_out_of_home == False,
                WeekMeal.meal_id != None
            )
        )
        
        result = await self.session.execute(query)
        planned_meals = result.unique().scalars().all()

        aggregated = {}

        for plan in planned_meals:
            if not plan.meal or not plan.meal.ingredients_list:
                continue
            
            for item in plan.meal.ingredients_list:
                ing = item.ingredient
                if ing.id not in aggregated:
                    aggregated[ing.id] = {
                        "ingredient_id": ing.id,
                        "name": ing.name,
                        "amount": 0,
                        "unit": ing.unit,
                        "category": ing.category
                    }
                
                aggregated[ing.id]["amount"] += (item.base_amount * servings)

        items = sorted(aggregated.values(), key=lambda x: (x['category'], x['name']))
        
        return {
            "start_date": target_date,
            "end_date": end_date,
            "items": items
        }