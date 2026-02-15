import uuid
import enum
from datetime import date
from decimal import Decimal
from sqlalchemy import Numeric, Date, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class PaymentType(str, enum.Enum):
    installment = "installment"
    prepayment = "prepayment"

class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        primary_key=True, 
        default=uuid.uuid4
    )
    loan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), 
        ForeignKey("dmt.loans.id"), 
        nullable=False, 
        index=True
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), 
        nullable=False
    )
    type: Mapped[PaymentType] = mapped_column(
        Enum(PaymentType), 
        nullable=False
    )
    paid_at: Mapped[date] = mapped_column(
        Date, 
        nullable=False,
        default=date.today
    )