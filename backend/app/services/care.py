from typing import Optional

from sqlalchemy.orm import Session

from app.models.care import CareLog, CareSubject, CareSubjectStatus
from app.schemas.care import CareLogCreate, CareSubjectCreate


def list_subjects(
    db: Session,
    site_id: Optional[str] = None,
    status: Optional[CareSubjectStatus] = None,
    query: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
) -> list[CareSubject]:
    query_set = db.query(CareSubject)
    if site_id:
        query_set = query_set.filter(CareSubject.site_id == site_id)
    if status:
        query_set = query_set.filter(CareSubject.status == status)
    if query:
        like_value = f"%{query}%"
        query_set = query_set.filter(CareSubject.name.ilike(like_value))
    sort_map = {
        "created_at": CareSubject.created_at,
        "name": CareSubject.name,
    }
    sort_column = sort_map.get(sort_by, CareSubject.created_at)
    if sort_dir == "asc":
        query_set = query_set.order_by(sort_column.asc())
    else:
        query_set = query_set.order_by(sort_column.desc())
    return query_set.offset(offset).limit(limit).all()


def create_subject(db: Session, payload: CareSubjectCreate) -> CareSubject:
    subject = CareSubject(**payload.model_dump())
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def list_logs(db: Session, subject_id: str) -> list[CareLog]:
    return (
        db.query(CareLog)
        .filter(CareLog.subject_id == subject_id)
        .order_by(CareLog.created_at.desc())
        .all()
    )


def create_log(db: Session, payload: CareLogCreate, created_by: Optional[str]) -> CareLog:
    log = CareLog(
        subject_id=payload.subject_id,
        created_by=created_by,
        note=payload.note,
        mood_score=payload.mood_score,
        spiritual_score=payload.spiritual_score,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log
