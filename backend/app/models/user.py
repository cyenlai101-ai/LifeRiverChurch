import enum
import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, String
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class UserRole(str, enum.Enum):
    admin = "Admin"
    center_staff = "CenterStaff"
    branch_staff = "BranchStaff"
    leader = "Leader"
    member = "Member"


class MemberType(str, enum.Enum):
    member = "Member"
    seeker = "Seeker"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String)
    phone = Column(String)
    role = Column(
        Enum(
            UserRole,
            values_callable=lambda items: [item.value for item in items],
            name="user_role",
        ),
        nullable=False,
        default=UserRole.member,
    )
    member_type = Column(
        Enum(
            MemberType,
            values_callable=lambda items: [item.value for item in items],
            name="member_type",
        ),
        nullable=False,
        default=MemberType.member,
    )
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
