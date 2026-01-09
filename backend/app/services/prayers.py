from typing import Optional

from sqlalchemy.orm import Session

from app.models.prayer import PrayerPrivacy, PrayerRequest, PrayerStatus
from app.schemas.prayer import PrayerCreate


def list_prayers(
    db: Session,
    site_id: Optional[str] = None,
    approved_only: bool = True,
    query: Optional[str] = None,
    privacy_level: Optional[PrayerPrivacy] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
) -> list[PrayerRequest]:
    query_set = db.query(PrayerRequest)
    if site_id:
        query_set = query_set.filter(PrayerRequest.site_id == site_id)
    if approved_only:
        query_set = query_set.filter(PrayerRequest.status == PrayerStatus.approved)
    if privacy_level:
        query_set = query_set.filter(PrayerRequest.privacy_level == privacy_level)
    if query:
        like_value = f"%{query}%"
        query_set = query_set.filter(PrayerRequest.content.ilike(like_value))
    sort_map = {
        "created_at": PrayerRequest.created_at,
        "amen_count": PrayerRequest.amen_count,
    }
    sort_column = sort_map.get(sort_by, PrayerRequest.created_at)
    if sort_dir == "asc":
        query_set = query_set.order_by(sort_column.asc())
    else:
        query_set = query_set.order_by(sort_column.desc())
    return query_set.offset(offset).limit(limit).all()


def update_prayer_status(
    db: Session, prayer_id: str, status: PrayerStatus
) -> Optional[PrayerRequest]:
    prayer = db.query(PrayerRequest).filter(PrayerRequest.id == prayer_id).first()
    if not prayer:
        return None
    prayer.status = status
    db.commit()
    db.refresh(prayer)
    return prayer


def create_prayer(db: Session, payload: PrayerCreate, user_id: Optional[str]) -> PrayerRequest:
    prayer = PrayerRequest(
        content=payload.content,
        privacy_level=payload.privacy_level,
        site_id=payload.site_id,
        user_id=user_id,
    )
    db.add(prayer)
    db.commit()
    db.refresh(prayer)
    return prayer
