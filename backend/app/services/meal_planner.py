import uuid
import random
from datetime import date, timedelta
from typing import List, Set, Dict, Any
from sqlalchemy import select, delete
from sqlalchemy.orm import joinedload
from app.db.models.meal_planner import WeekMeal, WeekPlan
from app.db.models.meal import Meal

class MealPlannerService:
    def __init__(self, session):
        self.session = session

    async def generate_weekly_proposal(self, user_id: uuid.UUID, start_date: date) -> List[Dict[str, Any]]:
        four_weeks_ago = start_date - timedelta(weeks=4)
        history_query = select(Meal.id).join(WeekMeal).where(
            WeekMeal.user_id == user_id,
            WeekMeal.meal_date >= four_weeks_ago
        )
        history_result = await self.session.execute(history_query)
        forbidden_ids = set(history_result.scalars().all())

        meals_result = await self.session.execute(
            select(Meal).where(Meal.user_id == user_id).options(
                joinedload(Meal.protein_type), 
                joinedload(Meal.base_type)
            )
        )
        all_meals = meals_result.scalars().all()
        if not all_meals:
            return []

        proposal = []
        used_in_this_proposal = set()
        last_protein_id = None
        last_base_id = None
        
        current_date = start_date
        end_date = start_date + timedelta(days=6)

        while current_date <= end_date:
            is_strictly_weekend = current_date.weekday() == 5 
            
            possible_meals = [
                m for m in all_meals
                if m.id not in forbidden_ids
                and m.id not in used_in_this_proposal
                and m.id_protein_type != last_protein_id
                and m.id_base_type != last_base_id
                and m.is_weekend_dish == is_strictly_weekend
            ]

            if not possible_meals:
                possible_meals = [m for m in all_meals if m.is_weekend_dish == is_strictly_weekend]

            if possible_meals:
                chosen = random.choice(possible_meals)
                
                can_be_two_days = (current_date + timedelta(days=1)) <= end_date
                
                if is_strictly_weekend:
                    is_two_days = False 
                elif can_be_two_days:
                    is_two_days = random.random() < 0.6
                else:
                    is_two_days = False

                proposal.append({
                    "meal_id": chosen.id,
                    "meal_name": chosen.name,
                    "meal_date": current_date,
                    "is_two_days": is_two_days,
                    "is_out_of_home": False
                })

                used_in_this_proposal.add(chosen.id)
                last_protein_id = chosen.id_protein_type
                last_base_id = chosen.id_base_type
                
                current_date += timedelta(days=2 if is_two_days else 1)
            else:
                current_date += timedelta(days=1)

        return proposal

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