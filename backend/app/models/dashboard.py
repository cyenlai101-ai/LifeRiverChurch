from sqlalchemy import Column, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.sql import func
from sqlalchemy.types import DateTime

from app.db.base import Base


class DashboardSummary(Base):
    __tablename__ = "dashboard_summaries"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    data = Column(JSONB, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
