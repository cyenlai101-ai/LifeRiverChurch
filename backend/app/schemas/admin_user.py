from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.user import UserRole


class AdminUserOut(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    site_id: Optional[UUID] = None
    is_active: bool
    created_at: datetime


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    site_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class AdminResetPassword(BaseModel):
    password: str
