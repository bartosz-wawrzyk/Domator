import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from decimal import Decimal

from sqlalchemy import String, Integer, Boolean, DateTime, Numeric, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pydantic import BaseModel, Field, ConfigDict
from app.db.base import Base

if TYPE_CHECKING:
    from app.db.models.service_event import ServiceEvent

class ServiceItem(Base):
    __tablename__ = "service_items"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    service_event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("dmt.service_events.id"), 
        nullable=False, 
        index=True
    )
    
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    is_recurring: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    interval_km: Mapped[int | None] = mapped_column(Integer, nullable=True)
    interval_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        nullable=False, 
        server_default=func.now()
    )

    event: Mapped["ServiceEvent"] = relationship("ServiceEvent", back_populates="items")

class ServiceItemCreate(BaseModel):
    service_event_id: uuid.UUID
    type: str
    description: str
    cost: Decimal = Field(..., ge=0, decimal_places=2)
    is_recurring: bool = False
    interval_km: Optional[int] = Field(None, ge=0)
    interval_months: Optional[int] = Field(None, ge=0)
    
    model_config = ConfigDict(from_attributes=True)

class ServiceItemUpdate(BaseModel):
    type: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    is_recurring: Optional[bool] = None
    interval_km: Optional[int] = None
    interval_months: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)