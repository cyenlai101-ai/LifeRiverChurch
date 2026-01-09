from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.prayer import PrayerCreate, PrayerOut, PrayerStatusUpdate
from app.models.prayer import PrayerPrivacy
from app.services.prayers import create_prayer, list_prayers, update_prayer_status

router = APIRouter(prefix="/prayers", tags=["prayers"])


@router.get("", response_model=list[PrayerOut])
def get_prayers(
    site_id: Optional[str] = None,
    privacy_level: Optional[PrayerPrivacy] = None,
    q: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[PrayerOut]:
    return list_prayers(
        db,
        site_id=site_id,
        approved_only=True,
        query=q,
        privacy_level=privacy_level,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )


@router.get("/admin", response_model=list[PrayerOut])
def get_prayers_admin(
    site_id: Optional[str] = None,
    privacy_level: Optional[PrayerPrivacy] = None,
    q: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff, UserRole.leader)
    ),
    db: Session = Depends(get_db),
) -> list[PrayerOut]:
    _ = current_user
    return list_prayers(
        db,
        site_id=site_id,
        approved_only=False,
        query=q,
        privacy_level=privacy_level,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=PrayerOut)
def create_prayer_handler(
    payload: PrayerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PrayerOut:
    return create_prayer(db, payload, user_id=str(current_user.id))


@router.patch("/{prayer_id}", response_model=PrayerOut)
def update_prayer_status_handler(
    prayer_id: str,
    payload: PrayerStatusUpdate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff, UserRole.leader)
    ),
    db: Session = Depends(get_db),
) -> PrayerOut:
    _ = current_user
    prayer = update_prayer_status(db, prayer_id, payload.status)
    if not prayer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prayer not found")
    return prayer
