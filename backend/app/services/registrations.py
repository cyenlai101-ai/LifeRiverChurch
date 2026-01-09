from sqlalchemy.orm import Session

from app.models.registration import EventRegistration
from app.schemas.registration import RegistrationCreate


def list_registrations(db: Session, user_id: str) -> list[EventRegistration]:
    return (
        db.query(EventRegistration)
        .filter(EventRegistration.user_id == user_id)
        .order_by(EventRegistration.created_at.desc())
        .all()
    )


def create_registration(
    db: Session, payload: RegistrationCreate, user_id: str
) -> EventRegistration:
    registration = EventRegistration(
        event_id=payload.event_id,
        user_id=user_id,
        ticket_count=payload.ticket_count,
        is_proxy=payload.is_proxy,
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration
