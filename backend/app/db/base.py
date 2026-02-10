from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass

from app.db.models.meal import Meal, ProteinType, BaseType
from app.db.models.meal_ingredients import MealIngredient, Ingredient