from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr

from app.models.user import MemberType, UserRole


class UserCreate(BaseModel):
  email: EmailStr
  password: str
  full_name: Optional[str] = None


class UserOut(BaseModel):
  id: UUID
  email: EmailStr
  full_name: Optional[str] = None
  phone: Optional[str] = None
  role: UserRole
  member_type: MemberType
  site_id: Optional[UUID] = None


class UserUpdate(BaseModel):
  email: Optional[EmailStr] = None
  full_name: Optional[str] = None
  phone: Optional[str] = None
  member_type: Optional[MemberType] = None


class PasswordChange(BaseModel):
  current_password: str
  new_password: str
