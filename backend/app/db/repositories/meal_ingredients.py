import uuid
from typing import List, Optional
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.db.models.meal_ingredients import Ingredient, MealIngredient

class MealIngredientsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_ingredient(self, data: dict) -> Ingredient:
        ingredient = Ingredient(**data)
        self.session.add(ingredient)
        await self.session.commit()
        await self.session.refresh(ingredient)
        return ingredient

    async def get_all_ingredients(self) -> List[Ingredient]:
        result = await self.session.execute(select(Ingredient).order_by(Ingredient.category))
        return list(result.scalars().all())

    async def delete_ingredient(self, ingredient_id: uuid.UUID):
        await self.session.execute(delete(Ingredient).where(Ingredient.id == ingredient_id))
        await self.session.commit()

    async def add_ingredient_to_meal(self, id_meal: uuid.UUID, data: dict) -> MealIngredient:
        recipe_entry = MealIngredient(id_meal=id_meal, **data)
        self.session.add(recipe_entry)
        await self.session.commit()
        await self.session.refresh(recipe_entry)
        return recipe_entry

    async def get_meal_recipe(self, id_meal: uuid.UUID) -> List[MealIngredient]:
        """It retrieves the ingredients of the dish along with their data from the dictionary."""
        query = (
            select(MealIngredient)
            .options(joinedload(MealIngredient.ingredient))
            .where(MealIngredient.id_meal == id_meal)
        )
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def remove_ingredient_from_meal(self, recipe_id: uuid.UUID):
        await self.session.execute(delete(MealIngredient).where(MealIngredient.id == recipe_id))
        await self.session.commit()

    async def update_meal_ingredient(self, recipe_id: uuid.UUID, data: dict) -> MealIngredient:
        """Updates the quantity or note for a specific item in the recipe."""
        update_data = {k: v for k, v in data.items() if v is not None}
        
        query = (
            update(MealIngredient)
            .where(MealIngredient.id == recipe_id)
            .values(**update_data)
            .returning(MealIngredient)
        )
        
        await self.session.execute(query)
        await self.session.commit()
        
        query_refresh = (
            select(MealIngredient)
            .options(joinedload(MealIngredient.ingredient))
            .where(MealIngredient.id == recipe_id)
        )
        result = await self.session.execute(query_refresh)
        return result.scalar_one()