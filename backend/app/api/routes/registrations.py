from typing import Optional
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_roles
from app.models.event import Event
from app.models.user import User, UserRole
from app.schemas.registration import (
    RegistrationAdminOut,
    RegistrationCreate,
    RegistrationOut,
    RegistrationUpdate,
)
from app.services.registrations import (
    create_registration,
    get_registration_by_id,
    list_registrations,
    list_registrations_for_event,
    delete_registration,
    update_registration,
)

router = APIRouter(prefix="/registrations", tags=["registrations"])


@router.get("", response_model=list[RegistrationOut])
def get_registrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[RegistrationOut]:
    return list_registrations(db, user_id=str(current_user.id))


@router.post("", response_model=RegistrationOut)
def create_registration_handler(
    payload: RegistrationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RegistrationOut:
    try:
        return create_registration(db, payload, user_id=str(current_user.id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


@router.patch("/{registration_id}", response_model=RegistrationOut)
def update_registration_handler(
    registration_id: str,
    payload: RegistrationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> RegistrationOut:
    record = get_registration_by_id(db, registration_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")
    if not record.user_id or str(record.user_id) != str(current_user.id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    return update_registration(db, record, payload)


@router.get("/admin", response_model=list[RegistrationAdminOut])
def list_registrations_admin(
    event_id: str = Query(...),
    q: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> list[RegistrationAdminOut]:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if not current_user.site_id or str(event.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    rows = list_registrations_for_event(
        db,
        event_id=event_id,
        query=q,
        status=status_filter,
        limit=limit,
        offset=offset,
    )
    results: list[RegistrationAdminOut] = []
    for registration, user, event_row in rows:
        results.append(
            RegistrationAdminOut(
                id=registration.id,
                event_id=registration.event_id,
                event_title=event_row.title,
                event_site_id=event_row.site_id,
                event_start_at=event_row.start_at,
                user_id=registration.user_id,
                user_email=user.email if user else None,
                user_full_name=user.full_name if user else None,
                user_phone=user.phone if user else None,
                user_member_type=user.member_type.value if user and user.member_type else None,
                user_role=user.role.value if user and user.role else None,
                status=registration.status,
                ticket_count=registration.ticket_count,
                is_proxy=registration.is_proxy,
                proxy_entries=registration.proxy_entries or [],
                created_at=registration.created_at,
                updated_at=registration.updated_at,
            )
        )
    return results


@router.patch("/admin/{registration_id}", response_model=RegistrationAdminOut)
def update_registration_admin(
    registration_id: str,
    payload: RegistrationUpdate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> RegistrationAdminOut:
    record = get_registration_by_id(db, registration_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")
    event = db.query(Event).filter(Event.id == record.event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if not current_user.site_id or str(event.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    record = update_registration(db, record, payload)
    user = db.query(User).filter(User.id == record.user_id).first()
    return RegistrationAdminOut(
        id=record.id,
        event_id=record.event_id,
        event_title=event.title,
        event_site_id=event.site_id,
        event_start_at=event.start_at,
        user_id=record.user_id,
        user_email=user.email if user else None,
        user_full_name=user.full_name if user else None,
        user_phone=user.phone if user else None,
        user_member_type=user.member_type.value if user and user.member_type else None,
        user_role=user.role.value if user and user.role else None,
        status=record.status,
        ticket_count=record.ticket_count,
        is_proxy=record.is_proxy,
        proxy_entries=record.proxy_entries or [],
        created_at=record.created_at,
        updated_at=record.updated_at,
    )


@router.delete("/admin/{registration_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_registration_admin(
    registration_id: str,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> None:
    record = get_registration_by_id(db, registration_id)
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registration not found")
    event = db.query(Event).filter(Event.id == record.event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if not current_user.site_id or str(event.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    delete_registration(db, record)
    return None


@router.get("/admin/export", response_class=Response)
def export_registrations_admin(
    event_id: str = Query(...),
    q: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff)
    ),
    db: Session = Depends(get_db),
) -> Response:
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    if not current_user.site_id or str(event.site_id) != str(current_user.site_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    rows = list_registrations_for_event(
        db,
        event_id=event_id,
        query=q,
        status=status_filter,
        limit=10000,
        offset=0,
    )
    def format_phone(phone: Optional[str]) -> str:
        if not phone:
            return ""
        return f"'{phone}"
    def format_datetime(value) -> str:
        if not value:
            return ""
        return value.strftime("%Y-%m-%d %H:%M")
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "event_title",
            "event_start_at",
            "user_full_name",
            "user_email",
            "user_phone",
            "user_member_type",
            "user_role",
            "status",
            "ticket_count",
            "is_proxy",
            "proxy_name",
            "proxy_relation",
            "proxy_phone",
            "proxy_note",
            "created_at",
            "updated_at",
        ]
    )
    for registration, user, event_row in rows:
        proxy_entries = registration.proxy_entries or []
        base_row = [
            event_row.title,
            format_datetime(event_row.start_at),
            user.full_name if user else "",
            user.email if user else "",
            format_phone(user.phone if user else None),
            user.member_type.value if user and user.member_type else "",
            user.role.value if user and user.role else "",
            registration.status.value,
            registration.ticket_count,
            "N",
            "",
            "",
            "",
            "",
            format_datetime(registration.created_at),
            format_datetime(registration.updated_at),
        ]
        writer.writerow(base_row)
        for entry in proxy_entries:
            writer.writerow(
                [
                    event_row.title,
                    format_datetime(event_row.start_at),
                    user.full_name if user else "",
                    user.email if user else "",
                    format_phone(user.phone if user else None),
                    user.member_type.value if user and user.member_type else "",
                    user.role.value if user and user.role else "",
                    registration.status.value,
                    "",
                    "Y",
                    entry.get("name", ""),
                    entry.get("relation", ""),
                    format_phone(entry.get("phone", "")),
                    entry.get("note", ""),
                    format_datetime(registration.created_at),
                    format_datetime(registration.updated_at),
                ]
            )
    content = "\ufeff" + buffer.getvalue()
    filename = f"registrations_{event_id}.csv"
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
