from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.registration import EventRegistration
from app.models.event import Event
from app.models.user import User
from typing import Optional, List, Tuple

from app.schemas.registration import RegistrationCreate, RegistrationUpdate


def list_registrations(db: Session, user_id: str) -> list[EventRegistration]:
    return (
        db.query(EventRegistration)
        .filter(EventRegistration.user_id == user_id)
        .order_by(EventRegistration.created_at.desc())
        .all()
    )

def list_registrations_for_event(
    db: Session,
    event_id: str,
    query: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Tuple[EventRegistration, Optional[User], Event]]:
    base = (
        db.query(EventRegistration, User, Event)
        .join(Event, Event.id == EventRegistration.event_id)
        .outerjoin(User, User.id == EventRegistration.user_id)
        .filter(EventRegistration.event_id == event_id)
    )
    if status:
        base = base.filter(EventRegistration.status == status)
    if query:
        like = f"%{query}%"
        base = base.filter(or_(User.full_name.ilike(like), User.email.ilike(like)))
    return (
        base.order_by(EventRegistration.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

def get_registration_by_id(
    db: Session, registration_id: str
) -> Optional[EventRegistration]:
    return (
        db.query(EventRegistration)
        .filter(EventRegistration.id == registration_id)
        .first()
    )


def get_registration_by_user_event(
    db: Session, user_id: str, event_id: str
) -> Optional[EventRegistration]:
    return (
        db.query(EventRegistration)
        .filter(EventRegistration.user_id == user_id)
        .filter(EventRegistration.event_id == event_id)
        .first()
    )


def create_registration(
    db: Session, payload: RegistrationCreate, user_id: str
) -> EventRegistration:
    existing = get_registration_by_user_event(db, user_id=user_id, event_id=payload.event_id)
    if existing:
        raise ValueError("Registration already exists")
    registration = EventRegistration(
        event_id=payload.event_id,
        user_id=user_id,
        ticket_count=payload.ticket_count,
        is_proxy=payload.is_proxy,
        proxy_entries=[entry.dict() for entry in payload.proxy_entries],
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration


def update_registration(
    db: Session,
    registration: EventRegistration,
    payload: RegistrationUpdate,
) -> EventRegistration:
    if payload.ticket_count is not None:
        registration.ticket_count = payload.ticket_count
    if payload.is_proxy is not None:
        registration.is_proxy = payload.is_proxy
    if payload.proxy_entries is not None:
        registration.proxy_entries = [entry.dict() for entry in payload.proxy_entries]
    if payload.status is not None:
        registration.status = payload.status
    db.commit()
    db.refresh(registration)
    return registration


def delete_registration(db: Session, registration: EventRegistration) -> None:
    db.delete(registration)
    db.commit()
