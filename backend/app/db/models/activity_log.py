import uuid
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from sqlalchemy import String, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base

class UserActivityLog(Base):
    __tablename__ = "user_activity_logs"
    __table_args__ = {"schema": "dmt"}

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("dmt.users.id", ondelete="SET NULL"),
        nullable=True,
    )

    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)  # np. "LOGIN"
    status: Mapped[str] = mapped_column(String(50), nullable=False)   # np. "SUCCESS", "FAILED"
    
    details: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    
class ActivityLogPublic(BaseModel):
    action: str
    status: str
    ip_address: Optional[str]
    location: Optional[str]
    user_agent: Optional[str]
    details: Optional[dict]
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)