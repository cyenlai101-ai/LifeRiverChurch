from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.life_bulletin import LifeBulletin, LifeBulletinStatus
from app.schemas.life_bulletin import LifeBulletinCreate, LifeBulletinUpdate


def get_life_bulletin_by_id(db: Session, bulletin_id: str) -> Optional[LifeBulletin]:
    return db.query(LifeBulletin).filter(LifeBulletin.id == bulletin_id).first()


def list_life_bulletins(
    db: Session,
    site_id: Optional[str] = None,
    query: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "bulletin_date",
    sort_dir: str = "desc",
    limit: int = 20,
    offset: int = 0,
) -> list[LifeBulletin]:
    list_query = db.query(LifeBulletin)
    if site_id:
        list_query = list_query.filter(LifeBulletin.site_id == site_id)
    if status:
        list_query = list_query.filter(LifeBulletin.status == status)
    if query:
        like_value = f"%{query}%"
        list_query = list_query.filter(
            or_(
                LifeBulletin.content.ilike(like_value),
                LifeBulletin.video_url.ilike(like_value),
            )
        )
    sort_map = {
        "bulletin_date": LifeBulletin.bulletin_date,
        "created_at": LifeBulletin.created_at,
    }
    sort_column = sort_map.get(sort_by, LifeBulletin.bulletin_date)
    if sort_dir == "asc":
        list_query = list_query.order_by(sort_column.asc())
    else:
        list_query = list_query.order_by(sort_column.desc())
    return list_query.offset(offset).limit(limit).all()


def list_latest_life_bulletins(
    db: Session,
    site_id: Optional[str],
    limit: int = 5,
) -> list[LifeBulletin]:
    list_query = db.query(LifeBulletin)
    if site_id:
        list_query = list_query.filter(LifeBulletin.site_id == site_id)
    list_query = list_query.filter(LifeBulletin.status == LifeBulletinStatus.published)
    return (
        list_query.order_by(LifeBulletin.bulletin_date.desc(), LifeBulletin.created_at.desc())
        .limit(limit)
        .all()
    )


def create_life_bulletin(db: Session, payload: LifeBulletinCreate) -> LifeBulletin:
    record = LifeBulletin(
        site_id=payload.site_id,
        bulletin_date=payload.bulletin_date,
        content=payload.content,
        video_url=str(payload.video_url) if payload.video_url else None,
        status=payload.status,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_life_bulletin(
    db: Session,
    bulletin_id: str,
    payload: LifeBulletinUpdate,
) -> Optional[LifeBulletin]:
    record = get_life_bulletin_by_id(db, bulletin_id)
    if not record:
        return None
    if payload.bulletin_date is not None:
        record.bulletin_date = payload.bulletin_date
    if payload.content is not None:
        record.content = payload.content
    if payload.video_url is not None:
        record.video_url = str(payload.video_url)
    if payload.status is not None:
        record.status = payload.status
    db.commit()
    db.refresh(record)
    return record


def delete_life_bulletin(db: Session, bulletin_id: str) -> bool:
    record = get_life_bulletin_by_id(db, bulletin_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
