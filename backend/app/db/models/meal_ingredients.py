import uuid
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional
from sqlalchemy import String, ForeignKey, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.meal import Meal

class Ingredient(Base):
    """Dictionary of general ingredients (e.g., onion, rice, chicken)."""
    __tablename__ = "ingredients"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False, unique=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)  # Vegetables, Fruit, Meat
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="g")  # g, ml, pcs, package

    meals_assigned: Mapped[List["MealIngredient"]] = relationship("MealIngredient", back_populates="ingredient")


class MealIngredient(Base):
    __tablename__ = "meal_ingredients"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    id_meal: Mapped[uuid.UUID] = mapped_column(ForeignKey("dmt.meals.id", ondelete="CASCADE"), nullable=False)
    id_ingredient: Mapped[uuid.UUID] = mapped_column(ForeignKey("dmt.ingredients.id", ondelete="RESTRICT"), nullable=False)
    
    base_amount: Mapped[float] = mapped_column(Float, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    meal: Mapped["Meal"] = relationship("Meal", back_populates="ingredients_list")
    ingredient: Mapped["Ingredient"] = relationship("Ingredient", back_populates="meals_assigned")


class IngredientBase(BaseModel):
    name: str
    category: str
    unit: str

class IngredientCreate(IngredientBase):
    pass

class IngredientRead(IngredientBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class MealIngredientBase(BaseModel):
    id_ingredient: uuid.UUID
    base_amount: float
    note: Optional[str] = None

class MealIngredientCreate(MealIngredientBase):
    pass

class MealIngredientRead(MealIngredientBase):
    id: uuid.UUID
    ingredient: IngredientRead
    model_config = ConfigDict(from_attributes=True)

class MealIngredientUpdate(BaseModel):
    id_ingredient: Optional[uuid.UUID] = None
    base_amount: Optional[float] = None
    note: Optional[str] = None

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None