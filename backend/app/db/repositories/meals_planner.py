import uuid
from datetime import date, timedelta
from typing import List, Optional
from sqlalchemy.orm import joinedload
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.meal import Meal
from app.db.models.meal_planner import WeekPlan, WeekMeal

class MealPlanningRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_week_plan(self, user_id: uuid.UUID, monday_date: date) -> WeekPlan:
            """Downloads the weekly schedule along with its days (joinedload)."""
            query = (
                select(WeekPlan)
                .options(joinedload(WeekPlan.day_entries))
                .where(
                    WeekPlan.user_id == user_id, 
                    WeekPlan.start_date == monday_date
                )
            )
            result = await self.session.execute(query)
            plan = result.unique().scalar_one_or_none()

            if not plan:
                plan = WeekPlan(id=uuid.uuid4(), user_id=user_id, start_date=monday_date)
                self.session.add(plan)
                await self.session.flush()
                await self.session.refresh(plan, ["day_entries"])
                
            return plan

    async def add_meal_to_plan(
        self, 
        user_id: uuid.UUID, 
        plan_id: uuid.UUID, 
        meal_id: Optional[uuid.UUID], 
        target_date: date,
        is_two_days: bool = False,
        is_out_of_home: bool = False
    ):
        """Adds a dish to a specific day with the option to extend it to the next day."""
        
        new_batch_id = uuid.uuid4() if is_two_days else None
        
        days_to_add = [target_date]
        if is_two_days:
            days_to_add.append(target_date + timedelta(days=1))

        for d in days_to_add:
            await self.session.execute(
                delete(WeekMeal).where(WeekMeal.user_id == user_id, WeekMeal.meal_date == d)
            )
            
            new_entry = WeekMeal(
                id=uuid.uuid4(),
                user_id=user_id,
                week_plan_id=plan_id,
                meal_id=meal_id,
                meal_date=d,
                batch_id=new_batch_id,
                is_out_of_home=is_out_of_home if d == target_date else False
            )
            self.session.add(new_entry)

        await self.session.commit()

    async def remove_meal_from_day(self, user_id: uuid.UUID, meal_date: date):
        query = select(WeekMeal).where(
            WeekMeal.user_id == user_id, 
            WeekMeal.meal_date == meal_date
        )
        result = await self.session.execute(query)
        target_meal = result.scalar_one_or_none()

        if target_meal:
            if target_meal.batch_id:
                delete_query = delete(WeekMeal).where(
                    WeekMeal.user_id == user_id,
                    WeekMeal.batch_id == target_meal.batch_id
                )
            else:
                delete_query = delete(WeekMeal).where(
                    WeekMeal.user_id == user_id,
                    WeekMeal.meal_date == meal_date
                )
            
            await self.session.execute(delete_query)
            await self.session.commit()
            
    async def delete_entire_week(self, user_id: uuid.UUID, monday_date: date):
            """Deletes all meals for a given week."""
            plan_query = select(WeekPlan).where(
                WeekPlan.user_id == user_id,
                WeekPlan.start_date == monday_date
            )
            result = await self.session.execute(plan_query)
            plan = result.scalar_one_or_none()

            if plan:
                delete_query = delete(WeekMeal).where(WeekMeal.week_plan_id == plan.id)
                await self.session.execute(delete_query)
                
                await self.session.commit()
                return True
                
            return False
            
    async def get_monthly_plan(self, user_id: uuid.UUID, year: int, month: int):
            """Downloads all meals planned for a specific month."""
            import calendar
            from datetime import date

            last_day = calendar.monthrange(year, month)[1]
            start_date = date(year, month, 1)
            end_date = date(year, month, last_day)

            query = (
                select(WeekMeal)
                .options(
                    joinedload(WeekMeal.meal).joinedload(Meal.protein_type),
                    joinedload(WeekMeal.meal).joinedload(Meal.base_type)
                )
                .where(
                    WeekMeal.user_id == user_id,
                    WeekMeal.meal_date >= start_date,
                    WeekMeal.meal_date <= end_date
                )
                .order_by(WeekMeal.meal_date)
            )

            result = await self.session.execute(query)
            return result.scalars().all()