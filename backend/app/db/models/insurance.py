import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, Numeric, Text, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, ConfigDict, Field, computed_field, model_validator
from app.db.base import Base

class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vehicle_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("dmt.vehicles.id", ondelete="CASCADE"), nullable=False, index=True)
    
    policy_number: Mapped[str] = mapped_column(String(100), nullable=False)
    insurer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    policy_type: Mapped[str] = mapped_column(String(50), nullable=False) # OC, OC+AC
    agent_contact: Mapped[Optional[str]] = mapped_column(String(255))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

class InsuranceCreate(BaseModel):
    vehicle_id: uuid.UUID
    policy_number: str
    insurer_name: str
    start_date: datetime
    end_date: datetime
    total_cost: Decimal = Field(..., ge=0)
    policy_type: str
    agent_contact: Optional[str] = None

    @model_validator(mode='after')
    def check_dates(self) -> 'InsuranceCreate':
        if self.end_date <= self.start_date:
            raise ValueError("The end date must be later than the start date.")
        return self

class InsuranceRead(InsuranceCreate):
    id: uuid.UUID
    
    @computed_field
    @property
    def days_to_expiry(self) -> int:
        target_date = self.end_date.date() if isinstance(self.end_date, datetime) else self.end_date
        delta = target_date - date.today()
        return delta.days

    @computed_field
    @property
    def status(self) -> str:
        days = self.days_to_expiry
        if days < 0: return "EXPIRED"
        if days <= 30: return "EXPIRING_SOON"
        return "ACTIVE"

    model_config = ConfigDict(from_attributes=True)

class InsuranceUpdate(BaseModel):
    policy_number: Optional[str] = None
    insurer_name: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_cost: Optional[Decimal] = Field(None, ge=0)
    policy_type: Optional[str] = None
    agent_contact: Optional[str] = None