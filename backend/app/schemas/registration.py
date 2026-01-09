from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel

from app.models.registration import RegistrationStatus


class RegistrationCreate(BaseModel):
    event_id: str
    ticket_count: int = 1
    is_proxy: bool = False


class RegistrationOut(BaseModel):
    id: UUID
    event_id: UUID
    user_id: Optional[UUID] = None
    status: RegistrationStatus
    ticket_count: int
    is_proxy: bool
    created_at: datetime
