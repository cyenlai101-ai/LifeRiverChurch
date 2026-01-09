from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.care import CareSubjectStatus
from app.models.user import User, UserRole
from app.schemas.care import CareLogCreate, CareLogOut, CareSubjectCreate, CareSubjectOut
from app.services.care import create_log, create_subject, list_logs, list_subjects

router = APIRouter(prefix="/care", tags=["care"])


@router.get("/subjects", response_model=list[CareSubjectOut])
def get_subjects(
    site_id: Optional[str] = None,
    status: Optional[CareSubjectStatus] = None,
    q: Optional[str] = None,
    sort_by: str = "created_at",
    sort_dir: str = "desc",
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff, UserRole.leader)
    ),
    db: Session = Depends(get_db),
) -> list[CareSubjectOut]:
    _ = current_user
    return list_subjects(
        db,
        site_id=site_id,
        status=status,
        query=q,
        sort_by=sort_by,
        sort_dir=sort_dir,
        limit=limit,
        offset=offset,
    )


@router.post("/subjects", response_model=CareSubjectOut)
def create_subject_handler(
    payload: CareSubjectCreate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff, UserRole.leader)
    ),
    db: Session = Depends(get_db),
) -> CareSubjectOut:
    _ = current_user
    return create_subject(db, payload)


@router.get("/subjects/{subject_id}/logs", response_model=list[CareLogOut])
def get_logs(
    subject_id: str,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff, UserRole.leader)
    ),
    db: Session = Depends(get_db),
) -> list[CareLogOut]:
    _ = current_user
    return list_logs(db, subject_id=subject_id)


@router.post("/logs", response_model=CareLogOut)
def create_log_handler(
    payload: CareLogCreate,
    current_user: User = Depends(
        require_roles(UserRole.admin, UserRole.center_staff, UserRole.branch_staff, UserRole.leader)
    ),
    db: Session = Depends(get_db),
) -> CareLogOut:
    return create_log(db, payload, created_by=str(current_user.id))
