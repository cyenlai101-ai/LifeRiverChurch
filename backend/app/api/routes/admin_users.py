from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.admin_user import AdminResetPassword, AdminUserOut, AdminUserUpdate
from app.services.admin_users import list_users, reset_password, update_user

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


@router.get("", response_model=list[AdminUserOut])
def get_users(
    q: Optional[str] = None,
    role: Optional[UserRole] = None,
    site_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> list[AdminUserOut]:
    _ = current_user
    return list_users(
        db,
        query=q,
        role=role,
        site_id=site_id,
        is_active=is_active,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )


@router.patch("/{user_id}", response_model=AdminUserOut)
def update_user_handler(
    user_id: str,
    payload: AdminUserUpdate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> AdminUserOut:
    _ = current_user
    user = update_user(db, user_id, payload)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.post("/{user_id}/reset-password", response_model=AdminUserOut)
def reset_password_handler(
    user_id: str,
    payload: AdminResetPassword,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> AdminUserOut:
    _ = current_user
    user = reset_password(db, user_id, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user
