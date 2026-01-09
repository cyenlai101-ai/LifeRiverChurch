import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class EventStatus(str, enum.Enum):
    draft = "Draft"
    published = "Published"
    closed = "Closed"


class Event(Base):
    __tablename__ = "events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    poster_url = Column(String)
    start_at = Column(DateTime(timezone=True), nullable=False)
    end_at = Column(DateTime(timezone=True))
    capacity = Column(Integer)
    waitlist_enabled = Column(Boolean, nullable=False, default=False)
    status = Column(
        Enum(
            EventStatus,
            values_callable=lambda items: [item.value for item in items],
            name="event_status",
        ),
        nullable=False,
        default=EventStatus.draft,
    )
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
