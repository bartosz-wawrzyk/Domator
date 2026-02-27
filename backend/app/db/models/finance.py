import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from sqlalchemy import String, DateTime, func, ForeignKey, Numeric, UniqueConstraint, case
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class AccountBase(BaseModel):
    name: str
    bank_type: str  # "SANTANDER" | "MBANK"

class AccountCreate(AccountBase):
    pass

class AccountRead(AccountBase):
    id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class ImportRuleCreate(BaseModel):
    account_id: uuid.UUID
    category_id: uuid.UUID
    keyword: str

class ImportRuleRead(BaseModel):
    id: uuid.UUID
    account_id: uuid.UUID
    category_id: uuid.UUID
    keyword: str
    model_config = ConfigDict(from_attributes=True)

class TransactionRead(BaseModel):
    id: uuid.UUID
    date: datetime
    amount: Decimal
    title: str
    category_id: Optional[uuid.UUID]
    category: Optional[CategoryRead] = None 
    model_config = ConfigDict(from_attributes=True)

class TransactionCategoryUpdate(BaseModel):
    category_id: uuid.UUID

class Account(Base):
    __tablename__ = "accounts"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("dmt.users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    bank_type: Mapped[str] = mapped_column(String(50), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    import_rules = relationship("ImportRule", back_populates="account", cascade="all, delete-orphan")

class Category(Base):
    __tablename__ = "categories"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("dmt.users.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

class ImportRule(Base):
    __tablename__ = "import_rules"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("dmt.accounts.id"), nullable=False)
    category_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("dmt.categories.id"), nullable=False)
    keyword: Mapped[str] = mapped_column(String(255), nullable=False)

    account = relationship("Account", back_populates="import_rules")
    category = relationship("Category")

class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        UniqueConstraint("account_id", "raw_hash", name="uq_transaction_account_hash"),
        {"schema": "dmt"},
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("dmt.accounts.id"), nullable=False)
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("dmt.categories.id"), nullable=True)
    
    date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    raw_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    category: Mapped[Optional["Category"]] = relationship("Category")