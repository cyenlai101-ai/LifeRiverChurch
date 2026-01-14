from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.sunday_message import SundayMessage
from app.schemas.sunday_message import SundayMessageCreate, SundayMessageUpdate


def get_sunday_message_by_id(db: Session, message_id: str) -> Optional[SundayMessage]:
    return db.query(SundayMessage).filter(SundayMessage.id == message_id).first()


def list_sunday_messages(
    db: Session,
    site_id: Optional[str] = None,
    query: Optional[str] = None,
    sort_by: str = "message_date",
    sort_dir: str = "desc",
    limit: int = 20,
    offset: int = 0,
) -> list[SundayMessage]:
    list_query = db.query(SundayMessage)
    if site_id:
        list_query = list_query.filter(SundayMessage.site_id == site_id)
    if query:
        like_value = f"%{query}%"
        list_query = list_query.filter(
            or_(
                SundayMessage.title.ilike(like_value),
                SundayMessage.speaker.ilike(like_value),
                SundayMessage.description.ilike(like_value),
            )
        )
    sort_map = {
        "message_date": SundayMessage.message_date,
        "created_at": SundayMessage.created_at,
        "title": SundayMessage.title,
    }
    sort_column = sort_map.get(sort_by, SundayMessage.message_date)
    if sort_dir == "asc":
        list_query = list_query.order_by(sort_column.asc())
    else:
        list_query = list_query.order_by(sort_column.desc())
    return list_query.offset(offset).limit(limit).all()


def list_latest_sunday_messages(
    db: Session,
    site_id: Optional[str],
    limit: int = 5,
) -> list[SundayMessage]:
    list_query = db.query(SundayMessage)
    if site_id:
        list_query = list_query.filter(SundayMessage.site_id == site_id)
    return (
        list_query.order_by(SundayMessage.message_date.desc(), SundayMessage.created_at.desc())
        .limit(limit)
        .all()
    )


def create_sunday_message(db: Session, payload: SundayMessageCreate) -> SundayMessage:
    record = SundayMessage(
        site_id=payload.site_id,
        message_date=payload.message_date,
        title=payload.title,
        speaker=payload.speaker,
        youtube_url=str(payload.youtube_url),
        description=payload.description,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_sunday_message(
    db: Session,
    message_id: str,
    payload: SundayMessageUpdate,
) -> Optional[SundayMessage]:
    record = get_sunday_message_by_id(db, message_id)
    if not record:
        return None
    if payload.message_date is not None:
        record.message_date = payload.message_date
    if payload.title is not None:
        record.title = payload.title
    if payload.speaker is not None:
        record.speaker = payload.speaker
    if payload.youtube_url is not None:
        record.youtube_url = str(payload.youtube_url)
    if payload.description is not None:
        record.description = payload.description
    db.commit()
    db.refresh(record)
    return record


def delete_sunday_message(db: Session, message_id: str) -> bool:
    record = get_sunday_message_by_id(db, message_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
