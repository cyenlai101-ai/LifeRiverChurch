from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, HttpUrl


class SundayMessageBase(BaseModel):
    site_id: UUID
    message_date: date
    title: str
    speaker: Optional[str] = None
    youtube_url: HttpUrl
    description: Optional[str] = None


class SundayMessageCreate(SundayMessageBase):
    pass


class SundayMessageUpdate(BaseModel):
    message_date: Optional[date] = None
    title: Optional[str] = None
    speaker: Optional[str] = None
    youtube_url: Optional[HttpUrl] = None
    description: Optional[str] = None


class SundayMessageOut(SundayMessageBase):
    id: UUID
    created_at: datetime
