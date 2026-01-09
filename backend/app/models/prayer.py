import enum
import uuid

from sqlalchemy import Column, Enum, ForeignKey, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class PrayerPrivacy(str, enum.Enum):
    private = "Private"
    group = "Group"
    public = "Public"


class PrayerStatus(str, enum.Enum):
    pending = "Pending"
    approved = "Approved"
    archived = "Archived"


class PrayerRequest(Base):
    __tablename__ = "prayer_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"))
    content = Column(Text, nullable=False)
    privacy_level = Column(
        Enum(
            PrayerPrivacy,
            values_callable=lambda items: [item.value for item in items],
            name="prayer_privacy",
        ),
        nullable=False,
        default=PrayerPrivacy.group,
    )
    status = Column(
        Enum(
            PrayerStatus,
            values_callable=lambda items: [item.value for item in items],
            name="prayer_status",
        ),
        nullable=False,
        default=PrayerStatus.pending,
    )
    amen_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
