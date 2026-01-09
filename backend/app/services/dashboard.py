from typing import Optional

from sqlalchemy.orm import Session

from app.models.dashboard import DashboardSummary


def fetch_dashboard_summary(db: Session, user_id) -> Optional[DashboardSummary]:
    return db.query(DashboardSummary).filter(DashboardSummary.user_id == user_id).first()
