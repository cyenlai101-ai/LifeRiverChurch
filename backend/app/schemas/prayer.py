from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.prayer import PrayerPrivacy, PrayerStatus


class PrayerCreate(BaseModel):
    content: str
    privacy_level: PrayerPrivacy = PrayerPrivacy.group
    site_id: Optional[str] = None


class PrayerOut(BaseModel):
    id: UUID
    user_id: Optional[UUID] = None
    site_id: Optional[UUID] = None
    content: str
    privacy_level: PrayerPrivacy
    status: PrayerStatus
    amen_count: int
    created_at: datetime


class PrayerStatusUpdate(BaseModel):
    status: PrayerStatus
