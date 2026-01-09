from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.dashboard import DailyVerse, DashboardSummary
from app.services.dashboard import fetch_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    current_user: User = Depends(
        require_roles(
            UserRole.admin,
            UserRole.center_staff,
            UserRole.branch_staff,
            UserRole.leader,
            UserRole.member,
        )
    ),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    record = fetch_dashboard_summary(db, current_user.id)
    if record:
        try:
            return DashboardSummary(**record.data)
        except ValueError:
            pass
    return DashboardSummary(
        daily_verse=DailyVerse(
            text="凡勞苦擔重擔的人，可以到我這裡來。",
            reference="馬太福音 11:28",
        ),
        checkin_qr_hint="主日/活動簽到快速通行",
        giving_masked="******",
        giving_last="最近一次：09/28 · 已入帳",
        registrations=["城市復興特會 · 已完成", "家庭關係工作坊 · 待付款"],
        prayer_response_count=2,
        prayer_message="2 則代禱已被回應",
        group_name="恩典小組",
        group_schedule="週五 20:00",
        group_leader="王小組長",
        notifications=["久未出席提醒已送出", "10 月禱告會邀請"],
        recent_activity=[
            "10/02 已完成「城市復興特會」報名",
            "10/01 代禱事項已新增回應",
            "09/28 奉獻收據已寄送至 Email",
        ],
    )
