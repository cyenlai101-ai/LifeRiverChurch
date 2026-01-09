from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.admin_user import AdminUserUpdate


def list_users(
    db: Session,
    query: Optional[str] = None,
    role: Optional[UserRole] = None,
    site_id: Optional[str] = None,
    is_active: Optional[bool] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
) -> list[User]:
    query_set = db.query(User)
    if query:
        like_value = f"%{query}%"
        query_set = query_set.filter(
            or_(User.email.ilike(like_value), User.full_name.ilike(like_value))
        )
    if role:
        query_set = query_set.filter(User.role == role)
    if site_id:
        query_set = query_set.filter(User.site_id == site_id)
    if is_active is not None:
        query_set = query_set.filter(User.is_active == is_active)
    sort_map = {
        "created_at": User.created_at,
        "email": User.email,
        "full_name": User.full_name,
    }
    sort_column = sort_map.get(sort_by, User.created_at)
    if sort_dir == "asc":
        query_set = query_set.order_by(sort_column.asc())
    else:
        query_set = query_set.order_by(sort_column.desc())
    return query_set.offset(offset).limit(limit).all()


def update_user(db: Session, user_id: str, payload: AdminUserUpdate) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def reset_password(db: Session, user_id: str, password: str) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.password_hash = hash_password(password)
    db.commit()
    db.refresh(user)
    return user
