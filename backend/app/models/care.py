import enum
import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.base import Base


class CareSubjectType(str, enum.Enum):
    member = "Member"
    seeker = "Seeker"
    family = "Family"
    community = "Community"


class CareSubjectStatus(str, enum.Enum):
    active = "Active"
    paused = "Paused"
    closed = "Closed"


class CareSubject(Base):
    __tablename__ = "care_subjects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_id = Column(UUID(as_uuid=True), ForeignKey("sites.id"))
    name = Column(String, nullable=False)
    subject_type = Column(
        Enum(
            CareSubjectType,
            values_callable=lambda items: [item.value for item in items],
            name="care_subject_type",
        ),
        nullable=False,
        default=CareSubjectType.member,
    )
    status = Column(
        Enum(
            CareSubjectStatus,
            values_callable=lambda items: [item.value for item in items],
            name="care_subject_status",
        ),
        nullable=False,
        default=CareSubjectStatus.active,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class CareLog(Base):
    __tablename__ = "care_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("care_subjects.id"), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    note = Column(Text, nullable=False)
    mood_score = Column(Integer)
    spiritual_score = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
