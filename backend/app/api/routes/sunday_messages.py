from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.sunday_message import (
    SundayMessageCreate,
    SundayMessageOut,
    SundayMessageUpdate,
)
from app.services.sunday_messages import (
    create_sunday_message,
    delete_sunday_message,
    get_sunday_message_by_id,
    list_latest_sunday_messages,
    list_sunday_messages,
    update_sunday_message,
)

router = APIRouter(prefix="/sunday-messages", tags=["sunday-messages"])


@router.get("/latest", response_model=list[SundayMessageOut])
def read_latest_sunday_messages(
    site_id: Optional[str] = Query(None),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
) -> list[SundayMessageOut]:
    return list_latest_sunday_messages(db, site_id=site_id, limit=limit)


@router.get("/public", response_model=list[SundayMessageOut])
def list_public_sunday_messages(
    site_id: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    sort_by: str = Query("message_date"),
    sort_dir: str = Query("desc"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[SundayMessageOut]:
    return list_sunday_messages(
        db,
        site_id=site_id,
        query=query,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )


@router.get("", response_model=list[SundayMessageOut])
def list_sunday_message_records(
    site_id: str = Query(...),
    query: Optional[str] = Query(None),
    sort_by: str = Query("message_date"),
    sort_dir: str = Query("desc"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> list[SundayMessageOut]:
    if not current_user.site_id or site_id != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return list_sunday_messages(
        db,
        site_id=site_id,
        query=query,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )


@router.post("", response_model=SundayMessageOut, status_code=status.HTTP_201_CREATED)
def create_sunday_message_record(
    payload: SundayMessageCreate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> SundayMessageOut:
    if not current_user.site_id or str(payload.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return create_sunday_message(db, payload)


@router.patch("/{message_id}", response_model=SundayMessageOut)
def update_sunday_message_record(
    message_id: str,
    payload: SundayMessageUpdate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> SundayMessageOut:
    record = get_sunday_message_by_id(db, message_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if not current_user.site_id or str(record.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    record = update_sunday_message(db, message_id, payload)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return record


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sunday_message_record(
    message_id: str,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> None:
    record = get_sunday_message_by_id(db, message_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    if not current_user.site_id or str(record.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if not delete_sunday_message(db, message_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return None
