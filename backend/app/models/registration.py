import enum
import uuid

from sqlalchemy import Boolean, Column, Enum, ForeignKey, Integer, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class RegistrationStatus(str, enum.Enum):
    pending = "Pending"
    confirmed = "Confirmed"
    waitlisted = "Waitlisted"
    cancelled = "Cancelled"


class EventRegistration(Base):
    __tablename__ = "event_registrations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("events.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(
        Enum(
            RegistrationStatus,
            values_callable=lambda items: [item.value for item in items],
            name="registration_status",
        ),
        nullable=False,
        default=RegistrationStatus.pending,
    )
    ticket_count = Column(Integer, nullable=False, default=1)
    is_proxy = Column(Boolean, nullable=False, default=False)
    proxy_entries = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
