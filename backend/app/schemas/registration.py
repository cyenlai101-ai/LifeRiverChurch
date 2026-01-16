from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.registration import RegistrationStatus


class ProxyEntry(BaseModel):
    name: str
    phone: Optional[str] = None
    relation: Optional[str] = None
    note: Optional[str] = None


class RegistrationCreate(BaseModel):
    event_id: str
    ticket_count: int = 1
    is_proxy: bool = False
    proxy_entries: list[ProxyEntry] = Field(default_factory=list)


class RegistrationUpdate(BaseModel):
    ticket_count: Optional[int] = None
    is_proxy: Optional[bool] = None
    proxy_entries: Optional[list[ProxyEntry]] = None
    status: Optional[RegistrationStatus] = None


class RegistrationOut(BaseModel):
    id: UUID
    event_id: UUID
    user_id: Optional[UUID] = None
    status: RegistrationStatus
    ticket_count: int
    is_proxy: bool
    proxy_entries: list[ProxyEntry] = Field(default_factory=list)
    created_at: datetime
    updated_at: Optional[datetime] = None


class RegistrationAdminOut(BaseModel):
    id: UUID
    event_id: UUID
    event_title: str
    event_site_id: UUID
    event_start_at: datetime
    user_id: Optional[UUID] = None
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None
    user_phone: Optional[str] = None
    user_member_type: Optional[str] = None
    user_role: Optional[str] = None
    status: RegistrationStatus
    ticket_count: int
    is_proxy: bool
    proxy_entries: list[ProxyEntry] = Field(default_factory=list)
    created_at: datetime
    updated_at: Optional[datetime] = None
