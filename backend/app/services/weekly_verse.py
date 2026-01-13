from datetime import date
from typing import Optional

from sqlalchemy.orm import Session

from app.models.weekly_verse import WeeklyVerse
from app.schemas.weekly_verse import WeeklyVerseCreate, WeeklyVerseUpdate


def get_weekly_verse_by_id(db: Session, verse_id: str) -> Optional[WeeklyVerse]:
    return db.query(WeeklyVerse).filter(WeeklyVerse.id == verse_id).first()


def get_weekly_verse_by_site_week(
    db: Session,
    site_id: str,
    week_start: date,
) -> Optional[WeeklyVerse]:
    return (
        db.query(WeeklyVerse)
        .filter(WeeklyVerse.site_id == site_id)
        .filter(WeeklyVerse.week_start == week_start)
        .first()
    )


def list_weekly_verses(
    db: Session,
    site_id: str,
    limit: int = 20,
    offset: int = 0,
) -> list[WeeklyVerse]:
    return (
        db.query(WeeklyVerse)
        .filter(WeeklyVerse.site_id == site_id)
        .order_by(WeeklyVerse.week_start.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_current_weekly_verse(db: Session, site_id: str) -> Optional[WeeklyVerse]:
    return (
        db.query(WeeklyVerse)
        .filter(WeeklyVerse.site_id == site_id)
        .filter(WeeklyVerse.week_start <= date.today())
        .order_by(WeeklyVerse.week_start.desc())
        .first()
    )


def create_weekly_verse(db: Session, payload: WeeklyVerseCreate) -> WeeklyVerse:
    existing = get_weekly_verse_by_site_week(db, str(payload.site_id), payload.week_start)
    if existing:
        raise ValueError("Weekly verse already exists for this week")
    record = WeeklyVerse(
        site_id=payload.site_id,
        week_start=payload.week_start,
        text=payload.text,
        reference=payload.reference,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def update_weekly_verse(
    db: Session,
    verse_id: str,
    payload: WeeklyVerseUpdate,
) -> Optional[WeeklyVerse]:
    record = get_weekly_verse_by_id(db, verse_id)
    if not record:
        return None
    if payload.week_start and payload.week_start != record.week_start:
        conflict = get_weekly_verse_by_site_week(db, str(record.site_id), payload.week_start)
        if conflict:
            raise ValueError("Weekly verse already exists for this week")
        record.week_start = payload.week_start
    if payload.text is not None:
        record.text = payload.text
    if payload.reference is not None:
        record.reference = payload.reference
    db.commit()
    db.refresh(record)
    return record


def delete_weekly_verse(db: Session, verse_id: str) -> bool:
    record = get_weekly_verse_by_id(db, verse_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True
