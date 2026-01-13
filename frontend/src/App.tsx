import { useEffect, useMemo, useState } from "react";
import {
  API_BASE_URL,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUpload,
  LoginResponse,
} from "./api/client";

type SiteTheme = {
  id: string;
  name: string;
  accent: string;
  accentSoft: string;
  accentDeep: string;
  tagline: string;
};

type DashboardSummary = {
  daily_verse: {
    text: string;
    reference: string;
  };
  checkin_qr_hint: string;
  giving_masked: string;
  giving_last: string;
  registrations: string[];
  prayer_response_count: number;
  prayer_message: string;
  group_name: string;
  group_schedule: string;
  group_leader: string;
  notifications: string[];
  recent_activity: string[];
};

type WeeklyVerse = {
  id: string;
  site_id: string;
  week_start: string;
  text: string;
  reference: string;
  updated_at: string;
};

type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  role: "Admin" | "CenterStaff" | "BranchStaff" | "Leader" | "Member";
  phone?: string | null;
  member_type?: "Member" | "Seeker";
  site_id?: string | null;
};

type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  poster_url?: string | null;
  start_at: string;
  end_at?: string | null;
  capacity?: number | null;
  waitlist_enabled: boolean;
  status: "Draft" | "Published" | "Closed";
  site_id?: string | null;
};

type PrayerItem = {
  id: string;
  content: string;
  privacy_level: "Private" | "Group" | "Public";
  status: "Pending" | "Approved" | "Archived";
  amen_count: number;
  created_at: string;
};

type CareSubjectItem = {
  id: string;
  name: string;
  subject_type: "Member" | "Seeker" | "Family" | "Community";
  status: "Active" | "Paused" | "Closed";
  created_at: string;
};

type AdminUserItem = {
  id: string;
  email: string;
  full_name?: string | null;
  role: "Admin" | "CenterStaff" | "BranchStaff" | "Leader" | "Member";
  site_id?: string | null;
  is_active: boolean;
  created_at: string;
};

const sites: SiteTheme[] = [
  {
    id: "all",
    name: "全站",
    accent: "#1f2937",
    accentSoft: "#e5e7eb",
    accentDeep: "#0f172a",
    tagline: "跨站點最新消息與活動，一次掌握。",
  },
  {
    id: "center",
    name: "生命河中心",
    accent: "#1f4ed8",
    accentSoft: "#dbe6ff",
    accentDeep: "#102a6b",
    tagline: "城市中每一道光，都值得被看見。",
  },
  {
    id: "guangfu",
    name: "光復教會",
    accent: "#2ba86a",
    accentSoft: "#d8f3e5",
    accentDeep: "#145338",
    tagline: "與社區同行，把愛留在日常。",
  },
  {
    id: "second",
    name: "第二教會",
    accent: "#ff8b2c",
    accentSoft: "#ffe6d1",
    accentDeep: "#7a3f16",
    tagline: "跨世代敬拜，為下一代扎根。",
  },
  {
    id: "fuzhong",
    name: "府中教會",
    accent: "#6d28d9",
    accentSoft: "#ede3ff",
    accentDeep: "#3b0764",
    tagline: "在城市節奏裡守住溫柔與盼望。",
  },
];

const siteIdMap: Record<string, string> = {
  "11111111-1111-1111-1111-111111111111": "生命河中心",
  "22222222-2222-2222-2222-222222222222": "光復教會",
  "33333333-3333-3333-3333-333333333333": "第二教會",
  "44444444-4444-4444-4444-444444444444": "府中教會",
};

const siteUuidByCode: Record<string, string> = {
  center: "11111111-1111-1111-1111-111111111111",
  guangfu: "22222222-2222-2222-2222-222222222222",
  second: "33333333-3333-3333-3333-333333333333",
  fuzhong: "44444444-4444-4444-4444-444444444444",
};

const news = [
  {
    title: "本週每日金句已更新",
    detail: "主題：在忙碌裡學習安息",
  },
  {
    title: "代禱牆新增匿名模式",
    detail: "關懷同工可協助審核後發布",
  },
  {
    title: "小組長訓練開放報名",
    detail: "支援團體報名與統一付款",
  },
];

const ministries = [
  {
    title: "代禱牆",
    detail: "提報心聲，連結守望",
  },
  {
    title: "關懷 CRM",
    detail: "追蹤生命旅程與提醒",
  },
  {
    title: "活動報名",
    detail: "支援代理與團體報名",
  },
];

const quickActions = [
  "快速奉獻",
  "活動報名",
  "提報代禱",
  "更新個人資料",
];

const recentActivities = [
  "10/02 已完成「城市復興特會」報名",
  "10/01 代禱事項已新增回應",
  "09/28 奉獻收據已寄送至 Email",
];

const prayerWall = [
  {
    title: "為家庭關係禱告",
    content: "求神醫治溝通的裂縫，讓愛重新被看見。",
    amen: 36,
  },
  {
    title: "為職場新階段禱告",
    content: "願神賜下智慧與平安，面對新的挑戰。",
    amen: 22,
  },
  {
    title: "為身體健康禱告",
    content: "求主保守手術後的恢復與力量。",
    amen: 54,
  },
];

const careSubjects = [
  { name: "王小光", status: "Active", last: "09/30 訪談" },
  { name: "陳佳怡", status: "Paused", last: "09/18 電訪" },
  { name: "林俊哲", status: "Active", last: "10/01 家訪" },
];

export default function App() {
  const [activeSiteId, setActiveSiteId] = useState("all");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerMessage, setRegisterMessage] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [eventsData, setEventsData] = useState<EventItem[] | null>(null);
  const [prayersData, setPrayersData] = useState<PrayerItem[] | null>(null);
  const [careData, setCareData] = useState<CareSubjectItem[] | null>(null);
  const [weeklyVerse, setWeeklyVerse] = useState<WeeklyVerse | null>(null);
  const [weeklyVerseList, setWeeklyVerseList] = useState<WeeklyVerse[]>([]);
  const [weeklyVerseEditingId, setWeeklyVerseEditingId] = useState<string | null>(null);
  const [weeklyVerseForm, setWeeklyVerseForm] = useState({
    siteId: siteUuidByCode.center,
    weekStart: "",
    text: "",
    reference: "",
  });
  const [weeklyVerseMessage, setWeeklyVerseMessage] = useState("");
  const [viewMessage, setViewMessage] = useState("");
  const [eventQuery, setEventQuery] = useState("");
  const [eventStatus, setEventStatus] = useState("");
  const [eventSite, setEventSite] = useState("");
  const [eventUpcomingOnly, setEventUpcomingOnly] = useState(false);
  const [eventSortBy, setEventSortBy] = useState("start_at");
  const [eventSortDir, setEventSortDir] = useState("asc");
  const [eventLimit, setEventLimit] = useState(50);
  const [eventOffset, setEventOffset] = useState(0);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
    capacity: "",
    siteId: "",
    waitlistEnabled: false,
    status: "Draft",
  });
  const [prayerQuery, setPrayerQuery] = useState("");
  const [prayerPrivacy, setPrayerPrivacy] = useState("");
  const [prayerSite, setPrayerSite] = useState("");
  const [prayerSortBy, setPrayerSortBy] = useState("created_at");
  const [prayerSortDir, setPrayerSortDir] = useState("desc");
  const [prayerLimit, setPrayerLimit] = useState(12);
  const [prayerOffset, setPrayerOffset] = useState(0);
  const [prayerForm, setPrayerForm] = useState({
    content: "",
    privacyLevel: "Group",
    siteId: "",
  });
  const [adminPrayerQuery, setAdminPrayerQuery] = useState("");
  const [adminPrayerPrivacy, setAdminPrayerPrivacy] = useState("");
  const [adminPrayerSite, setAdminPrayerSite] = useState("");
  const [adminPrayerSortBy, setAdminPrayerSortBy] = useState("created_at");
  const [adminPrayerSortDir, setAdminPrayerSortDir] = useState("desc");
  const [adminPrayerLimit, setAdminPrayerLimit] = useState(12);
  const [adminPrayerOffset, setAdminPrayerOffset] = useState(0);
  const [adminUserQuery, setAdminUserQuery] = useState("");
  const [adminUserRole, setAdminUserRole] = useState("");
  const [adminUserSite, setAdminUserSite] = useState("");
  const [adminUserActive, setAdminUserActive] = useState("");
  const [adminUserSortBy, setAdminUserSortBy] = useState("created_at");
  const [adminUserSortDir, setAdminUserSortDir] = useState("desc");
  const [adminUserLimit, setAdminUserLimit] = useState(12);
  const [adminUserOffset, setAdminUserOffset] = useState(0);
  const [adminUsers, setAdminUsers] = useState<AdminUserItem[] | null>(null);
  const [adminUserMessage, setAdminUserMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userForm, setUserForm] = useState({
    fullName: "",
    role: "Member",
    siteId: "",
    isActive: true,
  });
  const [resetPassword, setResetPassword] = useState("");
  const [careQuery, setCareQuery] = useState("");
  const [careStatus, setCareStatus] = useState("");
  const [careSite, setCareSite] = useState("");
  const [careSortBy, setCareSortBy] = useState("created_at");
  const [careSortDir, setCareSortDir] = useState("desc");
  const [careLimit, setCareLimit] = useState(12);
  const [careOffset, setCareOffset] = useState(0);
  const [careForm, setCareForm] = useState({
    name: "",
    subjectType: "Member",
    status: "Active",
    siteId: "",
  });
  const [adminPrayers, setAdminPrayers] = useState<PrayerItem[] | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [adminTab, setAdminTab] = useState<"prayers" | "members" | "events">("prayers");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventPosterFile, setEventPosterFile] = useState<File | null>(null);
  const [eventPosterPreview, setEventPosterPreview] = useState<string | null>(null);
  const [homeEvents, setHomeEvents] = useState<EventItem[] | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    memberType: "Member",
  });
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [mobilePreview, setMobilePreview] = useState(false);
  const [activeView, setActiveView] = useState<
    "home" | "member" | "events" | "prayers" | "care" | "admin"
  >("home");
  const activeSite = useMemo(
    () => sites.find((site) => site.id === activeSiteId) || sites[0],
    [activeSiteId]
  );

  const themeStyle = {
    "--accent": activeSite.accent,
    "--accent-soft": activeSite.accentSoft,
    "--accent-deep": activeSite.accentDeep,
  } as React.CSSProperties;

  const fallbackSummary: DashboardSummary = {
    daily_verse: {
      text: "凡勞苦擔重擔的人，可以到我這裡來。",
      reference: "馬太福音 11:28",
    },
    checkin_qr_hint: "主日/活動簽到快速通行",
    giving_masked: "******",
    giving_last: "最近一次：09/28 · 已入帳",
    registrations: ["城市復興特會 · 已完成", "家庭關係工作坊 · 待付款"],
    prayer_response_count: 2,
    prayer_message: "2 則代禱已被回應",
    group_name: "恩典小組",
    group_schedule: "週五 20:00",
    group_leader: "王小組長",
    notifications: ["久未出席提醒已送出", "10 月禱告會邀請"],
    recent_activity: recentActivities,
  };

  const summaryData = summary ?? fallbackSummary;
  const eventStatusLabelMap: Record<EventItem["status"], string> = {
    Draft: "草稿",
    Published: "已發布",
    Closed: "已結束",
  };
  const weekEventItems =
    homeEvents && homeEvents.length
      ? homeEvents
          .filter((event) => event.status !== "Draft")
          .map((event) => ({
            id: event.id,
            title: event.title,
            date: formatDateRange(event.start_at, event.end_at),
            location: resolveSiteName(event.site_id),
            description: event.description || "",
            capacity: event.capacity,
            status: eventStatusLabelMap[event.status] || event.status,
            posterUrl: resolvePosterUrl(event.poster_url),
          }))
      : [];
  const eventsList =
    eventsData && eventsData.length
      ? eventsData.map((event) => ({
          id: event.id,
          title: event.title,
          date: formatDateRange(event.start_at, event.end_at),
          location: resolveSiteName(event.site_id),
          description: event.description || "",
          capacity: event.capacity,
          status: eventStatusLabelMap[event.status] || event.status,
          statusRaw: event.status,
          posterUrl: resolvePosterUrl(event.poster_url),
        }))
      : [];
  const eventsAdminList =
    eventsData && eventsData.length
      ? eventsData
          .filter((event) => isUuid(event.id))
          .map((event) => ({
            title: event.title,
            date: formatDateRange(event.start_at, event.end_at),
            location: resolveSiteName(event.site_id),
            statusLabel: eventStatusLabelMap[event.status] || event.status,
            statusRaw: event.status,
            id: event.id,
            posterUrl: resolvePosterUrl(event.poster_url),
          }))
      : [];
  const eventStartParts = splitDateTime(eventForm.startAt);
  const eventEndParts = splitDateTime(eventForm.endAt);
  const eventTimePreview = formatEventTimePreview(eventForm.startAt, eventForm.endAt);
  const eventHourOptions = Array.from({ length: 24 }, (_, index) =>
    String(index).padStart(2, "0")
  );
  const eventMinuteOptions = ["00", "10", "20", "30", "40", "50"];
  const prayerList =
    prayersData && prayersData.length
      ? prayersData.map((item) => ({
          title: privacyLabel(item.privacy_level),
          content: item.content,
          amen: item.amen_count,
          id: item.id,
        }))
      : prayerWall.map((item, index) => ({
          ...item,
          id: String(index),
        }));
  const careList =
    careData && careData.length
      ? careData.map((item) => ({
          id: item.id,
          name: item.name,
          status: item.status,
          last: "待補近期關懷",
        }))
      : careSubjects.map((item, index) => ({
          ...item,
          id: String(index),
        }));
  const staffRoles = new Set<UserProfile["role"]>([
    "Admin",
    "CenterStaff",
    "BranchStaff",
    "Leader",
  ]);
  const isStaff = currentUser ? staffRoles.has(currentUser.role) : false;
  const weeklyVerseSiteId = currentUser?.site_id || weeklyVerseForm.siteId;
  const weeklyVerseSiteLocked = true;
  const homeVerse = weeklyVerse ?? {
    text: "凡勞苦擔重擔的人，可以到我這裡來。",
    reference: "馬太福音 11:28",
  };
  const roleLabelMap: Record<UserProfile["role"], string> = {
    Admin: "系統管理",
    CenterStaff: "中心同工",
    BranchStaff: "分站同工",
    Leader: "小組長",
    Member: "會員",
  };

  useEffect(() => {
    setViewMessage("");
    setAdminMessage("");
  }, [activeView]);

  useEffect(() => {
    setEventOffset(0);
  }, [eventQuery, eventStatus, eventSite, eventUpcomingOnly, eventSortBy, eventSortDir, eventLimit]);

  useEffect(() => {
    setPrayerOffset(0);
  }, [prayerQuery, prayerPrivacy, prayerSite, prayerSortBy, prayerSortDir, prayerLimit]);

  useEffect(() => {
    setCareOffset(0);
  }, [careQuery, careStatus, careSite, careSortBy, careSortDir, careLimit]);

  useEffect(() => {
    setAdminPrayerOffset(0);
  }, [adminPrayerQuery, adminPrayerPrivacy, adminPrayerSite, adminPrayerSortBy, adminPrayerSortDir, adminPrayerLimit]);

  useEffect(() => {
    if (!token) {
      setSummary(null);
      setCurrentUser(null);
      setActiveView("home");
      return;
    }
    apiGet<DashboardSummary>("/dashboard/summary", token)
      .then((data) => setSummary(data))
      .catch((error) => {
        setLoginMessage(error?.message || "取得會員資料失敗");
        setSummary(null);
      });
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    apiGet<UserProfile>("/auth/me", token)
      .then((data) => setCurrentUser(data))
      .catch((error) => {
        setLoginMessage(error?.message || "取得登入資訊失敗");
        setCurrentUser(null);
      });
  }, [token]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    setProfileForm({
      fullName: currentUser.full_name || "",
      email: currentUser.email || "",
      phone: currentUser.phone || "",
      memberType: currentUser.member_type || "Member",
    });
    if (
      currentUser.site_id &&
      weeklyVerseForm.siteId === siteUuidByCode.center &&
      currentUser.site_id !== siteUuidByCode.center
    ) {
      setWeeklyVerseForm((prev) => ({ ...prev, siteId: currentUser.site_id }));
    }
  }, [currentUser]);

  useEffect(() => {
    if (!weeklyVerseForm.weekStart) {
      setWeeklyVerseForm((prev) => ({ ...prev, weekStart: getCurrentSundayDate() }));
    }
  }, [weeklyVerseForm.weekStart]);

  useEffect(() => {
    if (activeView !== "events") {
      return;
    }
    apiGet<EventItem[]>(buildEventsPath())
      .then((data) => setEventsData(data))
      .catch((error) => {
        setViewMessage(error?.message || "取得活動列表失敗");
        setEventsData(null);
      });
  }, [
    activeView,
    eventQuery,
    eventStatus,
    eventSite,
    eventUpcomingOnly,
    eventSortBy,
    eventSortDir,
    eventLimit,
    eventOffset,
  ]);

  useEffect(() => {
    if (activeView !== "home") {
      return;
    }
    const siteId = siteUuidByCode[activeSiteId];
    const params = new URLSearchParams({
      limit: "4",
      sort_by: "start_at",
      sort_dir: "desc",
    });
    if (siteId) {
      params.set("site_id", siteId);
    }
    apiGet<EventItem[]>(`/events?${params.toString()}`)
      .then((data) => setHomeEvents(data))
      .catch(() => setHomeEvents([]));
  }, [activeView, activeSiteId]);

  useEffect(() => {
    if (activeView !== "home") {
      return;
    }
    const siteId = siteUuidByCode[activeSiteId];
    if (!siteId) {
      setWeeklyVerse(null);
      return;
    }
    apiGet<WeeklyVerse>(`/weekly-verse/current?site_id=${siteId}`)
      .then((data) => setWeeklyVerse(data))
      .catch(() => setWeeklyVerse(null));
  }, [activeView, activeSiteId]);

  useEffect(() => {
    if (!weeklyVerse) {
      return;
    }
    setWeeklyVerseForm((prev) => ({
      ...prev,
      siteId: weeklyVerse.site_id,
      weekStart: weeklyVerse.week_start,
      text: weeklyVerse.text,
      reference: weeklyVerse.reference,
    }));
  }, [weeklyVerse]);

  useEffect(() => {
    if (activeView !== "admin" || adminTab !== "events") {
      return;
    }
    apiGet<EventItem[]>(buildEventsPath())
      .then((data) => setEventsData(data))
      .catch((error) => {
        setViewMessage(error?.message || "取得活動列表失敗");
        setEventsData(null);
      });
  }, [
    activeView,
    adminTab,
    eventQuery,
    eventStatus,
    eventSite,
    eventUpcomingOnly,
    eventSortBy,
    eventSortDir,
    eventLimit,
    eventOffset,
  ]);

  useEffect(() => {
    if (activeView !== "admin") {
      return;
    }
    const siteId = weeklyVerseSiteId;
    if (!siteId) {
      setWeeklyVerse(null);
      return;
    }
    apiGet<WeeklyVerse[]>(`/weekly-verse?site_id=${siteId}`)
      .then((data) => setWeeklyVerseList(data))
      .catch(() => setWeeklyVerseList([]));
  }, [activeView, weeklyVerseSiteId]);

  useEffect(() => {
    setWeeklyVerseMessage("");
  }, [weeklyVerseForm.siteId]);

  useEffect(() => {
    if (activeView !== "prayers") {
      return;
    }
    apiGet<PrayerItem[]>(buildPrayersPath())
      .then((data) => setPrayersData(data))
      .catch((error) => {
        setViewMessage(error?.message || "取得代禱牆失敗");
        setPrayersData(null);
      });
  }, [
    activeView,
    prayerQuery,
    prayerPrivacy,
    prayerSite,
    prayerSortBy,
    prayerSortDir,
    prayerLimit,
    prayerOffset,
  ]);

  useEffect(() => {
    if (activeView !== "care" || !token || !isStaff) {
      return;
    }
    apiGet<CareSubjectItem[]>(buildCarePath(), token)
      .then((data) => setCareData(data))
      .catch((error) => {
        setViewMessage(error?.message || "取得關懷名單失敗");
        setCareData(null);
      });
  }, [
    activeView,
    token,
    isStaff,
    careQuery,
    careStatus,
    careSite,
    careSortBy,
    careSortDir,
    careLimit,
    careOffset,
  ]);

  useEffect(() => {
    if (activeView !== "admin" || !token || !isStaff) {
      return;
    }
    apiGet<PrayerItem[]>(buildAdminPrayersPath(), token)
      .then((data) => setAdminPrayers(data))
      .catch((error) => {
        setAdminMessage(error?.message || "取得待審核代禱失敗");
        setAdminPrayers(null);
      });
  }, [
    activeView,
    token,
    isStaff,
    adminPrayerQuery,
    adminPrayerPrivacy,
    adminPrayerSite,
    adminPrayerSortBy,
    adminPrayerSortDir,
    adminPrayerLimit,
    adminPrayerOffset,
  ]);

  useEffect(() => {
    if (activeView !== "admin" || !token || !isStaff) {
      return;
    }
    apiGet<AdminUserItem[]>(buildAdminUsersPath(), token)
      .then((data) => setAdminUsers(data))
      .catch((error) => {
        setAdminUserMessage(error?.message || "取得會員列表失敗");
        setAdminUsers(null);
      });
  }, [
    activeView,
    token,
    isStaff,
    adminUserQuery,
    adminUserRole,
    adminUserSite,
    adminUserActive,
    adminUserSortBy,
    adminUserSortDir,
    adminUserLimit,
    adminUserOffset,
  ]);

  useEffect(() => {
    setViewMessage("");
    setAdminMessage("");
    setAdminUserMessage("");
    setSelectedUser(null);
  }, [activeView]);

  useEffect(() => {
    setAdminUserOffset(0);
  }, [
    adminUserQuery,
    adminUserRole,
    adminUserSite,
    adminUserActive,
    adminUserSortBy,
    adminUserSortDir,
    adminUserLimit,
  ]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginMessage("");
    try {
      const data = await apiPost<LoginResponse>("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      setToken(data.access_token);
      setIsLoginOpen(false);
      setLoginPassword("");
      setLoginMessage("登入成功");
      setActiveView("member");
      apiGet<UserProfile>("/auth/me", data.access_token)
        .then((profile) => setCurrentUser(profile))
        .catch((error) => {
          setLoginMessage(error?.message || "取得登入資訊失敗");
          setCurrentUser(null);
        });
    } catch (error: any) {
      setLoginMessage(error?.message || "登入失敗");
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setRegisterMessage("");
    try {
      await apiPost("/auth/register", {
        email: registerEmail,
        password: registerPassword,
        full_name: registerName || undefined,
      });
      setRegisterMessage("註冊成功，請登入");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterName("");
      setAuthMode("login");
    } catch (error: any) {
      setRegisterMessage(error?.message || "註冊失敗");
    }
  };

  const handleLogout = () => {
    setToken(null);
    setLoginEmail("");
    setLoginPassword("");
    setLoginMessage("已登出");
    setActiveView("home");
    setEventsData(null);
    setPrayersData(null);
    setCareData(null);
    setAdminUsers(null);
    setAdminPrayers(null);
    setSelectedUser(null);
  };

  const handleUpdateWeeklyVerse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    setWeeklyVerseMessage("");
    try {
      if (weeklyVerseEditingId) {
        await apiPatch<WeeklyVerse>(
          `/weekly-verse/${weeklyVerseEditingId}`,
          {
            week_start: weeklyVerseForm.weekStart,
            text: weeklyVerseForm.text,
            reference: weeklyVerseForm.reference,
          },
          token
        );
        setWeeklyVerseMessage("金句已更新");
      } else {
        await apiPost<WeeklyVerse>(
          "/weekly-verse",
          {
            site_id: weeklyVerseSiteId,
            week_start: weeklyVerseForm.weekStart,
            text: weeklyVerseForm.text,
            reference: weeklyVerseForm.reference,
          },
          token
        );
        setWeeklyVerseMessage("金句已新增");
      }
      const data = await apiGet<WeeklyVerse[]>(`/weekly-verse?site_id=${weeklyVerseSiteId}`);
      setWeeklyVerseList(data);
      setWeeklyVerseEditingId(null);
    } catch (error: any) {
      setWeeklyVerseMessage(error?.message || "更新本週金句失敗");
    }
  };

  const handleEditWeeklyVerse = (item: WeeklyVerse) => {
    setWeeklyVerseEditingId(item.id);
    setWeeklyVerseForm({
      siteId: item.site_id,
      weekStart: item.week_start,
      text: item.text,
      reference: item.reference,
    });
  };

  const handleDeleteWeeklyVerse = async (verseId: string) => {
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    if (!window.confirm("確定要刪除這則金句嗎？")) {
      return;
    }
    try {
      await apiDelete(`/weekly-verse/${verseId}`, token);
      const data = await apiGet<WeeklyVerse[]>(`/weekly-verse?site_id=${weeklyVerseSiteId}`);
      setWeeklyVerseList(data);
      setWeeklyVerseMessage("金句已刪除");
      if (weeklyVerseEditingId === verseId) {
        setWeeklyVerseEditingId(null);
        setWeeklyVerseForm((prev) => ({
          ...prev,
          weekStart: getCurrentSundayDate(),
          text: "",
          reference: "",
        }));
      }
    } catch (error: any) {
      setWeeklyVerseMessage(error?.message || "刪除金句失敗");
    }
  };

  const handleCreateEvent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    try {
      const payload = {
        title: eventForm.title,
        description: eventForm.description || null,
        start_at: eventForm.startAt ? new Date(eventForm.startAt).toISOString() : null,
        end_at: eventForm.endAt ? new Date(eventForm.endAt).toISOString() : null,
        capacity: eventForm.capacity ? Number(eventForm.capacity) : null,
        waitlist_enabled: eventForm.waitlistEnabled,
        status: eventForm.status,
        site_id: eventForm.siteId || null,
      };
      const savedEvent = selectedEventId
        ? await apiPatch<EventItem>(`/events/${selectedEventId}`, payload, token)
        : await apiPost<EventItem>("/events", payload, token);
      if (eventPosterFile) {
        const formData = new FormData();
        formData.append("file", eventPosterFile);
        await apiUpload<EventItem>(`/events/${savedEvent.id}/poster`, formData, token);
      }
      setEventForm({
        title: "",
        description: "",
        startAt: "",
        endAt: "",
        capacity: "",
        siteId: "",
        waitlistEnabled: false,
        status: "Draft",
      });
      setSelectedEventId(null);
      setEventPosterFile(null);
      setEventPosterPreview(null);
      setEventModalOpen(false);
      setViewMessage(selectedEventId ? "活動已更新" : "活動已建立");
      apiGet<EventItem[]>(buildEventsPath())
        .then((data) => setEventsData(data))
        .catch(() => setEventsData(null));
    } catch (error: any) {
      setViewMessage(error?.message || "活動送出失敗");
    }
  };

  const handlePublishEvent = async (eventId: string) => {
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    if (!isUuid(eventId)) {
      setViewMessage("活動清單尚未同步，請重新整理");
      return;
    }
    try {
      await apiPatch<EventItem>(`/events/${eventId}`, { status: "Published" }, token);
      apiGet<EventItem[]>(buildEventsPath())
        .then((data) => setEventsData(data))
        .catch(() => setEventsData(null));
      setViewMessage("活動已發布");
    } catch (error: any) {
      setViewMessage(error?.message || "發布活動失敗");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    if (!isUuid(eventId)) {
      setViewMessage("活動清單尚未同步，請重新整理");
      return;
    }
    if (!window.confirm("確定要刪除這個活動嗎？")) {
      return;
    }
    try {
      await apiDelete(`/events/${eventId}`, token);
      apiGet<EventItem[]>(buildEventsPath())
        .then((data) => setEventsData(data))
        .catch(() => setEventsData(null));
      setViewMessage("活動已刪除");
    } catch (error: any) {
      setViewMessage(error?.message || "刪除活動失敗");
    }
  };

  const handleCreatePrayer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    try {
      const payload = {
        content: prayerForm.content,
        privacy_level: prayerForm.privacyLevel,
        site_id: prayerForm.siteId || null,
      };
      await apiPost("/prayers", payload, token);
      setPrayerForm({ content: "", privacyLevel: "Group", siteId: "" });
      setViewMessage("代禱已送出，等待審核");
      apiGet<PrayerItem[]>(buildPrayersPath())
        .then((data) => setPrayersData(data))
        .catch(() => setPrayersData(null));
    } catch (error: any) {
      setViewMessage(error?.message || "送出代禱失敗");
    }
  };

  const handleCreateCareSubject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    try {
      const payload = {
        name: careForm.name,
        subject_type: careForm.subjectType,
        status: careForm.status,
        site_id: careForm.siteId || null,
      };
      await apiPost("/care/subjects", payload, token);
      setCareForm({ name: "", subjectType: "Member", status: "Active", siteId: "" });
      setViewMessage("關懷對象已建立");
      apiGet<CareSubjectItem[]>(buildCarePath(), token)
        .then((data) => setCareData(data))
        .catch(() => setCareData(null));
    } catch (error: any) {
      setViewMessage(error?.message || "建立關懷對象失敗");
    }
  };

  const handleUpdatePrayerStatus = async (prayerId: string, status: string) => {
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    try {
      await apiPatch(`/prayers/${prayerId}`, { status }, token);
      setAdminMessage("代禱狀態已更新");
      apiGet<PrayerItem[]>(buildAdminPrayersPath(), token)
        .then((data) => setAdminPrayers(data))
        .catch(() => setAdminPrayers(null));
    } catch (error: any) {
      setAdminMessage(error?.message || "更新代禱狀態失敗");
    }
  };

  const handleSelectUser = (user: AdminUserItem) => {
    setSelectedUser(user);
    setUserForm({
      fullName: user.full_name || "",
      role: user.role,
      siteId: user.site_id || "",
      isActive: user.is_active,
    });
    setResetPassword("");
    setUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setUserModalOpen(false);
    setSelectedUser(null);
    setResetPassword("");
  };

  const handleUpdateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !selectedUser) {
      return;
    }
    try {
      await apiPatch(
        `/admin/users/${selectedUser.id}`,
        {
          full_name: userForm.fullName || null,
          role: userForm.role,
          site_id: userForm.siteId || null,
          is_active: userForm.isActive,
        },
        token
      );
      setAdminUserMessage("會員資料已更新");
      apiGet<AdminUserItem[]>(buildAdminUsersPath(), token)
        .then((data) => setAdminUsers(data))
        .catch(() => setAdminUsers(null));
    } catch (error: any) {
      setAdminUserMessage(error?.message || "更新會員資料失敗");
    }
  };

  const handleResetUserPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !selectedUser || !resetPassword) {
      return;
    }
    try {
      await apiPost(
        `/admin/users/${selectedUser.id}/reset-password`,
        { password: resetPassword },
        token
      );
      setAdminUserMessage("密碼已重設");
      setResetPassword("");
    } catch (error: any) {
      setAdminUserMessage(error?.message || "重設密碼失敗");
    }
  };

  const handleOpenEventModal = (eventId?: string) => {
    if (eventId && eventsData) {
      const match = eventsData.find((item) => item.id === eventId);
      if (match) {
        setSelectedEventId(match.id);
        setEventForm({
          title: match.title,
          description: match.description || "",
          startAt: formatDateInput(match.start_at),
          endAt: match.end_at ? formatDateInput(match.end_at) : "",
          capacity: match.capacity ? String(match.capacity) : "",
          siteId: match.site_id || "",
          waitlistEnabled: match.waitlist_enabled,
          status: match.status,
        });
        setEventPosterFile(null);
        setEventPosterPreview(resolvePosterUrl(match.poster_url));
        setEventModalOpen(true);
        return;
      }
    }
    setSelectedEventId(null);
    setEventForm({
      title: "",
      description: "",
      startAt: "",
      endAt: "",
      capacity: "",
      siteId: "",
      waitlistEnabled: false,
      status: "Draft",
    });
    setEventPosterFile(null);
    setEventPosterPreview(null);
    setEventModalOpen(true);
  };

  const handleCloseEventModal = () => {
    setEventModalOpen(false);
    setSelectedEventId(null);
    setEventPosterFile(null);
    setEventPosterPreview(null);
  };

  const handleOpenProfileModal = () => {
    setProfileMessage("");
    setProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setProfileModalOpen(false);
    setProfileMessage("");
    setPasswordForm({ currentPassword: "", newPassword: "" });
  };

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    try {
      const payload = {
        full_name: profileForm.fullName || null,
        email: profileForm.email || null,
        phone: profileForm.phone || null,
        member_type: profileForm.memberType,
      };
      const updated = await apiPatch<UserProfile>("/auth/me", payload, token);
      setCurrentUser(updated);
      setProfileMessage("已更新個人資料");
    } catch (error: any) {
      setProfileMessage(error?.message || "更新個人資料失敗");
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    try {
      await apiPost(
        "/auth/change-password",
        {
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        },
        token
      );
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setProfileMessage("已更新密碼");
    } catch (error: any) {
      setProfileMessage(error?.message || "更新密碼失敗");
    }
  };

  function resolveSiteName(siteId?: string | null) {
    if (!siteId) {
      return "未指定場地";
    }
    return siteIdMap[siteId] || "分站活動";
  }

  function resolvePosterUrl(posterUrl?: string | null) {
    if (!posterUrl) {
      return null;
    }
    if (posterUrl.startsWith("http")) {
      return posterUrl;
    }
    return `${API_BASE_URL}${posterUrl}`;
  }

  function buildEventsPath() {
    const params = new URLSearchParams();
    if (eventQuery) params.set("q", eventQuery);
    if (eventStatus) params.set("status", eventStatus);
    if (eventSite) params.set("site_id", eventSite);
    if (eventUpcomingOnly) params.set("upcoming_only", "true");
    if (eventSortBy) params.set("sort_by", eventSortBy);
    if (eventSortDir) params.set("sort_dir", eventSortDir);
    params.set("limit", String(eventLimit));
    params.set("offset", String(eventOffset));
    return params.toString() ? `/events?${params.toString()}` : "/events";
  }

  function buildPrayersPath() {
    const params = new URLSearchParams();
    if (prayerQuery) params.set("q", prayerQuery);
    if (prayerPrivacy) params.set("privacy_level", prayerPrivacy);
    if (prayerSite) params.set("site_id", prayerSite);
    if (prayerSortBy) params.set("sort_by", prayerSortBy);
    if (prayerSortDir) params.set("sort_dir", prayerSortDir);
    params.set("limit", String(prayerLimit));
    params.set("offset", String(prayerOffset));
    return params.toString() ? `/prayers?${params.toString()}` : "/prayers";
  }

  function buildCarePath() {
    const params = new URLSearchParams();
    if (careQuery) params.set("q", careQuery);
    if (careStatus) params.set("status", careStatus);
    if (careSite) params.set("site_id", careSite);
    if (careSortBy) params.set("sort_by", careSortBy);
    if (careSortDir) params.set("sort_dir", careSortDir);
    params.set("limit", String(careLimit));
    params.set("offset", String(careOffset));
    return params.toString() ? `/care/subjects?${params.toString()}` : "/care/subjects";
  }

  function buildAdminPrayersPath() {
    const params = new URLSearchParams();
    if (adminPrayerQuery) params.set("q", adminPrayerQuery);
    if (adminPrayerPrivacy) params.set("privacy_level", adminPrayerPrivacy);
    if (adminPrayerSite) params.set("site_id", adminPrayerSite);
    if (adminPrayerSortBy) params.set("sort_by", adminPrayerSortBy);
    if (adminPrayerSortDir) params.set("sort_dir", adminPrayerSortDir);
    params.set("limit", String(adminPrayerLimit));
    params.set("offset", String(adminPrayerOffset));
    return params.toString() ? `/prayers/admin?${params.toString()}` : "/prayers/admin";
  }

  function buildAdminUsersPath() {
    const params = new URLSearchParams();
    if (adminUserQuery) params.set("q", adminUserQuery);
    if (adminUserRole) params.set("role", adminUserRole);
    if (adminUserSite) params.set("site_id", adminUserSite);
    if (adminUserActive) params.set("is_active", adminUserActive);
    if (adminUserSortBy) params.set("sort_by", adminUserSortBy);
    if (adminUserSortDir) params.set("sort_dir", adminUserSortDir);
    params.set("limit", String(adminUserLimit));
    params.set("offset", String(adminUserOffset));
    return params.toString() ? `/admin/users?${params.toString()}` : "/admin/users";
  }

  function formatDateRange(startAt: string, endAt?: string | null) {
    const start = new Date(startAt);
    if (!Number.isFinite(start.getTime())) {
      return startAt;
    }
    const startLabel = start.toLocaleString("zh-TW", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    if (!endAt) {
      return startLabel;
    }
    const end = new Date(endAt);
    if (!Number.isFinite(end.getTime())) {
      return startLabel;
    }
    const endLabel = end.toLocaleString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    return `${startLabel} - ${endLabel}`;
  }

  function formatWeekStartDate(value?: string | null) {
    if (!value) {
      return "";
    }
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return value;
    }
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  function getCurrentSundayDate() {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? 0 : day;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - diff);
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
  }

  function formatEventTimePreview(startAt: string, endAt?: string | null) {
    const start = new Date(startAt);
    if (!Number.isFinite(start.getTime())) {
      return "";
    }
    const startDate = start.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const startTime = start.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    if (!endAt) {
      return `${startDate} ${startTime}`;
    }
    const end = new Date(endAt);
    if (!Number.isFinite(end.getTime())) {
      return `${startDate} ${startTime}`;
    }
    const endDate = end.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const endTime = end.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    if (endDate === startDate) {
      return `${startDate} ${startTime} - ${endTime}`;
    }
    return `${startDate} ${startTime} - ${endDate} ${endTime}`;
  }

  function publicEventStatusLabel(status: EventItem["status"]) {
    if (status === "Published") {
      return "已開放報名";
    }
    if (status === "Closed") {
      return "已結束";
    }
    return "尚未開放";
  }

  function splitDateTime(value: string) {
    if (!value) {
      return { date: "", hour: "", minute: "" };
    }
    const parts = value.split("T");
    if (parts.length !== 2) {
      return { date: "", hour: "", minute: "" };
    }
    const [datePart, timePart] = parts;
    const timeParts = timePart.split(":");
    return {
      date: datePart,
      hour: timeParts[0] ?? "",
      minute: timeParts[1] ?? "",
    };
  }

  function buildDateTime(date: string, hour: string, minute: string) {
    if (!date || !hour || !minute) {
      return "";
    }
    const pad = (value: string) => value.padStart(2, "0");
    return `${date}T${pad(hour)}:${pad(minute)}`;
  }

  function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    );
  }

  function formatDateInput(value: string) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) {
      return "";
    }
    const pad = (num: number) => String(num).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  }

  function privacyLabel(level: PrayerItem["privacy_level"]) {
    switch (level) {
      case "Private":
        return "私人代禱";
      case "Public":
        return "公開代禱";
      default:
        return "小組代禱";
    }
  }

  const dashboardSection = (
    <section className="section member-dashboard">
      <div className="section-header">
        <div>
          <p className="eyebrow">會員中心</p>
          <h2>你的個人牧養儀表板</h2>
        </div>
        <button className="button outline small" onClick={handleOpenProfileModal}>
          編輯我的資訊
        </button>
      </div>
      <div className="dashboard-grid">
        <article className="dashboard-card">
          <p className="card-title">每日金句</p>
          <h3>「{summaryData.daily_verse.text}」</h3>
          <p className="muted">{summaryData.daily_verse.reference}</p>
        </article>
        <article className="dashboard-card qr-card">
          <p className="card-title">個人簽到 QR</p>
          <div className="qr-box">
            <div className="qr-grid" />
          </div>
          <p className="muted">{summaryData.checkin_qr_hint}</p>
        </article>
        <article className="dashboard-card">
          <p className="card-title">快速入口</p>
          <div className="chip-row">
            {quickActions.map((item) => (
              <span key={item} className="action-chip">
                {item}
              </span>
            ))}
          </div>
        </article>
        <article className="dashboard-card">
          <p className="card-title">我的奉獻</p>
          <p className="masked">{summaryData.giving_masked}</p>
          <p className="muted">{summaryData.giving_last}</p>
          <button className="text-link">查看明細 →</button>
        </article>
        <article className="dashboard-card">
          <p className="card-title">我的報名</p>
          <ul className="simple-list">
            {summaryData.registrations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button className="text-link">查看全部 →</button>
        </article>
        <article className="dashboard-card">
          <p className="card-title">我的代禱</p>
          <p className="muted">{summaryData.prayer_message}</p>
          <button className="text-link">查看代禱 →</button>
        </article>
        <article className="dashboard-card">
          <p className="card-title">小組資訊</p>
          <p className="muted">
            {summaryData.group_name} · {summaryData.group_schedule}
          </p>
          <p className="muted">帶領人：{summaryData.group_leader}</p>
        </article>
        {isStaff && (
          <article className="dashboard-card">
            <p className="card-title">牧養通知</p>
            <ul className="simple-list">
              {summaryData.notifications.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        )}
        <article className="dashboard-card">
          <p className="card-title">近期動態</p>
          <ul className="simple-list">
            {summaryData.recent_activity.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );

  return (
    <div className={`page ${mobilePreview ? "mobile-preview" : ""}`} style={themeStyle}>
      <div className="page-inner">
        <div className="ambient">
          <span className="orb orb-one" />
          <span className="orb orb-two" />
          <span className="orb orb-three" />
        </div>

        <header className="topbar">
          <div className="brand">
            <div className="brand-logo-wrap">
              <img className="brand-logo" src="/logo-生命河.jpg" alt="生命河教會 Logo" />
            </div>
          </div>
          <nav className="nav">
          <button
            className={`nav-link ${activeView === "home" ? "active" : ""}`}
            onClick={() => setActiveView("home")}
          >
            首頁
</button>
                    <button
            className={`nav-link ${activeView === "events" ? "active" : ""}`}
            onClick={() => setActiveView("events")}
          >
            活動
          </button>
          <button className="nav-link">小組</button>
          <button
            className={`nav-link ${activeView === "prayers" ? "active" : ""}`}
            onClick={() => setActiveView("prayers")}
          >
            代禱
          </button>
          <button
            className={`nav-link ${activeView === "care" ? "active" : ""}`}
            onClick={() => setActiveView("care")}
          >
            關懷
          </button>
          {isStaff && (
            <button
              className={`nav-link ${activeView === "admin" ? "active" : ""}`}
              onClick={() => setActiveView("admin")}
            >
              後台
            </button>
          )}
          <button
            className={`nav-link ${activeView === "member" ? "active" : ""}`}
            onClick={() => {
              if (token) {
                setActiveView("member");
              } else {
                setIsLoginOpen(true);
              }
            }}
          >
            會員中心
          </button>
          </nav>
          <div className="topbar-actions">
            <button
              className="button outline small"
              onClick={() => setMobilePreview((prev) => !prev)}
            >
              {mobilePreview ? "退出手機預覽" : "手機預覽"}
            </button>
            {token ? (
              <div className="user-bar">
                <div className="user-chip">
                  <p className="user-name">
                    {currentUser?.full_name || currentUser?.email || loginEmail || "已登入"}
                  </p>
                  <p className="user-role">
                    {currentUser ? roleLabelMap[currentUser.role] : "會員"}
                  </p>
                </div>
                <button className="button ghost" onClick={handleLogout}>
                  登出
                </button>
              </div>
            ) : (
              <button
                className="button ghost"
                onClick={() => {
                  setAuthMode("login");
                  setIsLoginOpen(true);
                }}
              >
                登入/註冊
              </button>
            )}
          </div>
        </header>

      {isLoginOpen && (
        <div className="modal">
          <div className="modal-backdrop" onClick={() => setIsLoginOpen(false)} />
          <div className="modal-panel">
            <div className="modal-tabs">
              <button
                className={`tab-button ${authMode === "login" ? "active" : ""}`}
                onClick={() => setAuthMode("login")}
              >
                登入
              </button>
              <button
                className={`tab-button ${authMode === "register" ? "active" : ""}`}
                onClick={() => setAuthMode("register")}
              >
                註冊
              </button>
            </div>
            {authMode === "login" ? (
              <>
                <h3>會員登入</h3>
                <p className="muted">使用你的生命河通行證登入</p>
                <form className="modal-form" onSubmit={handleLogin}>
                  <label className="field">
                    Email
                    <input
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    密碼
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                    />
                  </label>
                  <button className="button primary" type="submit">
                    登入
                  </button>
                  {loginMessage && <p className="muted">{loginMessage}</p>}
                </form>
              </>
            ) : (
              <>
                <h3>建立帳號</h3>
                <p className="muted">完成註冊即可登入會員中心</p>
                <form className="modal-form" onSubmit={handleRegister}>
                  <label className="field">
                    姓名
                    <input
                      value={registerName}
                      onChange={(event) => setRegisterName(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    Email
                    <input
                      value={registerEmail}
                      onChange={(event) => setRegisterEmail(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    密碼
                    <input
                      type="password"
                      value={registerPassword}
                      onChange={(event) => setRegisterPassword(event.target.value)}
                    />
                  </label>
                  <button className="button primary" type="submit">
                    註冊
                  </button>
                  {registerMessage && <p className="muted">{registerMessage}</p>}
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {activeView === "home" && (
        <>
          <section className="hero">
            <div className="hero-content">
              <p className="eyebrow">中心總站 · 牧養管理入口</p>
              <h1>讓城市被愛點亮，讓關懷有脈絡。</h1>
              <p className="lead">{activeSite.tagline}</p>
              <div className="cta-row">
                <button className="button primary">立即奉獻</button>
                <button className="button outline">活動報名</button>
                <button className="button ghost">提報代禱</button>
              </div>
              <div className="stats">
                <div>
                  <p className="stat-number">4</p>
                  <p className="stat-label">跨站點牧養網絡</p>
                </div>
                <div>
                  <p className="stat-number">120+</p>
                  <p className="stat-label">本月活動與聚會</p>
                </div>
                <div>
                  <p className="stat-number">24/7</p>
                  <p className="stat-label">代禱關懷不中斷</p>
                </div>
              </div>
            </div>
            <div className="hero-media">
              <div className="hero-card">
                <p className="hero-card-title">本週主日</p>
                <p className="hero-card-heading">信心的節奏與城市的盼望</p>
                <div className="hero-card-footer">
                  <span>9:00 / 11:00 / 19:00</span>
                  <span className="pill">現場 + 線上直播</span>
                </div>
              </div>
              <div className="glass-panel">
                <p className="panel-title">分站切換</p>
                <div className="site-switcher">
                  {sites.map((site) => (
                    <button
                      key={site.id}
                      className={`site-chip ${site.id === activeSiteId ? "active" : ""}`}
                      onClick={() => setActiveSiteId(site.id)}
                      style={{ "--chip": site.accent } as React.CSSProperties}
                      aria-pressed={site.id === activeSiteId}
                    >
                      <span className="chip-dot" />
                      <span>{site.name}</span>
                    </button>
                  ))}
                </div>
                <p className="panel-note">
                  切換分站會同步更新色系與活動內容。
                </p>
              </div>
            </div>
          </section>

          <section className="section verse-section">
            <div className="panel verse-panel">
              <div>
                <p className="eyebrow">本週金句</p>
                <p className="muted">分站：{activeSite.name}</p>
                {weeklyVerse?.week_start && (
                  <p className="muted">週日日期：{formatWeekStartDate(weeklyVerse.week_start)}</p>
                )}
                <h2>「{homeVerse.text}」</h2>
                <p className="muted">{homeVerse.reference}</p>
              </div>
            </div>
          </section>

          <section className="section week-events">
            <div className="section-header">
              <div>
                <p className="eyebrow">近期活動</p>
                <h2>立即投入，找到你的下一場相遇</h2>
              </div>
              <button
                className="button outline small"
                onClick={() => setActiveView("events")}
              >
                查看全部
              </button>
            </div>
            <div className="week-grid">
              {weekEventItems.length ? (
                weekEventItems.map((event, index) => (
                  <article
                    key={event.id}
                    className="week-card"
                    style={{ "--delay": `${index * 0.08}s` } as React.CSSProperties}
                  >
                    <div className="week-card-body">
                      <div className="week-card-header">
                        <div>
                          <span className="pill">{event.status}</span>
                          <h3>{event.title}</h3>
                        </div>
                        <button className="text-link">快速報名 →</button>
                      </div>
                      <div className="week-meta">
                        <span>分站：{event.location}</span>
                        <span>時間：{event.date}</span>
                        {event.description && <span>說明：{event.description}</span>}
                        <span>名額：{event.capacity ?? "不限"}</span>
                      </div>
                    </div>
                    <div className="week-card-media">
                      {event.posterUrl ? (
                        <img src={event.posterUrl} alt={`${event.title} 海報`} />
                      ) : (
                        <div className="week-card-placeholder">
                          <span>無海報</span>
                        </div>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="week-empty muted">目前尚無已發布的近期活動。</div>
              )}
            </div>
          </section>

          <section className="section member-preview">
            <div className="panel preview-panel">
              <div>
                <p className="eyebrow">會員中心</p>
                <h2>專屬的奉獻、報名、代禱入口</h2>
                <p className="muted">
                  登入後即可查看簽到 QR、奉獻紀錄、活動報名與代禱回應。
                </p>
              </div>
              <button
                className="button primary"
                onClick={() => {
                  if (token) {
                    setActiveView("member");
                  } else {
                    setIsLoginOpen(true);
                  }
                }}
              >
                {token ? "進入會員中心" : "登入查看"}
              </button>
            </div>
          </section>

          <section className="section split">
            <div className="panel">
              <p className="eyebrow">牧養入口</p>
              <h2>從代禱到關懷，讓每段生命旅程被記錄</h2>
              <p className="lead muted">
                會員中心整合奉獻、報名、代禱與關懷紀錄，讓牧養更即時、更有溫度。
              </p>
              <div className="pill-row">
                {ministries.map((item) => (
                  <div key={item.title} className="mini-card">
                    <p className="mini-title">{item.title}</p>
                    <p className="muted">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel highlight">
              <p className="eyebrow">代禱牆</p>
              <h3>今天已有 268 位肢體為你同心禱告</h3>
              <p className="muted">
                即時互動與阿們計數，讓關懷訊息不再孤單。
              </p>
              <button className="button primary">前往代禱牆</button>
            </div>
          </section>

          <section className="section">
            <div className="section-header">
              <div>
                <p className="eyebrow">最新消息</p>
                <h2>你關心的消息，都在這裡更新</h2>
              </div>
            </div>
            <div className="news-grid">
              {news.map((item, index) => (
                <div
                  key={item.title}
                  className="news-card"
                  style={{ "--delay": `${index * 0.1}s` } as React.CSSProperties}
                >
                  <h3>{item.title}</h3>
                  <p className="muted">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="section cta">
            <div>
              <h2>建立屬於你的靈命旅程儀表板</h2>
              <p className="muted">
                登入會員中心，管理奉獻、活動與代禱紀錄，讓每一次參與更有方向。
              </p>
            </div>
            <div className="cta-actions">
              <button className="button primary">加入會員</button>
              <button className="button outline">聯絡我們</button>
            </div>
          </section>
        </>
      )}

      {activeView === "member" && (
        <>
          <section className="section member-hero">
            <div>
              <p className="eyebrow">會員中心</p>
              <h2>歡迎回來{currentUser?.full_name ? `，${currentUser.full_name}` : ""}</h2>
              <p className="muted">
                身份：{currentUser ? roleLabelMap[currentUser.role] : "會員"}
              </p>
            </div>
            <div className="member-actions">
              <button className="button primary">查看奉獻</button>
              <button className="button outline">活動報名</button>
              <button className="button ghost">提報代禱</button>
            </div>
          </section>
          {dashboardSection}
        </>
      )}

      {activeView === "events" && (
        <section className="section page-view">
          <div className="section-header">
            <div>
              <p className="eyebrow">活動報名</p>
              <h2>近期活動與開放報名</h2>
            </div>
          </div>
          <div className="panel events-filters">
            <div className="filter-bar">
              <input
                placeholder="搜尋活動名稱"
                value={eventQuery}
                onChange={(event) => setEventQuery(event.target.value)}
              />
              <select value={eventStatus} onChange={(event) => setEventStatus(event.target.value)}>
                <option value="">全部狀態</option>
                <option value="Published">已開放</option>
                <option value="Draft">草稿</option>
                <option value="Closed">已結束</option>
              </select>
              <select value={eventSite} onChange={(event) => setEventSite(event.target.value)}>
                <option value="">全部分站</option>
                <option value="11111111-1111-1111-1111-111111111111">生命河中心</option>
                <option value="22222222-2222-2222-2222-222222222222">光復教會</option>
                <option value="33333333-3333-3333-3333-333333333333">第二教會</option>
                <option value="44444444-4444-4444-4444-444444444444">府中教會</option>
              </select>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={eventUpcomingOnly}
                  onChange={(event) => setEventUpcomingOnly(event.target.checked)}
                />
                只看未來活動
              </label>
              <select value={eventSortBy} onChange={(event) => setEventSortBy(event.target.value)}>
                <option value="start_at">依日期</option>
                <option value="created_at">依建立時間</option>
                <option value="title">依名稱</option>
              </select>
              <select value={eventSortDir} onChange={(event) => setEventSortDir(event.target.value)}>
                <option value="asc">升冪</option>
                <option value="desc">降冪</option>
              </select>
              <select
                value={eventLimit}
                onChange={(event) => setEventLimit(Number(event.target.value))}
              >
                <option value={6}>每頁 6 筆</option>
                <option value={12}>每頁 12 筆</option>
                <option value={24}>每頁 24 筆</option>
              </select>
            </div>
          </div>
          {viewMessage && <p className="muted">{viewMessage}</p>}
          <div className="pager">
            <button
              className="button outline small"
              onClick={() => setEventOffset(Math.max(0, eventOffset - eventLimit))}
            >
              上一頁
            </button>
            <span className="muted">第 {Math.floor(eventOffset / eventLimit) + 1} 頁</span>
            <button
              className="button outline small"
              onClick={() => setEventOffset(eventOffset + eventLimit)}
            >
              下一頁
            </button>
          </div>
          <div className="events-list">
            <div className="week-grid">
              {eventsList.map((event, index) => (
                <article
                  key={event.id}
                  className="week-card"
                  style={{ "--delay": `${index * 0.05}s` } as React.CSSProperties}
                >
                  <div className="week-card-body">
                    <div className="week-card-header">
                      <div>
                        <span className="pill">{event.status}</span>
                        <h3>{event.title}</h3>
                      </div>
                      <button className="text-link">報名詳情 →</button>
                    </div>
                    <div className="week-meta">
                      <span>分站：{event.location}</span>
                      <span>時間：{event.date}</span>
                      {event.description && <span>說明：{event.description}</span>}
                      <span>名額：{event.capacity ?? "不限"}</span>
                    </div>
                  </div>
                  <div className="week-card-media">
                    {event.posterUrl ? (
                      <img src={event.posterUrl} alt={`${event.title} 海報`} />
                    ) : (
                      <div className="week-card-placeholder">
                        <span>無海報</span>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {activeView === "prayers" && (
        <section className="section page-view">
          <div className="section-header">
            <div>
              <p className="eyebrow">代禱牆</p>
              <h2>一起守望的禱告牆</h2>
            </div>
            <button className="button primary small">提報代禱</button>
          </div>
          <form className="panel form-panel" onSubmit={handleCreatePrayer}>
            <h3>提報代禱</h3>
            <div className="form-grid">
              <label className="field field-full">
                代禱內容
                <textarea
                  rows={3}
                  required
                  value={prayerForm.content}
                  onChange={(event) =>
                    setPrayerForm((prev) => ({ ...prev, content: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                隱私等級
                <select
                  value={prayerForm.privacyLevel}
                  onChange={(event) =>
                    setPrayerForm((prev) => ({ ...prev, privacyLevel: event.target.value }))
                  }
                >
                  <option value="Public">公開代禱</option>
                  <option value="Group">小組代禱</option>
                  <option value="Private">私人代禱</option>
                </select>
              </label>
              <label className="field">
                分站
                <select
                  value={prayerForm.siteId}
                  onChange={(event) =>
                    setPrayerForm((prev) => ({ ...prev, siteId: event.target.value }))
                  }
                >
                  <option value="">未指定</option>
                  <option value="11111111-1111-1111-1111-111111111111">生命河中心</option>
                  <option value="22222222-2222-2222-2222-222222222222">光復教會</option>
                  <option value="33333333-3333-3333-3333-333333333333">第二教會</option>
                  <option value="44444444-4444-4444-4444-444444444444">府中教會</option>
                </select>
              </label>
            </div>
            <button className="button primary" type="submit">
              送出代禱
            </button>
          </form>
          <div className="filter-bar">
            <input
              placeholder="搜尋代禱內容"
              value={prayerQuery}
              onChange={(event) => setPrayerQuery(event.target.value)}
            />
            <select
              value={prayerPrivacy}
              onChange={(event) => setPrayerPrivacy(event.target.value)}
            >
              <option value="">全部隱私等級</option>
              <option value="Public">公開代禱</option>
              <option value="Group">小組代禱</option>
              <option value="Private">私人代禱</option>
            </select>
            <select value={prayerSite} onChange={(event) => setPrayerSite(event.target.value)}>
              <option value="">全部分站</option>
              <option value="11111111-1111-1111-1111-111111111111">生命河中心</option>
              <option value="22222222-2222-2222-2222-222222222222">光復教會</option>
              <option value="33333333-3333-3333-3333-333333333333">第二教會</option>
              <option value="44444444-4444-4444-4444-444444444444">府中教會</option>
            </select>
            <select value={prayerSortBy} onChange={(event) => setPrayerSortBy(event.target.value)}>
              <option value="created_at">依時間</option>
              <option value="amen_count">依阿們數</option>
            </select>
            <select
              value={prayerSortDir}
              onChange={(event) => setPrayerSortDir(event.target.value)}
            >
              <option value="desc">降冪</option>
              <option value="asc">升冪</option>
            </select>
            <select
              value={prayerLimit}
              onChange={(event) => setPrayerLimit(Number(event.target.value))}
            >
              <option value={6}>每頁 6 筆</option>
              <option value={12}>每頁 12 筆</option>
              <option value={24}>每頁 24 筆</option>
            </select>
          </div>
          {viewMessage && <p className="muted">{viewMessage}</p>}
          <div className="pager">
            <button
              className="button outline small"
              onClick={() => setPrayerOffset(Math.max(0, prayerOffset - prayerLimit))}
            >
              上一頁
            </button>
            <span className="muted">第 {Math.floor(prayerOffset / prayerLimit) + 1} 頁</span>
            <button
              className="button outline small"
              onClick={() => setPrayerOffset(prayerOffset + prayerLimit)}
            >
              下一頁
            </button>
          </div>
          <div className="prayer-grid">
            {prayerList.map((item) => (
              <article key={item.id} className="prayer-card">
                <h3>{item.title}</h3>
                <p className="muted">{item.content}</p>
                <div className="prayer-footer">
                  <span className="pill">阿們 {item.amen}</span>
                  <button className="text-link">同心禱告 →</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeView === "care" && (
        <section className="section page-view">
          <div className="section-header">
            <div>
              <p className="eyebrow">關懷 CRM</p>
              <h2>牧養對象與關懷紀錄</h2>
            </div>
            <button className="button outline small">新增關懷</button>
          </div>
          {isStaff ? (
            <>
              <div className="filter-bar">
                <input
                  placeholder="搜尋姓名"
                  value={careQuery}
                  onChange={(event) => setCareQuery(event.target.value)}
                />
                <select value={careStatus} onChange={(event) => setCareStatus(event.target.value)}>
                  <option value="">全部狀態</option>
                  <option value="Active">進行中</option>
                  <option value="Paused">暫停</option>
                  <option value="Closed">結案</option>
                </select>
                <select value={careSite} onChange={(event) => setCareSite(event.target.value)}>
                  <option value="">全部分站</option>
                  <option value="11111111-1111-1111-1111-111111111111">生命河中心</option>
                  <option value="22222222-2222-2222-2222-222222222222">光復教會</option>
                  <option value="33333333-3333-3333-3333-333333333333">第二教會</option>
                  <option value="44444444-4444-4444-4444-444444444444">府中教會</option>
                </select>
                <select value={careSortBy} onChange={(event) => setCareSortBy(event.target.value)}>
                  <option value="created_at">依時間</option>
                  <option value="name">依姓名</option>
                </select>
                <select
                  value={careSortDir}
                  onChange={(event) => setCareSortDir(event.target.value)}
                >
                  <option value="desc">降冪</option>
                  <option value="asc">升冪</option>
                </select>
                <select
                  value={careLimit}
                  onChange={(event) => setCareLimit(Number(event.target.value))}
                >
                  <option value={6}>每頁 6 筆</option>
                  <option value={12}>每頁 12 筆</option>
                  <option value={24}>每頁 24 筆</option>
                </select>
              </div>
              <form className="panel form-panel" onSubmit={handleCreateCareSubject}>
                <h3>新增關懷對象</h3>
                <div className="form-grid">
                  <label className="field">
                    姓名
                    <input
                      required
                      value={careForm.name}
                      onChange={(event) =>
                        setCareForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    類型
                    <select
                      value={careForm.subjectType}
                      onChange={(event) =>
                        setCareForm((prev) => ({ ...prev, subjectType: event.target.value }))
                      }
                    >
                      <option value="Member">正式會友</option>
                      <option value="Seeker">慕道友</option>
                      <option value="Family">家屬</option>
                      <option value="Community">社區朋友</option>
                    </select>
                  </label>
                  <label className="field">
                    狀態
                    <select
                      value={careForm.status}
                      onChange={(event) =>
                        setCareForm((prev) => ({ ...prev, status: event.target.value }))
                      }
                    >
                      <option value="Active">進行中</option>
                      <option value="Paused">暫停</option>
                      <option value="Closed">結案</option>
                    </select>
                  </label>
                  <label className="field">
                    分站
                    <select
                      value={careForm.siteId}
                      onChange={(event) =>
                        setCareForm((prev) => ({ ...prev, siteId: event.target.value }))
                      }
                    >
                      <option value="">未指定</option>
                      <option value="11111111-1111-1111-1111-111111111111">生命河中心</option>
                      <option value="22222222-2222-2222-2222-222222222222">光復教會</option>
                      <option value="33333333-3333-3333-3333-333333333333">第二教會</option>
                      <option value="44444444-4444-4444-4444-444444444444">府中教會</option>
                    </select>
                  </label>
                </div>
                <button className="button primary" type="submit">
                  建立關懷對象
                </button>
              </form>
              {viewMessage && <p className="muted">{viewMessage}</p>}
              <div className="pager">
                <button
                  className="button outline small"
                  onClick={() => setCareOffset(Math.max(0, careOffset - careLimit))}
                >
                  上一頁
                </button>
                <span className="muted">第 {Math.floor(careOffset / careLimit) + 1} 頁</span>
                <button
                  className="button outline small"
                  onClick={() => setCareOffset(careOffset + careLimit)}
                >
                  下一頁
                </button>
              </div>
              <div className="care-grid">
                {careList.map((subject) => (
                  <article key={subject.id} className="care-card">
                  <h3>{subject.name}</h3>
                  <p className="muted">狀態：{subject.status}</p>
                  <p className="muted">最近關懷：{subject.last}</p>
                  <button className="text-link">查看紀錄 →</button>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="panel access-panel">
              <h3>此區僅限同工與小組長</h3>
              <p className="muted">請使用具備牧養權限的帳號登入。</p>
              <button className="button primary" onClick={() => setIsLoginOpen(true)}>
                重新登入
              </button>
            </div>
          )}
        </section>
      )}

      {activeView === "admin" && (
        <section className="section page-view">
          <div className="section-header">
            <div>
              <p className="eyebrow">後台管理</p>
              <h2>代禱 / 會員 / 活動 管理入口</h2>
            </div>
          </div>
          <div className="panel form-panel">
            <h3>本週金句設定</h3>
            <form className="form-grid" onSubmit={handleUpdateWeeklyVerse}>
              <label className="field">
                分站
                <select
                  value={weeklyVerseSiteId}
                  onChange={(event) =>
                    setWeeklyVerseForm((prev) => ({ ...prev, siteId: event.target.value }))
                  }
                  disabled={weeklyVerseSiteLocked}
                >
                  <option value="11111111-1111-1111-1111-111111111111">生命河中心</option>
                  <option value="22222222-2222-2222-2222-222222222222">光復教會</option>
                  <option value="33333333-3333-3333-3333-333333333333">第二教會</option>
                  <option value="44444444-4444-4444-4444-444444444444">府中教會</option>
                </select>
              </label>
              <label className="field">
                週日日期
                <input
                  type="date"
                  value={weeklyVerseForm.weekStart}
                  onChange={(event) =>
                    setWeeklyVerseForm((prev) => ({ ...prev, weekStart: event.target.value }))
                  }
                />
              </label>
              <label className="field field-full">
                金句內容
                <textarea
                  rows={3}
                  value={weeklyVerseForm.text}
                  onChange={(event) =>
                    setWeeklyVerseForm((prev) => ({ ...prev, text: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                經文出處
                <input
                  value={weeklyVerseForm.reference}
                  onChange={(event) =>
                    setWeeklyVerseForm((prev) => ({ ...prev, reference: event.target.value }))
                  }
                />
              </label>
              <div className="field">
                <button className="button primary" type="submit">
                  {weeklyVerseEditingId ? "更新金句" : "新增金句"}
                </button>
              </div>
            </form>
            {weeklyVerseMessage && <p className="muted">{weeklyVerseMessage}</p>}
            <div className="weekly-verse-list">
              {weeklyVerseList.length ? (
                weeklyVerseList.map((item) => (
                  <div key={item.id} className="weekly-verse-item">
                    <div>
                      <p className="muted">週日：{formatWeekStartDate(item.week_start)}</p>
                      <p>「{item.text}」</p>
                      <p className="muted">{item.reference}</p>
                    </div>
                    <div className="button-row">
                      <button
                        className="button outline small"
                        onClick={() => handleEditWeeklyVerse(item)}
                      >
                        編輯
                      </button>
                      <button
                        className="button ghost small"
                        onClick={() => handleDeleteWeeklyVerse(item.id)}
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="muted">尚無金句紀錄。</p>
              )}
            </div>
          </div>
          <div className="admin-tabs">
            <button
              className={`tab-button ${adminTab === "prayers" ? "active" : ""}`}
              onClick={() => setAdminTab("prayers")}
            >
              代禱管理
            </button>
            <button
              className={`tab-button ${adminTab === "members" ? "active" : ""}`}
              onClick={() => setAdminTab("members")}
            >
              會員管理
            </button>
            <button
              className={`tab-button ${adminTab === "events" ? "active" : ""}`}
              onClick={() => setAdminTab("events")}
            >
              活動管理
            </button>
          </div>

          {adminTab === "prayers" && (
            <>
              <div className="panel form-panel">
                <h3>審核代禱</h3>
                <div className="filter-bar">
                  <input
                    placeholder="搜尋代禱內容"
                    value={adminPrayerQuery}
                    onChange={(event) => setAdminPrayerQuery(event.target.value)}
                  />
                  <select
                    value={adminPrayerPrivacy}
                    onChange={(event) => setAdminPrayerPrivacy(event.target.value)}
                  >
                    <option value="">全部隱私等級</option>
                    <option value="Public">公開代禱</option>
                    <option value="Group">小組代禱</option>
                    <option value="Private">私人代禱</option>
                  </select>
                  <select
                    value={adminPrayerSite}
                    onChange={(event) => setAdminPrayerSite(event.target.value)}
                  >
                    <option value="">全部分站</option>
                    <option value="11111111-1111-1111-1111-111111111111">生命河中心</option>
                    <option value="22222222-2222-2222-2222-222222222222">光復教會</option>
                    <option value="33333333-3333-3333-3333-333333333333">第二教會</option>
                    <option value="44444444-4444-4444-4444-444444444444">府中教會</option>
                  </select>
                  <select
                    value={adminPrayerSortBy}
                    onChange={(event) => setAdminPrayerSortBy(event.target.value)}
                  >
                    <option value="created_at">依時間</option>
                    <option value="amen_count">依阿們數</option>
                  </select>
                  <select
                    value={adminPrayerSortDir}
                    onChange={(event) => setAdminPrayerSortDir(event.target.value)}
                  >
                    <option value="desc">降冪</option>
                    <option value="asc">升冪</option>
                  </select>
                  <select
                    value={adminPrayerLimit}
                    onChange={(event) => setAdminPrayerLimit(Number(event.target.value))}
                  >
                    <option value={6}>每頁 6 筆</option>
                    <option value={12}>每頁 12 筆</option>
                    <option value={24}>每頁 24 筆</option>
                  </select>
                </div>
                {adminMessage && <p className="muted">{adminMessage}</p>}
                <div className="pager">
                  <button
                    className="button outline small"
                    onClick={() =>
                      setAdminPrayerOffset(Math.max(0, adminPrayerOffset - adminPrayerLimit))
                    }
                  >
                    上一頁
                  </button>
                  <span className="muted">
                    第 {Math.floor(adminPrayerOffset / adminPrayerLimit) + 1} 頁
                  </span>
                  <button
                    className="button outline small"
                    onClick={() => setAdminPrayerOffset(adminPrayerOffset + adminPrayerLimit)}
                  >
                    下一頁
                  </button>
                </div>
                <div className="prayer-grid">
                  {(adminPrayers || []).map((item) => (
                    <article key={item.id} className="prayer-card">
                      <h3>{privacyLabel(item.privacy_level)}</h3>
                      <p className="muted">{item.content}</p>
                      <div className="prayer-footer">
                        <span className="pill">狀態 {item.status}</span>
                        <div className="button-row">
                          <button
                            className="button outline small"
                            onClick={() => handleUpdatePrayerStatus(item.id, "Approved")}
                          >
                            通過
                          </button>
                          <button
                            className="button ghost small"
                            onClick={() => handleUpdatePrayerStatus(item.id, "Archived")}
                          >
                            封存
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              <div className="panel form-panel">
                <h3>我的代禱 / 代禱清單</h3>
                <p className="muted">此區預留：我的代禱管理與代禱清單輸出。</p>
              </div>
            </>
          )}

          {adminTab === "events" && (
            <div className="panel form-panel">
              <div className="panel-header">
                <h3>活動管理</h3>
                <button className="button outline small" onClick={() => handleOpenEventModal()}>
                  新增活動
                </button>
              </div>
              <div className="event-filter-grid form-grid">
                <label className="field">
                  搜尋活動名稱
                  <input
                    placeholder="輸入關鍵字"
                    value={eventQuery}
                    onChange={(event) => setEventQuery(event.target.value)}
                  />
                </label>
                <label className="field">
                  活動狀態
                  <select value={eventStatus} onChange={(event) => setEventStatus(event.target.value)}>
                    <option value="">全部狀態</option>
                    <option value="Published">已發布</option>
                    <option value="Draft">草稿</option>
                    <option value="Closed">已結束</option>
                  </select>
                </label>
                <label className="field">
                  分站
                  <select value={eventSite} onChange={(event) => setEventSite(event.target.value)}>
                    <option value="">全部分站</option>
                    <option value="11111111-1111-1111-1111-111111111111">生命河中心</option>
                    <option value="22222222-2222-2222-2222-222222222222">光復教會</option>
                    <option value="33333333-3333-3333-3333-333333333333">第二教會</option>
                    <option value="44444444-4444-4444-4444-444444444444">府中教會</option>
                  </select>
                </label>
                <label className="field">
                  排序依據
                  <select value={eventSortBy} onChange={(event) => setEventSortBy(event.target.value)}>
                    <option value="start_at">依日期</option>
                    <option value="created_at">依建立時間</option>
                    <option value="title">依名稱</option>
                  </select>
                </label>
                <label className="field">
                  排序方向
                  <select value={eventSortDir} onChange={(event) => setEventSortDir(event.target.value)}>
                    <option value="asc">升冪</option>
                    <option value="desc">降冪</option>
                  </select>
                </label>
                <label className="field">
                  每頁顯示
                  <select
                    value={eventLimit}
                    onChange={(event) => setEventLimit(Number(event.target.value))}
                  >
                    <option value={6}>每頁 6 筆</option>
                    <option value={12}>每頁 12 筆</option>
                    <option value={24}>每頁 24 筆</option>
                    <option value={50}>每頁 50 筆</option>
                  </select>
                </label>
              </div>
              {viewMessage && <p className="muted">{viewMessage}</p>}
              <div className="pager">
                <button
                  className="button outline small"
                  onClick={() => setEventOffset(Math.max(0, eventOffset - eventLimit))}
                >
                  上一頁
                </button>
                <span className="muted">第 {Math.floor(eventOffset / eventLimit) + 1} 頁</span>
                <button
                  className="button outline small"
                  onClick={() => setEventOffset(eventOffset + eventLimit)}
                >
                  下一頁
                </button>
              </div>
              <div className="user-grid event-grid">
                {eventsAdminList.map((event) => (
                  <article key={event.id} className="user-card event-card">
                    <div className="event-card-body">
                      <div>
                        <h3>{event.title}</h3>
                        <p className="muted">{event.date}</p>
                      </div>
                      <p className="muted">狀態：{event.statusLabel}</p>
                      <p className="muted">分站：{event.location}</p>
                      <div className="button-row">
                        {event.statusRaw === "Draft" && (
                          <button
                            className="button small"
                            onClick={() => handlePublishEvent(event.id)}
                          >
                            發布
                          </button>
                        )}
                        <button
                          className="button ghost small"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          刪除
                        </button>
                        <button
                          className="button outline small"
                          onClick={() => handleOpenEventModal(event.id)}
                        >
                          編輯
                        </button>
                      </div>
                    </div>
                    <div
                      className={`poster-thumb ${
                        event.posterUrl ? "" : "poster-thumb-empty"
                      }`}
                    >
                      {event.posterUrl ? (
                        <img src={event.posterUrl} alt={`${event.title} 海報`} />
                      ) : (
                        <span className="muted">無海報</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

        </section>
      )}

      {profileModalOpen && (
        <div className="modal">
          <div className="modal-backdrop" onClick={handleCloseProfileModal} />
          <div className="modal-panel modal-wide">
            <div className="panel-header">
              <h3>編輯我的資訊</h3>
              <button className="button ghost small" onClick={handleCloseProfileModal}>
                關閉
              </button>
            </div>
            {profileMessage && <p className="muted">{profileMessage}</p>}
            <form className="form-grid" onSubmit={handleUpdateProfile}>
              <label className="field">
                姓名
                <input
                  value={profileForm.fullName}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                Email
                <input
                  value={profileForm.email}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                手機
                <input
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </label>
              <label className="field">
                身分
                <select
                  value={profileForm.memberType}
                  onChange={(event) =>
                    setProfileForm((prev) => ({ ...prev, memberType: event.target.value }))
                  }
                >
                  <option value="Member">教友</option>
                  <option value="Seeker">慕道友</option>
                </select>
              </label>
              <div className="field field-full">
                <button className="button primary" type="submit">
                  儲存資料
                </button>
              </div>
            </form>
            <div className="divider" />
            <form className="form-grid" onSubmit={handleChangePassword}>
              <label className="field">
                目前密碼
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field">
                新密碼
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                  }
                />
              </label>
              <div className="field field-full">
                <button className="button outline" type="submit">
                  變更密碼
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {userModalOpen && (
        <div className="modal">
          <div className="modal-backdrop" onClick={handleCloseUserModal} />
          <div className="modal-panel modal-wide">
            <div className="panel-header">
              <h3>會員編輯</h3>
              <button className="button ghost small" onClick={handleCloseUserModal}>
                關閉
              </button>
            </div>
            {selectedUser ? (
              <>
                <p className="muted">ID: {selectedUser.id}</p>
                <p className="muted">Email: {selectedUser.email}</p>
                <form className="form-grid" onSubmit={handleUpdateUser}>
                  <label className="field">
                    姓名
                    <input
                      value={userForm.fullName}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, fullName: event.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    角色
                    <select
                      value={userForm.role}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, role: event.target.value }))
                      }
                    >
                      <option value="Admin">系統管理</option>
                      <option value="CenterStaff">中心同工</option>
                      <option value="BranchStaff">分站同工</option>
                      <option value="Leader">小組長</option>
                      <option value="Member">會員</option>
                    </select>
                  </label>
                  <label className="field">
                    分站
                    <select
                      value={userForm.siteId}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, siteId: event.target.value }))
                      }
                    >
                      <option value="">未指定</option>
                      <option value="11111111-1111-1111-1111-111111111111">生命河中心</option>
                      <option value="22222222-2222-2222-2222-222222222222">光復教會</option>
                      <option value="33333333-3333-3333-3333-333333333333">第二教會</option>
                      <option value="44444444-4444-4444-4444-444444444444">府中教會</option>
                    </select>
                  </label>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={userForm.isActive}
                      onChange={(event) =>
                        setUserForm((prev) => ({ ...prev, isActive: event.target.checked }))
                      }
                    />
                    啟用帳號
                  </label>
                  <div className="field field-full">
                    <button className="button primary" type="submit">
                      儲存變更
                    </button>
                  </div>
                </form>
                <form className="form-grid" onSubmit={handleResetUserPassword}>
                  <label className="field field-full">
                    重設密碼
                    <input
                      type="password"
                      value={resetPassword}
                      onChange={(event) => setResetPassword(event.target.value)}
                    />
                  </label>
                  <div className="field field-full">
                    <button className="button outline" type="submit">
                      送出重設
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <p className="muted">請先從列表選擇會員。</p>
            )}
          </div>
        </div>
      )}

      {eventModalOpen && (
        <div className="modal">
          <div className="modal-backdrop" onClick={handleCloseEventModal} />
          <div className="modal-panel modal-wide event-modal-panel">
            <div className="panel-header">
              <h3>{selectedEventId ? "編輯活動" : "新增活動"}</h3>
              <button className="button ghost small" onClick={handleCloseEventModal}>
                關閉
              </button>
            </div>
            <div className="event-modal-layout">
              <form className="form-grid" onSubmit={handleCreateEvent}>
                <label className="field">
                  活動名稱
                  <input
                    required
                    value={eventForm.title}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  分站
                  <select
                    value={eventForm.siteId}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, siteId: event.target.value }))
                    }
                  >
                    <option value="">未指定</option>
                    <option value="11111111-1111-1111-1111-111111111111">生命河中心</option>
                    <option value="22222222-2222-2222-2222-222222222222">光復教會</option>
                    <option value="33333333-3333-3333-3333-333333333333">第二教會</option>
                    <option value="44444444-4444-4444-4444-444444444444">府中教會</option>
                  </select>
                </label>
                <label className="field">
                  開始時間
                  <div className="time-row">
                    <input
                      type="date"
                      required
                      value={eventStartParts.date}
                      onChange={(event) => {
                        const nextDate = event.target.value;
                        const nextHour = eventStartParts.hour || "00";
                        const nextMinute = eventStartParts.minute || "00";
                        setEventForm((prev) => ({
                          ...prev,
                          startAt: nextDate ? buildDateTime(nextDate, nextHour, nextMinute) : "",
                        }));
                      }}
                    />
                    <select
                      value={eventStartParts.hour}
                      onChange={(event) => {
                        const nextHour = event.target.value;
                        const nextMinute = eventStartParts.minute || "00";
                        if (!eventStartParts.date) {
                          return;
                        }
                        setEventForm((prev) => ({
                          ...prev,
                          startAt: buildDateTime(eventStartParts.date, nextHour, nextMinute),
                        }));
                      }}
                      disabled={!eventStartParts.date}
                    >
                      <option value="">時</option>
                      {eventHourOptions.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                    <select
                      value={eventStartParts.minute}
                      onChange={(event) => {
                        const nextMinute = event.target.value;
                        const nextHour = eventStartParts.hour || "00";
                        if (!eventStartParts.date) {
                          return;
                        }
                        setEventForm((prev) => ({
                          ...prev,
                          startAt: buildDateTime(eventStartParts.date, nextHour, nextMinute),
                        }));
                      }}
                      disabled={!eventStartParts.date}
                    >
                      <option value="">分</option>
                      {eventMinuteOptions.map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <label className="field">
                  結束時間（選填）
                  <div className="time-row">
                    <input
                      type="date"
                      value={eventEndParts.date}
                      onChange={(event) => {
                        const nextDate = event.target.value;
                        if (!nextDate) {
                          setEventForm((prev) => ({ ...prev, endAt: "" }));
                          return;
                        }
                        const nextHour = eventEndParts.hour || "00";
                        const nextMinute = eventEndParts.minute || "00";
                        setEventForm((prev) => ({
                          ...prev,
                          endAt: buildDateTime(nextDate, nextHour, nextMinute),
                        }));
                      }}
                    />
                    <select
                      value={eventEndParts.hour}
                      onChange={(event) => {
                        const nextHour = event.target.value;
                        const nextMinute = eventEndParts.minute || "00";
                        if (!eventEndParts.date) {
                          return;
                        }
                        setEventForm((prev) => ({
                          ...prev,
                          endAt: buildDateTime(eventEndParts.date, nextHour, nextMinute),
                        }));
                      }}
                      disabled={!eventEndParts.date}
                    >
                      <option value="">時</option>
                      {eventHourOptions.map((hour) => (
                        <option key={hour} value={hour}>
                          {hour}
                        </option>
                      ))}
                    </select>
                    <select
                      value={eventEndParts.minute}
                      onChange={(event) => {
                        const nextMinute = event.target.value;
                        const nextHour = eventEndParts.hour || "00";
                        if (!eventEndParts.date) {
                          return;
                        }
                        setEventForm((prev) => ({
                          ...prev,
                          endAt: buildDateTime(eventEndParts.date, nextHour, nextMinute),
                        }));
                      }}
                      disabled={!eventEndParts.date}
                    >
                      <option value="">分</option>
                      {eventMinuteOptions.map((minute) => (
                        <option key={minute} value={minute}>
                          {minute}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>
                <div className="field field-full">
                  <span className="muted time-preview">
                    時間顯示：{eventTimePreview || "請選擇開始時間"}
                  </span>
                </div>
                <label className="field">
                  名額
                  <input
                    type="number"
                    min="1"
                    value={eventForm.capacity}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, capacity: event.target.value }))
                    }
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={eventForm.waitlistEnabled}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, waitlistEnabled: event.target.checked }))
                    }
                  />
                  候補開放
                </label>
                <label className="field">
                  活動狀態
                  <select
                    value={eventForm.status}
                    onChange={(event) =>
                      setEventForm((prev) => ({
                        ...prev,
                        status: event.target.value as EventItem["status"],
                      }))
                    }
                  >
                    <option value="Draft">草稿</option>
                    <option value="Published">已發布</option>
                    <option value="Closed">已結束</option>
                  </select>
                </label>
                <label className="field field-full">
                  說明
                  <textarea
                    rows={6}
                    className="textarea-large"
                    value={eventForm.description}
                    onChange={(event) =>
                      setEventForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                  />
                </label>
                <label className="field field-full">
                  宣傳海報
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setEventPosterFile(file);
                      setEventPosterPreview(file ? URL.createObjectURL(file) : null);
                    }}
                  />
                </label>
                <div className="field field-full">
                  <button className="button primary" type="submit">
                    {selectedEventId ? "更新活動" : "建立活動"}
                  </button>
                </div>
              </form>
              <aside className="event-modal-right">
                <div
                  className={`poster-preview ${
                    eventPosterPreview ? "" : "poster-preview-empty"
                  }`}
                >
                  {eventPosterPreview ? (
                    <img src={eventPosterPreview} alt="活動海報預覽" />
                  ) : (
                    <p className="muted">海報預覽會顯示在這裡</p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        <div>
          <p className="brand-title">生命河基督教會</p>
          <p className="muted">Life River Church · 會員管理系統</p>
        </div>
        <div className="footer-links">
          <a href="#">最新消息</a>
          <a href="#">隱私權說明</a>
          <a href="#">加入同工</a>
        </div>
      </footer>
      </div>
    </div>
  );
}
