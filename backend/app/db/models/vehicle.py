import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Integer, Boolean, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, ConfigDict, Field

from app.db.base import Base

class Vehicle(Base):
    __tablename__ = "vehicles"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    model: Mapped[str] = mapped_column(String(100), nullable=False)
    production_year: Mapped[int] = mapped_column(Integer, nullable=False)

    vin: Mapped[str] = mapped_column(String(17), nullable=False, unique=True, index=True)
    registration_number: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    
    fuel_type: Mapped[str] = mapped_column(String(20), nullable=False)
    current_mileage: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_service_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_service_mileage: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True),nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

class VehicleCreate(BaseModel):
    brand: str
    model: str
    production_year: int
    vin: str = Field(..., min_length=17, max_length=17)
    registration_number: str
    fuel_type: str
    current_mileage: int = 0
    last_service_date: Optional[datetime] = None
    last_service_mileage: Optional[int] = None

class VehicleUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    production_year: Optional[int] = None
    vin: Optional[str] = Field(None, min_length=17, max_length=17)
    registration_number: Optional[str] = None
    fuel_type: Optional[str] = None
    current_mileage: Optional[int] = None
    last_service_date: Optional[datetime] = None
    last_service_mileage: Optional[int] = None
    is_active: Optional[bool] = None
    
    model_config = ConfigDict(from_attributes=True)