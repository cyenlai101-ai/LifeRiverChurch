from typing import Optional

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.event import EventCreate, EventOut, EventUpdate
from app.models.event import EventStatus
from app.services.events import create_event, delete_event, list_events, update_event

BASE_DIR = Path(__file__).resolve().parents[3]
POSTER_DIR = BASE_DIR / "static" / "posters"
ALLOWED_POSTER_TYPES = {"image/jpeg", "image/png", "image/webp"}

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def get_events(
    site_id: Optional[str] = None,
    status: Optional[EventStatus] = None,
    q: Optional[str] = None,
    upcoming_only: bool = False,
    sort_by: str = "start_at",
    sort_dir: str = "asc",
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[EventOut]:
    return list_events(
        db,
        site_id=site_id,
        status=status,
        query=q,
        upcoming_only=upcoming_only,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=EventOut)
def create_event_handler(
    payload: EventCreate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> EventOut:
    return create_event(db, payload, created_by=str(current_user.id))


@router.patch("/{event_id}", response_model=EventOut)
def update_event_handler(
    event_id: str,
    payload: EventUpdate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> EventOut:
    _ = current_user
    event = update_event(db, event_id, payload)
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.post("/{event_id}/poster", response_model=EventOut)
def upload_event_poster(
    event_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> EventOut:
    _ = current_user
    if file.content_type not in ALLOWED_POSTER_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")
    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    if extension not in {".jpg", ".jpeg", ".png", ".webp"}:
        extension = ".jpg"
    POSTER_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{event_id}-{uuid.uuid4().hex}{extension}"
    target_path = POSTER_DIR / filename
    with target_path.open("wb") as target:
        target.write(file.file.read())
    poster_url = f"/static/posters/{filename}"
    event = update_event(db, event_id, EventUpdate(poster_url=poster_url))
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_handler(
    event_id: str,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> None:
    _ = current_user
    if not delete_event(db, event_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return None
