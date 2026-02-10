import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, ConfigDict

from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.meal_ingredients import MealIngredient

class ProteinType(Base):
    __tablename__ = "protein_types"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True) 
    category: Mapped[str] = mapped_column(String(100), nullable=False)

    meals: Mapped[List["Meal"]] = relationship("Meal", back_populates="protein_type")


class BaseType(Base):
    __tablename__ = "base_types"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)

    meals: Mapped[List["Meal"]] = relationship("Meal", back_populates="base_type")


class Meal(Base):
    __tablename__ = "meals"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    
    id_protein_type: Mapped[uuid.UUID] = mapped_column(ForeignKey("dmt.protein_types.id"), nullable=False)
    id_base_type: Mapped[uuid.UUID] = mapped_column(ForeignKey("dmt.base_types.id"), nullable=False)
    
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_weekend_dish: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    protein_type: Mapped["ProteinType"] = relationship("ProteinType", back_populates="meals")
    base_type: Mapped["BaseType"] = relationship("BaseType", back_populates="meals")

    ingredients_list: Mapped[List["MealIngredient"]] = relationship(
        "MealIngredient", 
        back_populates="meal", 
        cascade="all, delete-orphan"
    )

class MealCreate(BaseModel):
    id_protein_type: uuid.UUID
    id_base_type: uuid.UUID
    name: str
    description: Optional[str] = None
    is_weekend_dish: bool = False

class MealUpdate(BaseModel):
    id_protein_type: Optional[uuid.UUID] = None
    id_base_type: Optional[uuid.UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    is_weekend_dish: Optional[bool] = None

class MealRead(MealCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
    
class DictBase(BaseModel):
    name: str
    category: str

class DictCreate(DictBase):
    pass

class DictUpdate(DictBase):
    name: Optional[str] = None
    category: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)