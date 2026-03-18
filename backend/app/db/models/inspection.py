import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Integer, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.db.base import Base

class TechnicalInspection(Base):
    __tablename__ = "technical_inspections"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("dmt.vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    inspection_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expiration_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    current_mileage: Mapped[int] = mapped_column(Integer, nullable=False)
    cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    
    station_name: Mapped[Optional[str]] = mapped_column(String(255))
    station_location: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class InspectionCreate(BaseModel):
    vehicle_id: uuid.UUID
    inspection_date: datetime
    expiration_date: datetime
    current_mileage: int = Field(..., ge=0)
    cost: float = Field(..., ge=0)
    notes: Optional[str] = None

    @model_validator(mode='after')
    def validate_dates(self) -> 'InspectionCreate':
        if self.expiration_date <= self.inspection_date:
            raise ValueError("The expiration date must be later than the test date.")
        return self

class InspectionRead(InspectionCreate):
    id: uuid.UUID
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class InspectionUpdate(BaseModel):
    inspection_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    current_mileage: Optional[int] = Field(None, ge=0)
    cost: Optional[Decimal] = Field(None, ge=0)
    station_name: Optional[str] = None
    station_location: Optional[str] = None
    notes: Optional[str] = None