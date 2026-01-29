import uuid
from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from decimal import Decimal

from sqlalchemy import DateTime, Integer, Text, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field, ConfigDict
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.service_item import ServiceItem

class ServiceEvent(Base):
    __tablename__ = "service_events"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    service_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    mileage_at_service: Mapped[int] = mapped_column(Integer, nullable=False)
    total_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True, default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False, 
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False, 
        server_default=func.now(), 
        onupdate=func.now()
    )

    items: Mapped[List["ServiceItem"]] = relationship(
        "ServiceItem", 
        back_populates="event", 
        cascade="all, delete-orphan",
        lazy="raise"
    )

class ServiceEventCreate(BaseModel):
    vehicle_id: uuid.UUID
    service_date: datetime
    mileage_at_service: int = Field(..., ge=0)
    total_cost: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

class ServiceEventUpdate(BaseModel):
    service_date: Optional[datetime] = None
    mileage_at_service: Optional[int] = Field(None, ge=0)
    total_cost: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    notes: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)