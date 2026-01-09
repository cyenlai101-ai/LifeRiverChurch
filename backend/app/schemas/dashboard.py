from pydantic import BaseModel


class DailyVerse(BaseModel):
    text: str
    reference: str


class DashboardSummary(BaseModel):
    daily_verse: DailyVerse
    checkin_qr_hint: str
    giving_masked: str
    giving_last: str
    registrations: list[str]
    prayer_response_count: int
    prayer_message: str
    group_name: str
    group_schedule: str
    group_leader: str
    notifications: list[str]
    recent_activity: list[str]
