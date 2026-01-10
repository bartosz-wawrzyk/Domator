import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from pydantic import BaseModel, Field
from app.db.base import Base

class Loan(Base):
    __tablename__ = "loans"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)  # total loan
    installments_count: Mapped[int] = mapped_column(Integer, nullable=False)  # total installments
    due_day: Mapped[int] = mapped_column(Integer, nullable=False)  # day of month
    installment_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)  # per installment
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default="now()")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default="now()", onupdate="now()")

class LoanCreate(BaseModel):
    name: str = Field(..., max_length=255)
    total_amount: float = Field(..., gt=0)
    installments_count: int = Field(..., gt=0)
    due_day: int = Field(..., ge=1, le=31)
    installment_amount: float = Field(..., gt=0)