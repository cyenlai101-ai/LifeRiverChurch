from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.event import EventStatus


class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    poster_url: Optional[str] = None
    start_at: datetime
    end_at: Optional[datetime] = None
    capacity: Optional[int] = None
    waitlist_enabled: bool = False
    status: EventStatus = EventStatus.draft
    site_id: Optional[UUID] = None


class EventCreate(EventBase):
    pass


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    poster_url: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    capacity: Optional[int] = None
    waitlist_enabled: Optional[bool] = None
    status: Optional[EventStatus] = None
    site_id: Optional[UUID] = None


class EventOut(EventBase):
    id: UUID
    created_at: datetime
    created_by: Optional[UUID] = None
