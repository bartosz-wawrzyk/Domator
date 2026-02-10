import uuid
from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, Date, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict

from app.db.base import Base
from app.db.models.meal import Meal

class WeekPlan(Base):
    """Header of a weekly meal plan."""
    __tablename__ = "week_plans"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    day_entries: Mapped[List["WeekMeal"]] = relationship(
        "WeekMeal", 
        back_populates="week_plan", 
        cascade="all, delete-orphan",
        order_by="WeekMeal.meal_date"
    )


class WeekMeal(Base):
    """Single meal entry in the weekly calendar."""
    __tablename__ = "week_meals"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    week_plan_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("dmt.week_plans.id", ondelete="CASCADE"), nullable=False
    )
    
    meal_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("dmt.meals.id"), nullable=True
    )
    
    meal_date: Mapped[date] = mapped_column(Date, nullable=False)
    
    # batch_id connects days when we eat the same cooked dish (e.g., for 2 days)
    batch_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True, index=True)
    
    is_out_of_home: Mapped[bool] = mapped_column(Boolean, default=False)
    note: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    week_plan: Mapped["WeekPlan"] = relationship("WeekPlan", back_populates="day_entries")
    meal: Mapped[Optional["Meal"]] = relationship()

class WeekMealBase(BaseModel):
    meal_date: date
    meal_id: Optional[uuid.UUID] = None
    is_out_of_home: bool = False
    note: Optional[str] = None

class WeekMealCreate(WeekMealBase):
    is_two_days: bool = False 

class WeekMealRead(WeekMealBase):
    id: uuid.UUID
    batch_id: Optional[uuid.UUID]
    model_config = ConfigDict(from_attributes=True)

class WeekPlanRead(BaseModel):
    id: uuid.UUID
    start_date: date
    day_entries: List[WeekMealRead]
    model_config = ConfigDict(from_attributes=True)