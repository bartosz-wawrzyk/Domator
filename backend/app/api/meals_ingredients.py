from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.deps import get_db, get_current_user
from app.db.models.user import User
from app.db.repositories.meal_ingredients import MealIngredientsRepository
from app.db.models.meal_ingredients import (
    IngredientCreate, IngredientRead, 
    MealIngredientCreate, MealIngredientRead, MealIngredientUpdate
)
import uuid
from typing import List

router = APIRouter(prefix="/meals/ingredients", tags=["Meal Ingredients"])

@router.post("/", response_model=IngredientRead)
async def create_dictionary_ingredient(data: IngredientCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = MealIngredientsRepository(db)
    return await repo.create_ingredient(data.model_dump())

@router.get("/", response_model=List[IngredientRead])
async def list_dictionary_ingredients(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    repo = MealIngredientsRepository(db)
    return await repo.get_all_ingredients()

@router.post("/{id_meal}", response_model=MealIngredientRead)
async def add_ingredient_to_meal(
    id_meal: uuid.UUID, 
    data: MealIngredientCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adds an ingredient from the dictionary to a specific dish with a specified base quantity."""
    repo = MealIngredientsRepository(db)
    return await repo.add_ingredient_to_meal(id_meal, data.model_dump())

@router.get("/{id_meal}", response_model=List[MealIngredientRead])
async def get_meal_ingredients(id_meal: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Retrieves the list of ingredients (recipe) for a given dish."""
    repo = MealIngredientsRepository(db)
    return await repo.get_meal_recipe(id_meal)

@router.delete("/recipe/{id_recipe}")
async def remove_ingredient_from_recipe(id_recipe: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Removes a specific ingredient from the recipe (does not remove it from the dictionary)."""
    repo = MealIngredientsRepository(db)
    await repo.remove_ingredient_from_meal(id_recipe)
    return {"status": "removed"}

@router.patch("/recipe/{id_recipe}", response_model=MealIngredientRead)
async def update_recipe_item(
    id_recipe: uuid.UUID, 
    data: MealIngredientUpdate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates ingredient details in the recipe (quantity/note)."""
    repo = MealIngredientsRepository(db)
    return await repo.update_meal_ingredient(id_recipe, data.model_dump(exclude_unset=True))

@router.get("/search", response_model=List[IngredientRead])
async def search_ingredients(
    name: str, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Searches the ingredient dictionary by name (e.g., for autocomplete)."""
    repo = MealIngredientsRepository(db)
    return await repo.search_ingredients(name)