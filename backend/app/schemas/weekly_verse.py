from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class WeeklyVerseBase(BaseModel):
    site_id: UUID
    week_start: date
    text: str
    reference: str
    reading_plan: Optional[str] = None


class WeeklyVerseCreate(WeeklyVerseBase):
    pass


class WeeklyVerseUpdate(BaseModel):
    week_start: Optional[date] = None
    text: Optional[str] = None
    reference: Optional[str] = None
    reading_plan: Optional[str] = None


class WeeklyVerseOut(WeeklyVerseBase):
    id: UUID
    updated_at: datetime
