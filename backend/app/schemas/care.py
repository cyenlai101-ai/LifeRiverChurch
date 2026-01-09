from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.care import CareSubjectStatus, CareSubjectType


class CareSubjectCreate(BaseModel):
    name: str
    subject_type: CareSubjectType = CareSubjectType.member
    status: CareSubjectStatus = CareSubjectStatus.active
    site_id: Optional[str] = None


class CareSubjectOut(BaseModel):
    id: UUID
    name: str
    subject_type: CareSubjectType
    status: CareSubjectStatus
    site_id: Optional[UUID] = None
    created_at: datetime


class CareLogCreate(BaseModel):
    subject_id: str
    note: str
    mood_score: Optional[int] = None
    spiritual_score: Optional[int] = None


class CareLogOut(BaseModel):
    id: UUID
    subject_id: UUID
    created_by: Optional[UUID] = None
    note: str
    mood_score: Optional[int] = None
    spiritual_score: Optional[int] = None
    created_at: datetime
