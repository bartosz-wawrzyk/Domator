import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, func, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class MealSettings(Base):
    __tablename__ = "meal_settings"
    __table_args__ = {"schema": "dmt"}

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("dmt.users.id", ondelete="CASCADE"), 
        primary_key=True
    )
    
    default_servings: Mapped[int] = mapped_column(Integer, default=2)
    scale_by_two_days: Mapped[bool] = mapped_column(Boolean, default=True)
    shopping_day_of_week: Mapped[int] = mapped_column(Integer, default=5)
    shopping_list_days_range: Mapped[int] = mapped_column(Integer, default=7)
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now()
    )