from typing import Optional
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.life_bulletin import LifeBulletinCreate, LifeBulletinOut, LifeBulletinUpdate
from app.services.life_bulletins import (
    create_life_bulletin,
    delete_life_bulletin,
    get_life_bulletin_by_id,
    list_latest_life_bulletins,
    list_life_bulletins,
    update_life_bulletin,
)

router = APIRouter(prefix="/life-bulletins", tags=["life-bulletins"])

BASE_DIR = Path(__file__).resolve().parents[3]
VIDEO_DIR = BASE_DIR / "static" / "life-bulletins"
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}


@router.get("/latest", response_model=list[LifeBulletinOut])
def read_latest_life_bulletins(
    site_id: Optional[str] = Query(None),
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
) -> list[LifeBulletinOut]:
    return list_latest_life_bulletins(db, site_id=site_id, limit=limit)


@router.get("/public", response_model=list[LifeBulletinOut])
def list_public_life_bulletins(
    site_id: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    sort_by: str = Query("bulletin_date"),
    sort_dir: str = Query("desc"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[LifeBulletinOut]:
    return list_life_bulletins(
        db,
        site_id=site_id,
        query=query,
        status=status_filter,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )


@router.get("", response_model=list[LifeBulletinOut])
def list_life_bulletin_records(
    site_id: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    sort_by: str = Query("bulletin_date"),
    sort_dir: str = Query("desc"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> list[LifeBulletinOut]:
    if not current_user.site_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return list_life_bulletins(
        db,
        site_id=str(current_user.site_id),
        query=query,
        status=status_filter,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=LifeBulletinOut, status_code=status.HTTP_201_CREATED)
def create_life_bulletin_record(
    payload: LifeBulletinCreate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> LifeBulletinOut:
    if not current_user.site_id or str(payload.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return create_life_bulletin(db, payload)


@router.patch("/{bulletin_id}", response_model=LifeBulletinOut)
def update_life_bulletin_record(
    bulletin_id: str,
    payload: LifeBulletinUpdate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> LifeBulletinOut:
    record = get_life_bulletin_by_id(db, bulletin_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Life bulletin not found")
    if not current_user.site_id or str(record.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    record = update_life_bulletin(db, bulletin_id, payload)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Life bulletin not found")
    return record


@router.post("/{bulletin_id}/video", response_model=LifeBulletinOut)
def upload_life_bulletin_video(
    bulletin_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> LifeBulletinOut:
    record = get_life_bulletin_by_id(db, bulletin_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Life bulletin not found")
    if not current_user.site_id or str(record.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported file type")
    extension = Path(file.filename or "").suffix.lower() or ".mp4"
    if extension not in {".mp4", ".webm", ".mov"}:
        extension = ".mp4"
    VIDEO_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{bulletin_id}-{uuid.uuid4().hex}{extension}"
    target_path = VIDEO_DIR / filename
    with target_path.open("wb") as target:
        target.write(file.file.read())
    video_url = f"/static/life-bulletins/{filename}"
    record = update_life_bulletin(db, bulletin_id, LifeBulletinUpdate(video_url=video_url))
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Life bulletin not found")
    return record


@router.delete("/{bulletin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_life_bulletin_record(
    bulletin_id: str,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> None:
    record = get_life_bulletin_by_id(db, bulletin_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Life bulletin not found")
    if not current_user.site_id or str(record.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if not delete_life_bulletin(db, bulletin_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Life bulletin not found")
    return None
