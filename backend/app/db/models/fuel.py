import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, ConfigDict, Field, model_validator, computed_field
from app.db.base import Base

class FuelLog(Base):
    __tablename__ = "fuel_logs"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("dmt.vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    mileage: Mapped[int] = mapped_column(Integer, nullable=False)
    fuel_type: Mapped[str] = mapped_column(String(20), nullable=False)
    liters: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    price_per_liter: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    is_full: Mapped[bool] = mapped_column(Boolean, default=True)

class FuelLogCreate(BaseModel):
    vehicle_id: uuid.UUID
    date: datetime
    mileage: int = Field(..., ge=0)
    fuel_type: str
    liters: Decimal = Field(..., gt=0)
    price_per_liter: Decimal = Field(..., gt=0)
    total_price: Optional[Decimal] = Field(None, ge=0) 
    is_full: bool = True

    @model_validator(mode='after')
    def calculate_total_price(self) -> 'FuelLogCreate':
        if self.total_price is None or self.total_price == 0:
            self.total_price = self.liters * self.price_per_liter
        return self
        
    @model_validator(mode='after')
    def calculate_and_validate(self) -> 'FuelLogCreate':
        if not self.total_price or self.total_price == 0:
            self.total_price = self.liters * self.price_per_liter
        return self

class FuelLogRead(FuelLogCreate):
    id: uuid.UUID
    total_price: Decimal 
    model_config = ConfigDict(from_attributes=True)

class FuelLogUpdate(BaseModel):
    date: Optional[datetime] = None
    mileage: Optional[int] = Field(None, ge=0)
    fuel_type: Optional[str] = None
    liters: Optional[Decimal] = Field(None, gt=0)
    price_per_liter: Optional[Decimal] = Field(None, gt=0)
    total_price: Optional[Decimal] = Field(None, gt=0)
    is_full: Optional[bool] = None

    @model_validator(mode='after')
    def recalculate_on_update(self) -> 'FuelLogUpdate':
        return self