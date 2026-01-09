from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.registration import RegistrationCreate, RegistrationOut
from app.services.registrations import create_registration, list_registrations

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
    return create_registration(db, payload, user_id=str(current_user.id))
