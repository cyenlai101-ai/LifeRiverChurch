from typing import Optional

from sqlalchemy import or_
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.models.event import Event
from app.models.event import EventStatus
from app.schemas.event import EventCreate, EventUpdate


def list_events(
    db: Session,
    site_id: Optional[str] = None,
    status: Optional[EventStatus] = None,
    query: Optional[str] = None,
    upcoming_only: bool = False,
    sort_by: str = "start_at",
    sort_dir: str = "asc",
    limit: int = 50,
    offset: int = 0,
) -> list[Event]:
    search_query = query
    query = db.query(Event)
    if site_id:
        query = query.filter(Event.site_id == site_id)
    if status:
        query = query.filter(Event.status == status)
    if search_query:
        like_value = f"%{search_query}%"
        query = query.filter(or_(Event.title.ilike(like_value), Event.description.ilike(like_value)))
    if upcoming_only:
        query = query.filter(Event.start_at >= func.now())
    sort_map = {
        "start_at": Event.start_at,
        "created_at": Event.created_at,
        "title": Event.title,
    }
    sort_column = sort_map.get(sort_by, Event.start_at)
    if sort_dir == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    return query.offset(offset).limit(limit).all()


def create_event(db: Session, payload: EventCreate, created_by: Optional[str]) -> Event:
    event = Event(**payload.model_dump(), created_by=created_by)
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(db: Session, event_id: str, payload: EventUpdate) -> Optional[Event]:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event_id: str) -> bool:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return False
    db.delete(event)
    db.commit()
    return True
