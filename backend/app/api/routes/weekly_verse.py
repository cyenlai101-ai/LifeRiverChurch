from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.weekly_verse import WeeklyVerseCreate, WeeklyVerseOut, WeeklyVerseUpdate
from app.services.weekly_verse import (
    create_weekly_verse,
    delete_weekly_verse,
    get_current_weekly_verse,
    get_weekly_verse_by_id,
    list_weekly_verses,
    update_weekly_verse,
)

router = APIRouter(prefix="/weekly-verse", tags=["weekly-verse"])


@router.get("/current", response_model=WeeklyVerseOut)
def read_current_weekly_verse(
    site_id: str = Query(...),
    db: Session = Depends(get_db),
) -> WeeklyVerseOut:
    record = get_current_weekly_verse(db, site_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly verse not set")
    return record


@router.get("", response_model=list[WeeklyVerseOut])
def list_weekly_verse_records(
    site_id: str = Query(...),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> list[WeeklyVerseOut]:
    if not current_user.site_id or site_id != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return list_weekly_verses(db, site_id=site_id, limit=limit, offset=offset)


@router.post("", response_model=WeeklyVerseOut, status_code=status.HTTP_201_CREATED)
def create_weekly_verse_record(
    payload: WeeklyVerseCreate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> WeeklyVerseOut:
    if not current_user.site_id or str(payload.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    try:
        return create_weekly_verse(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.patch("/{verse_id}", response_model=WeeklyVerseOut)
def update_weekly_verse_record(
    verse_id: str,
    payload: WeeklyVerseUpdate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> WeeklyVerseOut:
    record = get_weekly_verse_by_id(db, verse_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly verse not found")
    if not current_user.site_id or str(record.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    try:
        record = update_weekly_verse(db, verse_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly verse not found")
    return record


@router.delete("/{verse_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_weekly_verse_record(
    verse_id: str,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> None:
    record = get_weekly_verse_by_id(db, verse_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly verse not found")
    if not current_user.site_id or str(record.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if not delete_weekly_verse(db, verse_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Weekly verse not found")
    return None
