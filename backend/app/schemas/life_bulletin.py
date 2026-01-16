from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, HttpUrl

from app.models.life_bulletin import LifeBulletinStatus


class LifeBulletinBase(BaseModel):
    site_id: UUID
    bulletin_date: date
    content: str
    video_url: Optional[HttpUrl] = None
    status: LifeBulletinStatus = LifeBulletinStatus.draft


class LifeBulletinCreate(LifeBulletinBase):
    pass


class LifeBulletinUpdate(BaseModel):
    bulletin_date: Optional[date] = None
    content: Optional[str] = None
    video_url: Optional[HttpUrl] = None
    status: Optional[LifeBulletinStatus] = None


class LifeBulletinOut(LifeBulletinBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
