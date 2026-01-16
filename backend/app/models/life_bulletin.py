import enum
import uuid

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class LifeBulletinStatus(str, enum.Enum):
    draft = "Draft"
    published = "Published"


class LifeBulletin(Base):
    __tablename__ = "life_bulletins"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"), nullable=False)
    bulletin_date = Column(Date, nullable=False)
    content = Column(Text, nullable=False)
    video_url = Column(String)
    status = Column(
        Enum(
            LifeBulletinStatus,
            values_callable=lambda items: [item.value for item in items],
            name="life_bulletin_status",
        ),
        nullable=False,
        default=LifeBulletinStatus.draft,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
