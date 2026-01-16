import { useCallback, useEffect, useMemo, useState } from "react";
import {
  API_BASE_URL,
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiUpload,
  LoginResponse,
} from "./api/client";
import EventCard from "./components/EventCard";
import useEvents from "./hooks/useEvents";
import useEventsFilters from "./hooks/useEventsFilters";
import usePrayers from "./hooks/usePrayers";
import useRegistrations from "./hooks/useRegistrations";
import useUserProfile from "./hooks/useUserProfile";
import useWeeklyVerse from "./hooks/useWeeklyVerse";
import RegistrationView from "./views/RegistrationView";
import {
  buildDateTime,
  formatDateLabel,
  formatDateInput,
  formatDateRange,
  formatEventTimePreview,
  formatWeekStartDate,
  getCurrentSundayDate,
  splitDateTime,
} from "./utils/date";
import { resolveSiteName, siteUuidByCode } from "./utils/site";
import { eventStatusLabelMap, roleLabelMap } from "./utils/text";
import { resolveEventStatus } from "./utils/status";

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
  reading_plan?: string | null;
  updated_at: string;
};

type SundayMessage = {
  id: string;
  site_id: string;
  message_date: string;
  title: string;
  speaker?: string | null;
  youtube_url: string;
  description?: string | null;
  created_at: string;
};

type LifeBulletin = {
  id: string;
  site_id: string;
  bulletin_date: string;
  content: string;
  video_url: string | null;
  status: "Draft" | "Published";
  created_at: string;
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

type RegistrationItem = {
  id: string;
  event_id: string;
  ticket_count: number;
  status: string;
  is_proxy: boolean;
  proxy_entries?: {
    name: string;
    phone?: string | null;
    relation?: string | null;
    note?: string | null;
  }[];
  created_at: string;
  updated_at?: string | null;
};

type AdminRegistrationItem = {
  id: string;
  event_id: string;
  event_title: string;
  event_site_id: string;
  event_start_at: string;
  user_id?: string | null;
  user_email?: string | null;
  user_full_name?: string | null;
  user_phone?: string | null;
  user_member_type?: string | null;
  user_role?: string | null;
  status: string;
  ticket_count: number;
  is_proxy: boolean;
  proxy_entries?: {
    name: string;
    phone?: string | null;
    relation?: string | null;
    note?: string | null;
  }[];
  created_at: string;
  updated_at?: string | null;
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

type ActiveView =
  | "home"
  | "member"
  | "events"
  | "prayers"
  | "care"
  | "admin"
  | "registration"
  | "messages"
  | "life-bulletins";

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
  const [activeSiteId, setActiveSiteId] = useState("guangfu");
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
  const [careData, setCareData] = useState<CareSubjectItem[] | null>(null);
  const [weeklyVerseEditingId, setWeeklyVerseEditingId] = useState<string | null>(null);
  const [weeklyVerseForm, setWeeklyVerseForm] = useState({
    siteId: siteUuidByCode.center,
    weekStart: "",
    text: "",
    reference: "",
    readingPlan: "",
  });
  const [weeklyVerseMessage, setWeeklyVerseMessage] = useState("");
  const [homeWeeklyVerses, setHomeWeeklyVerses] = useState<WeeklyVerse[]>([]);
  const [homeSundayMessages, setHomeSundayMessages] = useState<SundayMessage[]>([]);
  const [homeLifeBulletins, setHomeLifeBulletins] = useState<LifeBulletin[]>([]);
  const [sundayMessages, setSundayMessages] = useState<SundayMessage[]>([]);
  const [sundayMessageQuery, setSundayMessageQuery] = useState("");
  const [sundayMessageSite, setSundayMessageSite] = useState("all");
  const [sundayMessageSortBy, setSundayMessageSortBy] = useState("message_date");
  const [sundayMessageSortDir, setSundayMessageSortDir] = useState("desc");
  const [sundayMessageLimit, setSundayMessageLimit] = useState(12);
  const [sundayMessageOffset, setSundayMessageOffset] = useState(0);
  const [adminSundayMessages, setAdminSundayMessages] = useState<SundayMessage[]>([]);
  const [adminSundayMessageLimit, setAdminSundayMessageLimit] = useState(12);
  const [adminSundayMessageOffset, setAdminSundayMessageOffset] = useState(0);
  const [sundayMessageEditingId, setSundayMessageEditingId] = useState<string | null>(null);
  const [sundayMessageForm, setSundayMessageForm] = useState({
    messageDate: "",
    title: "",
    speaker: "",
    youtubeUrl: "",
    description: "",
  });
  const [sundayMessageMessage, setSundayMessageMessage] = useState("");
  const [lifeBulletins, setLifeBulletins] = useState<LifeBulletin[]>([]);
  const [lifeBulletinQuery, setLifeBulletinQuery] = useState("");
  const [lifeBulletinStatus, setLifeBulletinStatus] = useState("");
  const [lifeBulletinSortBy, setLifeBulletinSortBy] = useState("bulletin_date");
  const [lifeBulletinSortDir, setLifeBulletinSortDir] = useState("desc");
  const [lifeBulletinLimit, setLifeBulletinLimit] = useState(10);
  const [lifeBulletinOffset, setLifeBulletinOffset] = useState(0);
  const [lifeBulletinEditingId, setLifeBulletinEditingId] = useState<string | null>(null);
  const [lifeBulletinForm, setLifeBulletinForm] = useState({
    bulletinDate: "",
    content: "",
    videoUrl: "",
    status: "Draft",
  });
  const [lifeBulletinMessage, setLifeBulletinMessage] = useState("");
  const [lifeBulletinVideoFile, setLifeBulletinVideoFile] = useState<File | null>(null);
  const [lifeBulletinPublic, setLifeBulletinPublic] = useState<LifeBulletin[]>([]);
  const [lifeBulletinPublicQuery, setLifeBulletinPublicQuery] = useState("");
  const [lifeBulletinPublicSite, setLifeBulletinPublicSite] = useState("all");
  const [lifeBulletinPublicSortBy, setLifeBulletinPublicSortBy] = useState("bulletin_date");
  const [lifeBulletinPublicSortDir, setLifeBulletinPublicSortDir] = useState("desc");
  const [lifeBulletinPublicLimit, setLifeBulletinPublicLimit] = useState(12);
  const [lifeBulletinPublicOffset, setLifeBulletinPublicOffset] = useState(0);
  const [lifeBulletinDetailOpen, setLifeBulletinDetailOpen] = useState(false);
  const [lifeBulletinDetailItem, setLifeBulletinDetailItem] = useState<LifeBulletin | null>(null);


  const [viewMessage, setViewMessage] = useState("");
  const {
    eventQuery,
    setEventQuery,
    eventStatus,
    setEventStatus,
    eventSite,
    setEventSite,
    eventUpcomingOnly,
    setEventUpcomingOnly,
    eventSortBy,
    setEventSortBy,
    eventSortDir,
    setEventSortDir,
    eventLimit,
    setEventLimit,
    eventOffset,
    setEventOffset,
  } = useEventsFilters();
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
  const [adminMessage, setAdminMessage] = useState("");
  const [adminTab, setAdminTab] = useState<
    "weekly-verse" | "prayers" | "members" | "events" | "messages" | "life-bulletins"
  >("prayers");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventPosterFile, setEventPosterFile] = useState<File | null>(null);
  const [eventPosterPreview, setEventPosterPreview] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [mobilePreview, setMobilePreview] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [postLoginAction, setPostLoginAction] = useState<{ view: ActiveView } | null>(null);
  const [pendingRegistrationEvent, setPendingRegistrationEvent] = useState<EventItem | null>(null);
  const [registrationEvent, setRegistrationEvent] = useState<EventItem | null>(null);
  const [registrationRecord, setRegistrationRecord] = useState<RegistrationItem | null>(null);
  const [registrationAdminOpen, setRegistrationAdminOpen] = useState(false);
  const [registrationAdminEvent, setRegistrationAdminEvent] = useState<EventItem | null>(null);
  const [registrationAdminList, setRegistrationAdminList] = useState<AdminRegistrationItem[]>([]);
  const [registrationAdminQuery, setRegistrationAdminQuery] = useState("");
  const [registrationAdminStatus, setRegistrationAdminStatus] = useState("");
  const [registrationAdminLimit, setRegistrationAdminLimit] = useState(20);
  const [registrationAdminOffset, setRegistrationAdminOffset] = useState(0);
  const [registrationAdminMessage, setRegistrationAdminMessage] = useState("");
  const [registrationAdminEditing, setRegistrationAdminEditing] =
    useState<AdminRegistrationItem | null>(null);
  const [registrationAdminForm, setRegistrationAdminForm] = useState({
    ticketCount: 1,
    isProxy: false,
    status: "Pending",
    proxyEntries: [{ name: "", phone: "", relation: "", note: "" }],
  });
  const [registrationForm, setRegistrationForm] = useState({
    ticketCount: 1,
    isProxy: false,
    proxyEntries: [
      { name: "", phone: "", relation: "", note: "" },
    ],
  });
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationSubmitting, setRegistrationSubmitting] = useState(false);
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
      text: "",
      reference: "",
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
  const {
    currentUser,
    setCurrentUser,
    profileForm,
    setProfileForm,
  } = useUserProfile({
    token,
    setLoginMessage,
    setWeeklyVerseForm,
    weeklyVerseFormSiteId: weeklyVerseForm.siteId,
    centerSiteId: siteUuidByCode.center,
  });
  const currentUserLabel =
    currentUser?.full_name || currentUser?.email || "\u5c1a\u672a\u767b\u5165";
  const staffRoles = new Set<UserProfile["role"]>([
    "Admin",
    "CenterStaff",
    "BranchStaff",
    "Leader",
  ]);
  const isStaff = currentUser ? staffRoles.has(currentUser.role) : false;
  const weeklyVerseSiteId = currentUser?.site_id || weeklyVerseForm.siteId;
  const weeklyVerseSiteLocked = true;
  const sundayMessageSiteId =
    sundayMessageSite === "all" ? null : siteUuidByCode[sundayMessageSite];
  const adminSundayMessageSiteId = currentUser?.site_id || "";
  const buildPrayersPath = useCallback(() => {
    const params = new URLSearchParams();
    if (prayerQuery) params.set("q", prayerQuery);
    if (prayerPrivacy) params.set("privacy_level", prayerPrivacy);
    if (prayerSite) params.set("site_id", prayerSite);
    if (prayerSortBy) params.set("sort_by", prayerSortBy);
    if (prayerSortDir) params.set("sort_dir", prayerSortDir);
    params.set("limit", String(prayerLimit));
    params.set("offset", String(prayerOffset));
    return params.toString() ? `/prayers?${params.toString()}` : "/prayers";
  }, [prayerQuery, prayerPrivacy, prayerSite, prayerSortBy, prayerSortDir, prayerLimit, prayerOffset]);

  const buildCarePath = useCallback(() => {
    const params = new URLSearchParams();
    if (careQuery) params.set("q", careQuery);
    if (careStatus) params.set("status", careStatus);
    if (careSite) params.set("site_id", careSite);
    if (careSortBy) params.set("sort_by", careSortBy);
    if (careSortDir) params.set("sort_dir", careSortDir);
    params.set("limit", String(careLimit));
    params.set("offset", String(careOffset));
    return params.toString() ? `/care/subjects?${params.toString()}` : "/care/subjects";
  }, [careQuery, careStatus, careSite, careSortBy, careSortDir, careLimit, careOffset]);

  const homeLifeBulletin = homeLifeBulletins[0] || null;
  const homeLifeBulletinLines = useMemo(() => {
    if (!homeLifeBulletin?.content) {
      return [];
    }
    return homeLifeBulletin.content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [homeLifeBulletin]);

  const buildAdminPrayersPath = useCallback(() => {
    const params = new URLSearchParams();
    if (adminPrayerQuery) params.set("q", adminPrayerQuery);
    if (adminPrayerPrivacy) params.set("privacy_level", adminPrayerPrivacy);
    if (adminPrayerSite) params.set("site_id", adminPrayerSite);
    if (adminPrayerSortBy) params.set("sort_by", adminPrayerSortBy);
    if (adminPrayerSortDir) params.set("sort_dir", adminPrayerSortDir);
    params.set("limit", String(adminPrayerLimit));
    params.set("offset", String(adminPrayerOffset));
    return params.toString() ? `/prayers/admin?${params.toString()}` : "/prayers/admin";
  }, [
    adminPrayerQuery,
    adminPrayerPrivacy,
    adminPrayerSite,
    adminPrayerSortBy,
    adminPrayerSortDir,
    adminPrayerLimit,
    adminPrayerOffset,
  ]);

  const buildAdminUsersPath = useCallback(() => {
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
  }, [
    adminUserQuery,
    adminUserRole,
    adminUserSite,
    adminUserActive,
    adminUserSortBy,
    adminUserSortDir,
    adminUserLimit,
    adminUserOffset,
  ]);

  const buildSundayMessagesPath = useCallback(() => {
    const params = new URLSearchParams();
    if (sundayMessageQuery) params.set("query", sundayMessageQuery);
    if (sundayMessageSiteId) params.set("site_id", sundayMessageSiteId);
    if (sundayMessageSortBy) params.set("sort_by", sundayMessageSortBy);
    if (sundayMessageSortDir) params.set("sort_dir", sundayMessageSortDir);
    params.set("limit", String(sundayMessageLimit));
    params.set("offset", String(sundayMessageOffset));
    return params.toString()
      ? `/sunday-messages/public?${params.toString()}`
      : "/sunday-messages/public";
  }, [
    sundayMessageQuery,
    sundayMessageSiteId,
    sundayMessageSortBy,
    sundayMessageSortDir,
    sundayMessageLimit,
    sundayMessageOffset,
  ]);

  const buildAdminSundayMessagesPath = useCallback(() => {
    const params = new URLSearchParams();
    if (adminSundayMessageSiteId) params.set("site_id", adminSundayMessageSiteId);
    params.set("limit", String(adminSundayMessageLimit));
    params.set("offset", String(adminSundayMessageOffset));
    return params.toString()
      ? `/sunday-messages?${params.toString()}`
      : "/sunday-messages";
  }, [adminSundayMessageSiteId, adminSundayMessageLimit, adminSundayMessageOffset]);

  const { registrationsData, registrationCountByEvent, setRegistrationsData } =
    useRegistrations(token);
  const {
    prayersData,
    setPrayersData,
    adminPrayers,
    setAdminPrayers,
    prayersError,
    adminPrayersError,
  } = usePrayers({
    activeView,
    token,
    isStaff,
    buildPrayersPath,
    buildAdminPrayersPath,
    publicDeps: [
      prayerQuery,
      prayerPrivacy,
      prayerSite,
      prayerSortBy,
      prayerSortDir,
      prayerLimit,
      prayerOffset,
    ],
    adminDeps: [
      adminPrayerQuery,
      adminPrayerPrivacy,
      adminPrayerSite,
      adminPrayerSortBy,
      adminPrayerSortDir,
      adminPrayerLimit,
      adminPrayerOffset,
    ],
  });
  const { weeklyVerse, weeklyVerseList, setWeeklyVerseList } = useWeeklyVerse({
    activeView,
    homeSiteId: siteUuidByCode[activeSiteId],
    weeklyVerseSiteId,
    token,
    weeklyVerseForm,
    setWeeklyVerseForm,
    setWeeklyVerseMessage,
  });
  const {
    eventsData,
    homeEvents,
    eventsError,
    setEventsData,
    refreshEvents,
  } = useEvents({
    activeView,
    adminTab,
    filters: {
      query: eventQuery,
      status: eventStatus,
      site: eventSite,
      upcomingOnly: eventUpcomingOnly,
      sortBy: eventSortBy,
      sortDir: eventSortDir,
      limit: eventLimit,
      offset: eventOffset,
    },
    homeSiteId: siteUuidByCode[activeSiteId],
  });
  const weekEventItems =
    homeEvents && homeEvents.length
      ? homeEvents
          .filter((event) => event.status !== "Draft")
          .map((event) => {
            const effectiveStatus = resolveEventStatus(event);
            return {
              id: event.id,
              title: event.title,
              date: formatDateRange(event.start_at, event.end_at),
              location: resolveSiteName(event.site_id),
              description: event.description || "",
              capacity: event.capacity,
              status: eventStatusLabelMap[effectiveStatus] || effectiveStatus,
              statusRaw: effectiveStatus,
              registrationCount: registrationCountByEvent[event.id] || 0,
              registered: (registrationCountByEvent[event.id] || 0) > 0,
              posterUrl: resolvePosterUrl(event.poster_url),
            };
          })
      : [];
  const eventsList =
    eventsData && eventsData.length
      ? eventsData.map((event) => {
          const effectiveStatus = resolveEventStatus(event);
          return {
            id: event.id,
            title: event.title,
            date: formatDateRange(event.start_at, event.end_at),
            location: resolveSiteName(event.site_id),
            description: event.description || "",
            capacity: event.capacity,
            status: eventStatusLabelMap[effectiveStatus] || effectiveStatus,
            statusRaw: effectiveStatus,
            registrationCount: registrationCountByEvent[event.id] || 0,
            registered: (registrationCountByEvent[event.id] || 0) > 0,
            posterUrl: resolvePosterUrl(event.poster_url),
          };
        })
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
  const isAllSites = activeSiteId === "all";
  const homeVerse = weeklyVerse ?? {
    text: "",
    reference: "",
    reading_plan: "",
  };

  useEffect(() => {
    setViewMessage("");
    setAdminMessage("");
    setSundayMessageMessage("");
  }, [activeView]);

  useEffect(() => {
    if (eventsError) {
      setViewMessage(eventsError);
    }
  }, [eventsError]);

  useEffect(() => {
    if (prayersError) {
      setViewMessage(prayersError);
    }
  }, [prayersError]);

  useEffect(() => {
    if (adminPrayersError) {
      setAdminMessage(adminPrayersError);
    }
  }, [adminPrayersError]);

  useEffect(() => {
    setSundayMessageOffset(0);
  }, [
    sundayMessageQuery,
    sundayMessageSite,
    sundayMessageSortBy,
    sundayMessageSortDir,
    sundayMessageLimit,
  ]);

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
    setAdminSundayMessageOffset(0);
  }, [adminSundayMessageLimit, adminSundayMessageSiteId]);

  useEffect(() => {
    if (!token) {
      setSummary(null);
      setActiveView("home");
      setPostLoginAction(null);
      setPendingRegistrationEvent(null);
      setRegistrationEvent(null);
      setRegistrationForm({
        ticketCount: 1,
        isProxy: false,
        proxyEntries: [{ name: "", phone: "", relation: "", note: "" }],
      });
      setRegistrationMessage("");
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
    if (activeView !== "home") {
      return;
    }
    if (!isAllSites) {
      setHomeWeeklyVerses([]);
      return;
    }
    const siteIds = Object.values(siteUuidByCode);
    Promise.all(
      siteIds.map((siteId) =>
        apiGet<WeeklyVerse>(`/weekly-verse/current?site_id=${siteId}`)
          .then((item) => item)
          .catch(() => null)
      )
    )
      .then((items) => setHomeWeeklyVerses(items.filter(Boolean) as WeeklyVerse[]))
      .catch(() => setHomeWeeklyVerses([]));
  }, [activeView, isAllSites]);

  useEffect(() => {
    if (!sundayMessageForm.messageDate) {
      setSundayMessageForm((prev) => ({ ...prev, messageDate: getCurrentSundayDate() }));
    }
  }, [sundayMessageForm.messageDate]);

  useEffect(() => {
    const computedCount = registrationForm.isProxy
      ? registrationForm.proxyEntries.length + 1
      : 1;
    if (registrationForm.ticketCount !== computedCount) {
      setRegistrationForm((prev) => ({ ...prev, ticketCount: computedCount }));
    }
  }, [registrationForm.isProxy, registrationForm.proxyEntries.length]);

  useEffect(() => {
    if (activeView !== "registration" || !registrationEvent) {
      return;
    }
    const match =
      registrationsData?.find((item) => item.event_id === registrationEvent.id) || null;
    setRegistrationRecord(match);
    if (match) {
      setRegistrationForm({
        ticketCount: match.ticket_count || 1,
        isProxy: match.is_proxy,
        proxyEntries:
          match.proxy_entries && match.proxy_entries.length
            ? match.proxy_entries.map((entry) => ({
                name: entry.name,
                phone: entry.phone || "",
                relation: entry.relation || "",
                note: entry.note || "",
              }))
            : [{ name: "", phone: "", relation: "", note: "" }],
      });
    }
  }, [activeView, registrationEvent, registrationsData]);

  useEffect(() => {
    if (!registrationAdminOpen || !registrationAdminEvent || !token || !isStaff) {
      return;
    }
    const params = new URLSearchParams({
      event_id: registrationAdminEvent.id,
      limit: String(registrationAdminLimit),
      offset: String(registrationAdminOffset),
    });
    if (registrationAdminQuery) {
      params.set("q", registrationAdminQuery);
    }
    if (registrationAdminStatus) {
      params.set("status", registrationAdminStatus);
    }
    apiGet<AdminRegistrationItem[]>(`/registrations/admin?${params.toString()}`, token)
      .then((data) => {
        setRegistrationAdminList(data);
        setRegistrationAdminMessage("");
      })
      .catch((error) => {
        setRegistrationAdminList([]);
        setRegistrationAdminMessage(error?.message || "讀取報名資料失敗");
      });
  }, [
    registrationAdminOpen,
    registrationAdminEvent,
    registrationAdminQuery,
    registrationAdminStatus,
    registrationAdminLimit,
    registrationAdminOffset,
    token,
    isStaff,
  ]);

  useEffect(() => {
    if (activeView !== "home") {
      return;
    }
    const params = new URLSearchParams();
    if (siteUuidByCode[activeSiteId]) {
      params.set("site_id", siteUuidByCode[activeSiteId]);
    }
    params.set("limit", "5");
    const path = params.toString()
      ? `/sunday-messages/latest?${params.toString()}`
      : "/sunday-messages/latest";
    apiGet<SundayMessage[]>(path)
      .then((data) => setHomeSundayMessages(data))
      .catch(() => setHomeSundayMessages([]));
  }, [activeView, activeSiteId]);

  useEffect(() => {
    if (activeView !== "home") {
      return;
    }
    const params = new URLSearchParams();
    if (siteUuidByCode[activeSiteId]) {
      params.set("site_id", siteUuidByCode[activeSiteId]);
    }
    params.set("limit", "5");
    const path = params.toString()
      ? `/life-bulletins/latest?${params.toString()}`
      : "/life-bulletins/latest";
    apiGet<LifeBulletin[]>(path)
      .then((data) => setHomeLifeBulletins(data))
      .catch(() => setHomeLifeBulletins([]));
  }, [activeView, activeSiteId]);



  useEffect(() => {
    if (activeView !== "life-bulletins") {
      return;
    }
    const params = new URLSearchParams();
    params.set("status", "Published");
    if (lifeBulletinPublicQuery) params.set("query", lifeBulletinPublicQuery);
    if (lifeBulletinPublicSite !== "all") {
      params.set("site_id", siteUuidByCode[lifeBulletinPublicSite]);
    }
    if (lifeBulletinPublicSortBy) params.set("sort_by", lifeBulletinPublicSortBy);
    if (lifeBulletinPublicSortDir) params.set("sort_dir", lifeBulletinPublicSortDir);
    params.set("limit", String(lifeBulletinPublicLimit));
    params.set("offset", String(lifeBulletinPublicOffset));
    apiGet<LifeBulletin[]>(`/life-bulletins/public?${params.toString()}`)
      .then((data) => setLifeBulletinPublic(data))
      .catch(() => setLifeBulletinPublic([]));
  }, [
    activeView,
    lifeBulletinPublicQuery,
    lifeBulletinPublicSite,
    lifeBulletinPublicSortBy,
    lifeBulletinPublicSortDir,
    lifeBulletinPublicLimit,
    lifeBulletinPublicOffset,
  ]);

  useEffect(() => {
    if (activeView !== "messages") {
      return;
    }
    apiGet<SundayMessage[]>(buildSundayMessagesPath())
      .then((data) => setSundayMessages(data))
      .catch(() => setSundayMessages([]));
  }, [
    activeView,
    sundayMessageQuery,
    sundayMessageSite,
    sundayMessageSortBy,
    sundayMessageSortDir,
    sundayMessageLimit,
    sundayMessageOffset,
  ]);

  useEffect(() => {
    if (activeView !== "admin" || adminTab !== "messages" || !token || !isStaff) {
      return;
    }
    apiGet<SundayMessage[]>(buildAdminSundayMessagesPath(), token)
      .then((data) => setAdminSundayMessages(data))
      .catch((error) => {
        setAdminMessage(error?.message || "\u8b80\u53d6\u4e3b\u65e5\u4fe1\u606f\u5931\u6557");
        setAdminSundayMessages([]);
      });
  }, [
    activeView,
    adminTab,
    token,
    isStaff,
    adminSundayMessageLimit,
    adminSundayMessageOffset,
    adminSundayMessageSiteId,
  ]);

  useEffect(() => {
    if (activeView !== "admin" || adminTab !== "life-bulletins" || !token || !isStaff) {
      return;
    }
    const params = new URLSearchParams();
    if (lifeBulletinQuery) params.set("query", lifeBulletinQuery);
    if (lifeBulletinStatus) params.set("status", lifeBulletinStatus);
    if (lifeBulletinSortBy) params.set("sort_by", lifeBulletinSortBy);
    if (lifeBulletinSortDir) params.set("sort_dir", lifeBulletinSortDir);
    params.set("limit", String(lifeBulletinLimit));
    params.set("offset", String(lifeBulletinOffset));
    apiGet<LifeBulletin[]>(`/life-bulletins?${params.toString()}`, token)
      .then((data) => {
        setLifeBulletins(data);
        setLifeBulletinMessage("");
      })
      .catch((error) => {
        setLifeBulletins([]);
        setLifeBulletinMessage(error?.message || "?? Life ????");
      });
  }, [
    activeView,
    adminTab,
    token,
    isStaff,
    lifeBulletinQuery,
    lifeBulletinStatus,
    lifeBulletinSortBy,
    lifeBulletinSortDir,
    lifeBulletinLimit,
    lifeBulletinOffset,
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
    setSundayMessageMessage("");
    setSelectedUser(null);
    setRegistrationMessage("");
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

  const handleStartRegistration = (eventId: string) => {
    const sourceEvents =
      eventsData && eventsData.length ? eventsData : homeEvents && homeEvents.length ? homeEvents : [];
    const match = sourceEvents.find((item) => item.id === eventId) || null;
    if (!match) {
      setViewMessage("????????");
      return;
    }
    const existingRegistration =
      registrationsData?.find((item) => item.event_id === eventId) || null;
    setViewMessage("");
    if (!token) {
      setPendingRegistrationEvent(match);
      setPostLoginAction({ view: "registration" });
      setAuthMode("login");
      setIsLoginOpen(true);
      return;
    }
    setRegistrationRecord(existingRegistration);
    if (existingRegistration) {
      setRegistrationForm({
        ticketCount: existingRegistration.ticket_count || 1,
        isProxy: existingRegistration.is_proxy,
        proxyEntries:
          existingRegistration.proxy_entries && existingRegistration.proxy_entries.length
            ? existingRegistration.proxy_entries.map((entry) => ({
                name: entry.name,
                phone: entry.phone || "",
                relation: entry.relation || "",
                note: entry.note || "",
              }))
            : [{ name: "", phone: "", relation: "", note: "" }],
      });
    } else {
      setRegistrationForm({
        ticketCount: 1,
        isProxy: false,
        proxyEntries: [{ name: "", phone: "", relation: "", note: "" }],
      });
    }
    setRegistrationEvent(match);
    setRegistrationMessage("");
    setActiveView("registration");
  };

  const handleOpenRegistrationAdmin = (eventId: string) => {
    const match = eventsData?.find((item) => item.id === eventId) || null;
    if (!match) {
      setAdminMessage("找不到活動資料");
      return;
    }
    setRegistrationAdminEvent(match);
    setRegistrationAdminOpen(true);
    setRegistrationAdminQuery("");
    setRegistrationAdminStatus("");
    setRegistrationAdminOffset(0);
    setRegistrationAdminMessage("");
    setRegistrationAdminEditing(null);
  };

  const handleSubmitRegistration = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      if (registrationEvent) {
        setPendingRegistrationEvent(registrationEvent);
      }
      setPostLoginAction({ view: "registration" });
      setAuthMode("login");
      setIsLoginOpen(true);
      return;
    }
    if (!registrationEvent) {
      setRegistrationMessage("請先選擇活動");
      return;
    }
    setRegistrationSubmitting(true);
    setRegistrationMessage("");
    try {
      const payload = {
        ticket_count: registrationForm.ticketCount,
        is_proxy: registrationForm.isProxy,
        proxy_entries: registrationForm.isProxy ? registrationForm.proxyEntries : [],
      };
      if (registrationRecord?.id) {
        await apiPatch(`/registrations/${registrationRecord.id}`, payload, token);
        setRegistrationMessage("報名資料已更新");
      } else {
        await apiPost("/registrations", { event_id: registrationEvent.id, ...payload }, token);
        setRegistrationMessage("報名完成");
      }
      const latest = await apiGet<RegistrationItem[]>("/registrations", token);
      setRegistrationsData(latest);
      setRegistrationForm({
        ticketCount: 1,
        isProxy: false,
        proxyEntries: [{ name: "", phone: "", relation: "", note: "" }],
      });
      setRegistrationRecord(null);
    } catch (error: any) {
      setRegistrationMessage(error?.message || "報名失敗");
    } finally {
      setRegistrationSubmitting(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoginMessage("");
    try {
      const data = await apiPost<LoginResponse>("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      const nextAction = postLoginAction;
      setToken(data.access_token);
      setIsLoginOpen(false);
      setLoginPassword("");
      setLoginMessage("登入成功");
      setPostLoginAction(null);
      if (nextAction?.view) {
        if (nextAction.view === "registration" && pendingRegistrationEvent) {
          setRegistrationEvent(pendingRegistrationEvent);
          setPendingRegistrationEvent(null);
        }
        setActiveView(nextAction.view);
      } else {
        setActiveView("member");
      }
      setCurrentUser(null);
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
    setPostLoginAction(null);
    setPendingRegistrationEvent(null);
    setRegistrationEvent(null);
    setRegistrationRecord(null);
    setRegistrationAdminOpen(false);
    setRegistrationAdminEvent(null);
    setRegistrationAdminList([]);
    setRegistrationAdminEditing(null);
    setRegistrationForm({
      ticketCount: 1,
      isProxy: false,
      proxyEntries: [{ name: "", phone: "", relation: "", note: "" }],
    });
    setRegistrationMessage("");
    setEventsData(null);
    setPrayersData(null);
    setCareData(null);
    setAdminUsers(null);
    setAdminPrayers(null);
    setAdminSundayMessages([]);
    setHomeSundayMessages([]);
    setSundayMessages([]);
    setSundayMessageEditingId(null);
    setSundayMessageMessage("");
    setSundayMessageForm({
      messageDate: getCurrentSundayDate(),
      title: "",
      speaker: "",
      youtubeUrl: "",
      description: "",
    });
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
              reading_plan: weeklyVerseForm.readingPlan || null,
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
            reading_plan: weeklyVerseForm.readingPlan || null,
          },
          token
        );
        setWeeklyVerseMessage("金句已新增");
      }
      const data = await apiGet<WeeklyVerse[]>(`/weekly-verse?site_id=${weeklyVerseSiteId}`);
      setWeeklyVerseList(data);
      setWeeklyVerseEditingId(null);
    } catch (error: any) {
      const message = error?.message || "更新本週金句失敗";
      if (String(message).includes("Not authenticated")) {
        setToken(null);
        setIsLoginOpen(true);
        setAuthMode("login");
        setLoginMessage("請先登入");
      }
      setWeeklyVerseMessage(message);
    }
  };

  const handleEditRegistrationAdmin = (item: AdminRegistrationItem) => {
    setRegistrationAdminEditing(item);
    setRegistrationAdminForm({
      ticketCount: item.ticket_count || 1,
      isProxy: item.is_proxy,
      status: item.status || "Pending",
      proxyEntries:
        item.proxy_entries && item.proxy_entries.length
          ? item.proxy_entries.map((entry) => ({
              name: entry.name,
              phone: entry.phone || "",
              relation: entry.relation || "",
              note: entry.note || "",
            }))
          : [{ name: "", phone: "", relation: "", note: "" }],
    });
  };

  const handleUpdateRegistrationAdmin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!registrationAdminEditing || !token) {
      return;
    }
    try {
      const payload = {
        ticket_count: registrationAdminForm.ticketCount,
        is_proxy: registrationAdminForm.isProxy,
        status: registrationAdminForm.status,
        proxy_entries: registrationAdminForm.isProxy
          ? registrationAdminForm.proxyEntries
          : [],
      };
      const updated = await apiPatch<AdminRegistrationItem>(
        `/registrations/admin/${registrationAdminEditing.id}`,
        payload,
        token
      );
      setRegistrationAdminList((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setRegistrationAdminEditing(updated);
      setRegistrationAdminMessage("報名資料已更新");
    } catch (error: any) {
      setRegistrationAdminMessage(error?.message || "更新報名資料失敗");
    }
  };

  const handleDeleteRegistrationAdmin = async (registrationId: string) => {
    if (!token) {
      return;
    }
    if (!window.confirm("確定要刪除此筆報名資料嗎？")) {
      return;
    }
    try {
      await apiDelete(`/registrations/admin/${registrationId}`, token);
      setRegistrationAdminList((prev) => prev.filter((item) => item.id !== registrationId));
      setRegistrationAdminMessage("報名資料已刪除");
      if (registrationAdminEditing?.id === registrationId) {
        setRegistrationAdminEditing(null);
      }
    } catch (error: any) {
      setRegistrationAdminMessage(error?.message || "刪除報名資料失敗");
    }
  };

  const handleExportRegistrations = async () => {
    if (!token || !registrationAdminEvent) {
      return;
    }
    const params = new URLSearchParams({
      event_id: registrationAdminEvent.id,
    });
    if (registrationAdminQuery) {
      params.set("q", registrationAdminQuery);
    }
    if (registrationAdminStatus) {
      params.set("status", registrationAdminStatus);
    }
    const url = `${API_BASE_URL}/registrations/admin/export?${params.toString()}`;
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "匯出失敗");
      }
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `registrations_${registrationAdminEvent.id}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      setRegistrationAdminMessage(error?.message || "匯出失敗");
    }
  };

  const handleEditWeeklyVerse = (item: WeeklyVerse) => {
    setWeeklyVerseEditingId(item.id);
    setWeeklyVerseForm({
      siteId: item.site_id,
      weekStart: item.week_start,
      text: item.text,
      reference: item.reference,
      readingPlan: item.reading_plan || "",
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
          readingPlan: "",
        }));
      }
    } catch (error: any) {
      setWeeklyVerseMessage(error?.message || "刪除金句失敗");
    }
  };

  const handleSubmitSundayMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    setSundayMessageMessage("");
    if (!adminSundayMessageSiteId) {
      setSundayMessageMessage("未設定分站，無法儲存");
      return;
    }
    try {
      const payload = {
        site_id: adminSundayMessageSiteId,
        message_date: sundayMessageForm.messageDate,
        title: sundayMessageForm.title,
        speaker: sundayMessageForm.speaker || null,
        youtube_url: sundayMessageForm.youtubeUrl,
        description: sundayMessageForm.description || null,
      };
      if (sundayMessageEditingId) {
        await apiPatch<SundayMessage>(
          `/sunday-messages/${sundayMessageEditingId}`,
          payload,
          token
        );
        setSundayMessageMessage("\u4e3b\u65e5\u4fe1\u606f\u5df2\u66f4\u65b0");
      } else {
        await apiPost<SundayMessage>("/sunday-messages", payload, token);
        setSundayMessageMessage("\u4e3b\u65e5\u4fe1\u606f\u5df2\u65b0\u589e");
      }
      const data = await apiGet<SundayMessage[]>(buildAdminSundayMessagesPath(), token);
      setAdminSundayMessages(data);
      setSundayMessageEditingId(null);
      setSundayMessageForm({
        messageDate: getCurrentSundayDate(),
        title: "",
        speaker: "",
        youtubeUrl: "",
        description: "",
      });
    } catch (error: any) {
      setSundayMessageMessage(error?.message || "\u66f4\u65b0\u4e3b\u65e5\u4fe1\u606f\u5931\u6557");
    }
  };

  const handleEditSundayMessage = (item: SundayMessage) => {
    setSundayMessageEditingId(item.id);
    setSundayMessageForm({
      messageDate: item.message_date,
      title: item.title,
      speaker: item.speaker || "",
      youtubeUrl: item.youtube_url,
      description: item.description || "",
    });
  };

  const handleDeleteSundayMessage = async (messageId: string) => {
    if (!token) {
      setIsLoginOpen(true);
      return;
    }
    if (!window.confirm("\u78ba\u5b9a\u8981\u522a\u9664\u9019\u5247\u4e3b\u65e5\u4fe1\u606f\u55ce\uff1f")) {
      return;
    }
    try {
      await apiDelete(`/sunday-messages/${messageId}`, token);
      const data = await apiGet<SundayMessage[]>(buildAdminSundayMessagesPath(), token);
      setAdminSundayMessages(data);
      setSundayMessageMessage("\u4e3b\u65e5\u4fe1\u606f\u5df2\u522a\u9664");
      if (sundayMessageEditingId === messageId) {
        setSundayMessageEditingId(null);
        setSundayMessageForm((prev) => ({
          ...prev,
          messageDate: getCurrentSundayDate(),
          title: "",
          speaker: "",
          youtubeUrl: "",
          description: "",
        }));
      }
    } catch (error: any) {
      setSundayMessageMessage(error?.message || "\u522a\u9664\u4e3b\u65e5\u4fe1\u606f\u5931\u6557");
    }
  };

  
  const handleEditLifeBulletin = (item: LifeBulletin) => {
    setLifeBulletinEditingId(item.id);
    setLifeBulletinForm({
      bulletinDate: item.bulletin_date,
      content: item.content,
      videoUrl: item.video_url || "",
      status: item.status,
    });
    setLifeBulletinVideoFile(null);
  };

  const handleSubmitLifeBulletin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !currentUser?.site_id) {
      setAuthMode("login");
      setIsLoginOpen(true);
      setLoginMessage("????");
      return;
    }
    try {
      setLifeBulletinMessage("");
      const payload = {
        site_id: currentUser.site_id,
        bulletin_date: lifeBulletinForm.bulletinDate,
        content: lifeBulletinForm.content,
        video_url: lifeBulletinForm.videoUrl || null,
        status: lifeBulletinForm.status,
      };
      let record: LifeBulletin;
      if (lifeBulletinEditingId) {
        record = await apiPatch<LifeBulletin>(
          `/life-bulletins/${lifeBulletinEditingId}`,
          payload,
          token
        );
      } else {
        record = await apiPost<LifeBulletin>("/life-bulletins", payload, token);
      }
      if (lifeBulletinVideoFile) {
        const formData = new FormData();
        formData.append("file", lifeBulletinVideoFile);
        record = await apiUpload<LifeBulletin>(
          `/life-bulletins/${record.id}/video`,
          formData,
          token
        );
      }
      const params = new URLSearchParams();
      if (lifeBulletinQuery) params.set("query", lifeBulletinQuery);
      if (lifeBulletinStatus) params.set("status", lifeBulletinStatus);
      if (lifeBulletinSortBy) params.set("sort_by", lifeBulletinSortBy);
      if (lifeBulletinSortDir) params.set("sort_dir", lifeBulletinSortDir);
      params.set("limit", String(lifeBulletinLimit));
      params.set("offset", String(lifeBulletinOffset));
      const data = await apiGet<LifeBulletin[]>(`/life-bulletins?${params.toString()}`, token);
      setLifeBulletins(data);
      setLifeBulletinEditingId(null);
      setLifeBulletinForm({ bulletinDate: "", content: "", videoUrl: "", status: "Draft" });
      setLifeBulletinVideoFile(null);
      setLifeBulletinMessage(lifeBulletinEditingId ? "??? Life ??" : "??? Life ??");
    } catch (error: any) {
      setLifeBulletinMessage(error?.message || "?? Life ????");
    }
  };

  const handleDeleteLifeBulletin = async (bulletinId: string) => {
    if (!token) {
      setAuthMode("login");
      setIsLoginOpen(true);
      setLoginMessage("????");
      return;
    }
    try {
      await apiDelete(`/life-bulletins/${bulletinId}`, token);
      setLifeBulletins((prev) => prev.filter((item) => item.id !== bulletinId));
      if (lifeBulletinEditingId === bulletinId) {
        setLifeBulletinEditingId(null);
        setLifeBulletinForm({ bulletinDate: "", content: "", videoUrl: "", status: "Draft" });
        setLifeBulletinVideoFile(null);
      }
      setLifeBulletinMessage("??? Life ??");
    } catch (error: any) {
      setLifeBulletinMessage(error?.message || "?? Life ????");
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
      refreshEvents();
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
      refreshEvents();
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
      refreshEvents();
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
  const quickActions = [
    { label: "\u5feb\u901f\u5831\u540d", action: () => setActiveView("events") },
    { label: "\u6d3b\u52d5\u7e3d\u89bd", action: () => setActiveView("events") },
    { label: "\u63d0\u5831\u4ee3\u79b1", action: () => setActiveView("prayers") },
    { label: "\u66f4\u65b0\u500b\u4eba\u8cc7\u8a0a", action: handleOpenProfileModal },
  ];

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

  function resolvePosterUrl(posterUrl?: string | null) {
    if (!posterUrl) {
      return null;
    }
    if (posterUrl.startsWith("http")) {
      return posterUrl;
    }
    return `${API_BASE_URL}${posterUrl}`;
  }

  function extractYouTubeId(url: string) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace("www.", "");
      if (host === "youtu.be") {
        return parsed.pathname.split("/")[1] || null;
      }
      if (host.endsWith("youtube.com")) {
        if (parsed.pathname === "/watch") {
          return parsed.searchParams.get("v");
        }
        if (parsed.pathname.startsWith("/live/") || parsed.pathname.startsWith("/embed/")) {
          return parsed.pathname.split("/")[2] || null;
        }
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  function resolveYouTubeThumbnail(url?: string | null) {
    if (!url) {
      return null;
    }
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return null;
    }
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  function isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value
    );
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
              <button
                key={item.label}
                className="action-chip"
                type="button"
                onClick={item.action}
              >
                {item.label}
              </button>
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
            查看全部 →
          </button>
          <button
            className={`nav-link ${activeView === "messages" ? "active" : ""}`}
            onClick={() => setActiveView("messages")}
          >
            查看全部 →
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
                      id="login-email"
                      name="email"
                      autoComplete="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    密碼
                    <input
                      type="password"
                      id="login-password"
                      name="password"
                      autoComplete="current-password"
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
                      id="register-name"
                      name="name"
                      autoComplete="name"
                      value={registerName}
                      onChange={(event) => setRegisterName(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    Email
                    <input
                      id="register-email"
                      name="email"
                      autoComplete="email"
                      value={registerEmail}
                      onChange={(event) => setRegisterEmail(event.target.value)}
                    />
                  </label>
                  <label className="field">
                    密碼
                    <input
                      type="password"
                      id="register-password"
                      name="password"
                      autoComplete="new-password"
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
                <select
                  className="site-select"
                  value={activeSiteId}
                  onChange={(event) => setActiveSiteId(event.target.value)}
                >
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
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
                {isAllSites ? (
                  <div className="verse-multi">
                    {homeWeeklyVerses.length ? (
                      homeWeeklyVerses.map((item) => (
                        <div key={item.id} className="verse-multi-item">
                          <div>
                            <p className="muted">分站：{resolveSiteName(item.site_id)}</p>
                            <p className="muted">
                              週日日期：{formatWeekStartDate(item.week_start)}
                            </p>
                          </div>
                          <p className="verse-text">「{item.text}」</p>
                          <p className="muted">{item.reference}</p>
                          {item.reading_plan && (
                            <p className="reading-plan">
                              本週讀經進度：{item.reading_plan}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="muted">目前尚無各分站金句。</p>
                    )}
                  </div>
                ) : (
                  <>
                    {weeklyVerse?.week_start && (
                      <p className="muted">
                        週日日期：{formatWeekStartDate(weeklyVerse.week_start)}
                      </p>
                    )}
                    <h2>「{homeVerse.text}」</h2>
                    <p className="muted">{homeVerse.reference}</p>
                    {homeVerse.reading_plan && (
                      <p className="reading-plan">本週讀經進度：{homeVerse.reading_plan}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>



          <section className="section life-bulletins">
            <div className="section-header life-bulletin-header">
              <div>
                <p className="eyebrow">Life 快報</p>
                <h2>最新活動小快報，即時精華影片</h2>
              </div>
              <button className="text-link" onClick={() => setActiveView("life-bulletins")}>
                查看全部 →
              </button>
            </div>
            {homeLifeBulletin ? (
              <article className="life-bulletin-card life-bulletin-marquee life-bulletin-lively">
                <div className="life-bulletin-body">
                  <div className="life-bulletin-meta">
                    <span className="life-bulletin-tag">Life 快報</span>
                    <span className="muted">
                      日期：{formatDateLabel(homeLifeBulletin.bulletin_date)}
                    </span>
                  </div>
                  <div
                    className="life-bulletin-marquee-view"
                  >
                    <div className="life-bulletin-marquee-track">
                      {(homeLifeBulletinLines.length ? homeLifeBulletinLines : ["(無內容)"]).map(
                        (line, index) => (
                          <div className="life-bulletin-line" key={`${line}-${index}`}>
                            {line}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
                <div className="life-bulletin-actions">
                  <button
                    className="button outline small"
                    onClick={() => {
                      setLifeBulletinDetailItem(homeLifeBulletin);
                      setLifeBulletinDetailOpen(true);
                    }}
                  >
                    展開
                  </button>
                  {homeLifeBulletin.video_url && (
                    <a
                      className="button primary small"
                      href={homeLifeBulletin.video_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      觀看影片
                    </a>
                  )}
                </div>
              </article>
            ) : (
              <div className="week-empty muted">目前尚無 Life 快報。</div>
            )}
          </section>

          <section className="section week-events">
            <div className="section-header">
              <div>
                <p className="eyebrow">近期活動</p>
                <h2>立即投入，找到你的下一場相遇</h2>
              </div>
              <button className="text-link" onClick={() => setActiveView("events")}>
                查看全部 →
              </button>
            </div>
            <div className="week-grid">
              {weekEventItems.length ? (
                weekEventItems.map((event, index) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onRegister={handleStartRegistration}
                    style={{ "--delay": `${index * 0.08}s` }}
                  />
                ))
              ) : (
                <div className="week-empty muted">目前尚無已發布的近期活動。</div>
              )}
            </div>
          </section>

          <section className="section messages-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">主日聚會信息</p>
                <h2>每週信息摘要，立即觀看主日影音</h2>
              </div>
              <button className="text-link" onClick={() => setActiveView("messages")}>
                查看全部 →
              </button>
            </div>
            <div className="message-grid">
              {homeSundayMessages.length ? (
                homeSundayMessages.map((message, index) => {
                  const thumbnailUrl = resolveYouTubeThumbnail(message.youtube_url);
                  return (
                    <article
                      key={message.id}
                      className="message-card"
                      style={{ "--delay": `${index * 0.08}s` } as React.CSSProperties}
                    >
                      <div className="message-card-body">
                        <div className="message-card-header">
                          <h3>{message.title}</h3>
                        </div>
                        <p className="muted">主日：{formatDateLabel(message.message_date)}</p>
                        <p className="muted">分站：{resolveSiteName(message.site_id)}</p>
                        {message.speaker && (
                          <p className="muted">講員：{message.speaker}</p>
                        )}
                      </div>
                      <div className="message-card-side">
                        <div className="message-thumb">
                          {thumbnailUrl ? (
                            <a
                              href={message.youtube_url}
                              target="_blank"
                              rel="noreferrer"
                              className="message-thumb-link"
                            >
                              <img src={thumbnailUrl} alt={`${message.title} 縮圖`} />
                            </a>
                          ) : (
                            <div className="message-thumb-placeholder muted">無縮圖</div>
                          )}
                        </div>
                        <div className="message-actions">
                          <a
                            className="button outline small"
                            href={message.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            觀看影片
                          </a>
                        </div>
                      </div>
                    
                      {message.description && (
                        <p className="message-description muted message-description-full">{message.description}</p>
                      )}
                    </article>
                  );
                })
              ) : (
                <div className="week-empty muted">目前尚無主日聚會信息。</div>
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

      
      

      {activeView === "life-bulletins" && (
        <section className="section page-view">
          <div className="section-header">
            <div>
              <p className="eyebrow">Life 快報</p>
              <h2>近期 Life 快報與精華影片</h2>
            </div>
          </div>
          <div className="events-filters">
            <div className="filter-bar">
              <input
                type="search"
                placeholder="搜尋關鍵字"
                value={lifeBulletinPublicQuery}
                onChange={(event) => setLifeBulletinPublicQuery(event.target.value)}
              />
              <select
                value={lifeBulletinPublicSite}
                onChange={(event) => setLifeBulletinPublicSite(event.target.value)}
              >
                <option value="all">全部分站</option>
                {sites
                  .filter((site) => site.id !== "all")
                  .map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
              </select>
              <select
                value={lifeBulletinPublicSortBy}
                onChange={(event) => setLifeBulletinPublicSortBy(event.target.value)}
              >
                <option value="bulletin_date">依日期</option>
                <option value="created_at">依新增</option>
              </select>
              <select
                value={lifeBulletinPublicSortDir}
                onChange={(event) => setLifeBulletinPublicSortDir(event.target.value)}
              >
                <option value="desc">降冪</option>
                <option value="asc">升冪</option>
              </select>
              <select
                value={lifeBulletinPublicLimit}
                onChange={(event) => setLifeBulletinPublicLimit(Number(event.target.value))}
              >
                <option value={6}>6 筆</option>
                <option value={12}>12 筆</option>
                <option value={24}>24 筆</option>
              </select>
            </div>
          </div>
          <div className="life-bulletin-grid">
            {lifeBulletinPublic.length ? (
              lifeBulletinPublic.map((item, index) => (
                <article
                  key={item.id}
                  className="life-bulletin-card"
                  style={{ "--delay": `${index * 0.05}s` } as React.CSSProperties}
                >
                  <div className="life-bulletin-body">
                    <p className="muted">日期：{formatDateLabel(item.bulletin_date)}</p>
                    <p className="life-bulletin-content">{item.content}</p>
                  </div>
                  {item.video_url && (
                    <a
                      className="button outline small"
                      href={item.video_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      觀看影片
                    </a>
                  )}
                </article>
              ))
            ) : (
              <div className="week-empty muted">目前尚無 Life 快報。</div>
            )}
          </div>
          <div className="pager">
            <button
              className="button outline small"
              onClick={() =>
                setLifeBulletinPublicOffset(
                  Math.max(0, lifeBulletinPublicOffset - lifeBulletinPublicLimit)
                )
              }
            >
              上一頁
            </button>
            <span className="muted">
              第 {Math.floor(lifeBulletinPublicOffset / lifeBulletinPublicLimit) + 1} 頁
            </span>
            <button
              className="button outline small"
              onClick={() => setLifeBulletinPublicOffset(lifeBulletinPublicOffset + lifeBulletinPublicLimit)}
            >
              下一頁
            </button>
          </div>
        </section>
      )}
{activeView === "messages" && (
        <section className="section page-view">
          <div className="section-header">
            <div>
              <p className="eyebrow">主日聚會信息</p>
              <h2>記錄每週主日信息，讓信息講道不錯過</h2>
            </div>
          </div>
          <div className="panel events-filters message-filters">
            <div className="filter-bar">
              <input
                type="text"
                placeholder="搜尋標題或講員"
                value={sundayMessageQuery}
                onChange={(event) => setSundayMessageQuery(event.target.value)}
              />
              <select
                value={sundayMessageSite}
                onChange={(event) => setSundayMessageSite(event.target.value)}
              >
                <option value="all">全部分站</option>
                {sites
                  .filter((site) => site.id !== "all")
                  .map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
              </select>
              <select
                value={sundayMessageSortBy}
                onChange={(event) => setSundayMessageSortBy(event.target.value)}
              >
                <option value="message_date">依日期</option>
                <option value="created_at">依新增時間</option>
                <option value="title">依標題</option>
              </select>
              <select
                value={sundayMessageSortDir}
                onChange={(event) => setSundayMessageSortDir(event.target.value)}
              >
                <option value="desc">新到舊</option>
                <option value="asc">舊到新</option>
              </select>
              <select
                value={sundayMessageLimit}
                onChange={(event) => setSundayMessageLimit(Number(event.target.value))}
              >
                <option value={6}>6 筆</option>
                <option value={12}>12 筆</option>
                <option value={24}>24 筆</option>
              </select>
            </div>
          </div>
          <div className="message-grid message-list">
            {sundayMessages.length ? (
              sundayMessages.map((message, index) => {
                const thumbnailUrl = resolveYouTubeThumbnail(message.youtube_url);
                return (
                  <article
                      key={message.id}
                      className="message-card"
                      style={{ "--delay": `${index * 0.06}s` } as React.CSSProperties}
                    >
                      <div className="message-card-body">
                        <div className="message-card-header">
                          <h3>{message.title}</h3>
                        </div>
                        <p className="muted">主日：{formatDateLabel(message.message_date)}</p>
                        <p className="muted">分站：{resolveSiteName(message.site_id)}</p>
                        {message.speaker && (
                          <p className="muted">講員：{message.speaker}</p>
                        )}
                      </div>
                      <div className="message-card-side">
                        <div className="message-thumb">
                          {thumbnailUrl ? (
                            <a
                              href={message.youtube_url}
                              target="_blank"
                              rel="noreferrer"
                              className="message-thumb-link"
                            >
                              <img src={thumbnailUrl} alt={`${message.title} 縮圖`} />
                            </a>
                          ) : (
                            <div className="message-thumb-placeholder muted">無縮圖</div>
                          )}
                        </div>
                        <div className="message-actions">
                          <a
                            className="button outline small"
                            href={message.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            觀看影片
                          </a>
                        </div>
                      </div>
                    
                      {message.description && (
                        <p className="message-description muted message-description-full">{message.description}</p>
                      )}
                    </article>
                );
              })
            ) : (
              <div className="week-empty muted">尚無主日聚會信息。</div>
            )}
          </div>
          <div className="pager">
            <button
              className="button outline small"
              onClick={() =>
                setSundayMessageOffset(Math.max(0, sundayMessageOffset - sundayMessageLimit))
              }
            >
              上一頁
            </button>
            <span className="muted">
              第 {Math.floor(sundayMessageOffset / sundayMessageLimit) + 1} 頁
            </span>
            <button
              className="button outline small"
              onClick={() => setSundayMessageOffset(sundayMessageOffset + sundayMessageLimit)}
            >
              下一頁
            </button>
          </div>
        </section>
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
                <EventCard
                  key={event.id}
                  event={event}
                  onRegister={handleStartRegistration}
                  style={{ "--delay": `${index * 0.05}s` } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {activeView === "registration" && (
        <RegistrationView
          registrationEvent={registrationEvent}
          registrationRecord={registrationRecord}
          currentUserLabel={currentUserLabel}
          registrationForm={registrationForm}
          setRegistrationForm={setRegistrationForm}
          registrationMessage={registrationMessage}
          registrationSubmitting={registrationSubmitting}
          onSubmit={handleSubmitRegistration}
          onBack={() => {
            setActiveView("events");
            setRegistrationEvent(null);
            setRegistrationRecord(null);
            setRegistrationMessage("");
          }}
          resolveSiteName={resolveSiteName}
          formatDateRange={formatDateRange}
        />
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
          <div className="admin-tabs">
            <button
              className={`tab-button ${adminTab === "weekly-verse" ? "active" : ""}`}
              onClick={() => setAdminTab("weekly-verse")}
            >
              本週金句設定
            </button>
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
            <button
              className={`tab-button ${adminTab === "messages" ? "active" : ""}`}
              onClick={() => setAdminTab("messages")}
            >
              主日信息管理
            </button>
            <button
              className={`tab-button ${adminTab === "life-bulletins" ? "active" : ""}`}
              onClick={() => setAdminTab("life-bulletins")}
            >
              Life 快報
            </button>

          </div>
          {adminTab === "weekly-verse" && (
            <div className="panel form-panel">
              <div className="panel-header">
                <div>
                  <h3>本週金句設定</h3>
                  <p className="muted">更新各分站本週主日金句</p>
                </div>
              </div>
              <form className="form-grid" onSubmit={handleUpdateWeeklyVerse}>
                <label className="field">
                  {"分站"}
                  <select
                    value={weeklyVerseSiteId}
                    onChange={(event) =>
                      setWeeklyVerseForm((prev) => ({ ...prev, siteId: event.target.value }))
                    }
                    disabled={weeklyVerseSiteLocked}
                  >
                    <option value="11111111-1111-1111-1111-111111111111">
                      {resolveSiteName("11111111-1111-1111-1111-111111111111")}
                    </option>
                    <option value="22222222-2222-2222-2222-222222222222">
                      {resolveSiteName("22222222-2222-2222-2222-222222222222")}
                    </option>
                    <option value="33333333-3333-3333-3333-333333333333">
                      {resolveSiteName("33333333-3333-3333-3333-333333333333")}
                    </option>
                    <option value="44444444-4444-4444-4444-444444444444">
                      {resolveSiteName("44444444-4444-4444-4444-444444444444")}
                    </option>
                  </select>
                </label>
                <label className="field">
                  {"週日日期"}
                  <input
                    type="date"
                    value={weeklyVerseForm.weekStart}
                    onChange={(event) =>
                      setWeeklyVerseForm((prev) => ({ ...prev, weekStart: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="field field-full">
                  {"金句內容"}
                  <textarea
                    value={weeklyVerseForm.text}
                    onChange={(event) =>
                      setWeeklyVerseForm((prev) => ({ ...prev, text: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="field field-full">
                  {"經文出處"}
                  <input
                    type="text"
                    value={weeklyVerseForm.reference}
                    onChange={(event) =>
                      setWeeklyVerseForm((prev) => ({ ...prev, reference: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="field field-full">
                  {"本週讀經進度"}
                  <input
                    type="text"
                    value={weeklyVerseForm.readingPlan}
                    onChange={(event) =>
                      setWeeklyVerseForm((prev) => ({ ...prev, readingPlan: event.target.value }))
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
                        <p className="muted">
                          {"週日："}
                          {formatWeekStartDate(item.week_start)}
                        </p>
                        <p>「{item.text}」</p>
                        <p className="muted">{item.reference}</p>
                        {item.reading_plan && (
                          <p className="muted">
                            {"本週讀經進度："}
                            {item.reading_plan}
                          </p>
                        )}
                      </div>
                      <div className="button-row">
                        <button
                          className="button ghost small"
                          onClick={() => handleEditWeeklyVerse(item)}
                        >
                          {"編輯"}
                        </button>
                        <button
                          className="button ghost small"
                          onClick={() => handleDeleteWeeklyVerse(item.id)}
                        >
                          {"刪除"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">{"尚無金句紀錄。"}</p>
                )}
              </div>
            </div>
          )}

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

          
          {adminTab === "messages" && (
            <div className="panel form-panel">
              <div className="panel-header">
                <h3>主日聚會信息管理</h3>
                {sundayMessageEditingId && (
                  <button
                    className="button ghost small"
                    onClick={() => {
                      setSundayMessageEditingId(null);
                      setSundayMessageForm({
                        messageDate: getCurrentSundayDate(),
                        title: "",
                        speaker: "",
                        youtubeUrl: "",
                        description: "",
                      });
                    }}
                  >
                    取消編輯
                  </button>
                )}
              </div>
              <form className="form-grid" onSubmit={handleSubmitSundayMessage}>
                <div>
                  <label>分站</label>
                  <select value={adminSundayMessageSiteId} disabled>
                    {adminSundayMessageSiteId ? (
                      <option value={adminSundayMessageSiteId}>
                        {resolveSiteName(adminSundayMessageSiteId)}
                      </option>
                    ) : (
                      <option value="">請先設定帳號所屬分站</option>
                    )}
                  </select>
                </div>
                <div>
                  <label>主日日期</label>
                  <input
                    type="date"
                    value={sundayMessageForm.messageDate}
                    onChange={(event) =>
                      setSundayMessageForm((prev) => ({
                        ...prev,
                        messageDate: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label>講員</label>
                  <input
                    type="text"
                    value={sundayMessageForm.speaker}
                    placeholder="選填"
                    onChange={(event) =>
                      setSundayMessageForm((prev) => ({
                        ...prev,
                        speaker: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field-full">
                  <label>主日信息標題</label>
                  <input
                    type="text"
                    value={sundayMessageForm.title}
                    onChange={(event) =>
                      setSundayMessageForm((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="field-full">
                  <label>YouTube 連結</label>
                  <input
                    type="url"
                    value={sundayMessageForm.youtubeUrl}
                    onChange={(event) =>
                      setSundayMessageForm((prev) => ({
                        ...prev,
                        youtubeUrl: event.target.value,
                      }))
                    }
                    placeholder="https://www.youtube.com/watch?v=..."
                    required
                  />
                </div>
                <div className="field-full">
                  <label>信息簡介</label>
                  <textarea
                    className="textarea-large"
                    value={sundayMessageForm.description}
                    onChange={(event) =>
                      setSundayMessageForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="field-full button-row">
                  <button className="button primary" type="submit">
                    {sundayMessageEditingId ? "更新信息" : "新增信息"}
                  </button>
                </div>
              </form>
              {sundayMessageMessage && <p className="muted">{sundayMessageMessage}</p>}
              <div className="weekly-verse-list message-admin-list">
                {adminSundayMessages.length ? (
                  adminSundayMessages.map((item) => {
                    const thumbnailUrl = resolveYouTubeThumbnail(item.youtube_url);
                    return (
                      <div key={item.id} className="weekly-verse-item message-admin-item">
                        <div>
                          <h4>{item.title}</h4>
                          <p className="muted">
                            主日：{formatDateLabel(item.message_date)}
                          </p>
                          <p className="muted">
                            分站：{resolveSiteName(item.site_id)}
                          </p>
                          {item.speaker && (
                            <p className="muted">講員：{item.speaker}</p>
                          )}
                          {item.description && (
                            <p className="message-description muted">{item.description}</p>
                          )}
                          <a
                            className="muted message-link"
                            href={item.youtube_url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {item.youtube_url}
                          </a>
                        </div>
                        <div className="message-thumb">
                          {thumbnailUrl ? (
                            <a
                              href={item.youtube_url}
                              target="_blank"
                              rel="noreferrer"
                              className="message-thumb-link"
                            >
                              <img src={thumbnailUrl} alt={`${item.title} 縮圖`} />
                            </a>
                          ) : (
                            <div className="message-thumb-placeholder muted">無縮圖</div>
                          )}
                        </div>
                        <div className="button-row">
                          <button
                            className="button ghost small"
                            onClick={() => handleEditSundayMessage(item)}
                          >
                            編輯
                          </button>
                          <button
                            className="button ghost small"
                            onClick={() => handleDeleteSundayMessage(item.id)}
                          >
                            刪除
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="muted">尚無主日信息紀錄。</p>
                )}
              </div>
              <div className="pager">
                <button
                  className="button outline small"
                  onClick={() =>
                    setAdminSundayMessageOffset(
                      Math.max(0, adminSundayMessageOffset - adminSundayMessageLimit)
                    )
                  }
                >
                  上一頁
                </button>
                <span className="muted">
                  第 {Math.floor(adminSundayMessageOffset / adminSundayMessageLimit) + 1} 頁
                </span>
                <button
                  className="button outline small"
                  onClick={() =>
                    setAdminSundayMessageOffset(adminSundayMessageOffset + adminSundayMessageLimit)
                  }
                >
                  下一頁
                </button>
              </div>
            </div>
          )}

          {adminTab === "life-bulletins" && (
            <div className="panel form-panel">
              <div className="panel-header">
                <h3>{"Life \u5feb\u5831\u7ba1\u7406"}</h3>
                {lifeBulletinEditingId && (
                  <button
                    className="button ghost small"
                    onClick={() => {
                      setLifeBulletinEditingId(null);
                      setLifeBulletinForm({
                        bulletinDate: "",
                        content: "",
                        videoUrl: "",
                        status: "Draft",
                      });
                      setLifeBulletinVideoFile(null);
                    }}
                  >
                    {"\u53d6\u6d88\u7de8\u8f2f"}
                  </button>
                )}
              </div>
              <div className="panel-subheader life-bulletin-filters">
                <div className="filter-bar">
                  <input
                    type="search"
                    placeholder="搜尋內容或影片連結"
                    value={lifeBulletinQuery}
                    onChange={(event) => setLifeBulletinQuery(event.target.value)}
                  />
                  <select
                    value={lifeBulletinStatus}
                    onChange={(event) => setLifeBulletinStatus(event.target.value)}
                  >
                    <option value="">{"\u5168\u90e8\u72c0\u614b"}</option>
                    <option value="Draft">{"\u8349\u7a3f"}</option>
                    <option value="Published">{"\u5df2\u767c\u5e03"}</option>
                  </select>
                  <select
                    value={lifeBulletinSortBy}
                    onChange={(event) => setLifeBulletinSortBy(event.target.value)}
                  >
                    <option value="bulletin_date">{"\u4f9d\u65e5\u671f"}</option>
                    <option value="created_at">{"\u4f9d\u65b0\u589e"}</option>
                  </select>
                  <select
                    value={lifeBulletinSortDir}
                    onChange={(event) => setLifeBulletinSortDir(event.target.value)}
                  >
                    <option value="desc">{"\u964d\u51aa"}</option>
                    <option value="asc">{"\u5347\u51aa"}</option>
                  </select>
                  <select
                    value={lifeBulletinLimit}
                    onChange={(event) => setLifeBulletinLimit(Number(event.target.value))}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <button
                    className="button ghost small"
                    onClick={() => {
                      setLifeBulletinQuery("");
                      setLifeBulletinStatus("");
                      setLifeBulletinSortBy("bulletin_date");
                      setLifeBulletinSortDir("desc");
                      setLifeBulletinLimit(10);
                      setLifeBulletinOffset(0);
                    }}
                    type="button"
                  >
                    {"\u91cd\u8a2d\u689d\u4ef6"}
                  </button>
                </div>
                <p className="muted">
                  {"\u5efa\u8b70\uff1a\u5148\u5beb\u5feb\u5831\u5167\u5bb9\uff0c\u518d\u8cbc\u4e0a\u5f71\u7247\u9023\u7d50\u6216\u4e0a\u50b3\u5f71\u7247\u3002"}
                </p>
              </div>
              <form className="form-grid life-bulletin-form" onSubmit={handleSubmitLifeBulletin}>
                <div>
                  <label>{"\u5206\u7ad9"}</label>
                  <select value={currentUser?.site_id || ""} disabled>
                    {currentUser?.site_id ? (
                      <option value={currentUser.site_id}>
                        {resolveSiteName(currentUser.site_id)}
                      </option>
                    ) : (
                      <option value="">{"\u8acb\u5148\u8a2d\u5b9a\u5e33\u865f\u6240\u5c6c\u5206\u7ad9"}</option>
                    )}
                  </select>
                </div>
                <div>
                  <label>{"\u65e5\u671f"}</label>
                  <input
                    type="date"
                    value={lifeBulletinForm.bulletinDate}
                    onChange={(event) =>
                      setLifeBulletinForm((prev) => ({
                        ...prev,
                        bulletinDate: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label>{"\u72c0\u614b"}</label>
                  <select
                    value={lifeBulletinForm.status}
                    onChange={(event) =>
                      setLifeBulletinForm((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="Draft">{"\u8349\u7a3f"}</option>
                    <option value="Published">{"\u5df2\u767c\u5e03"}</option>
                  </select>
                </div>
                <label className="field field-full life-bulletin-content-field">
                  {"\u5feb\u5831\u5167\u5bb9"}
                  <textarea
                    className="textarea-xl"
                    value={lifeBulletinForm.content}
                    onChange={(event) =>
                      setLifeBulletinForm((prev) => ({
                        ...prev,
                        content: event.target.value,
                      }))
                    }
                    required
                  />
                  <div className="field-helper">
                    <span>
                      {"\u76ee\u524d\u5b57\u6578\uff1a" + lifeBulletinForm.content.length}
                    </span>
                  </div>
                </label>
                <div className="field-full">
                  <label>{"\u5f71\u7247\u9023\u7d50"}</label>
                  <input
                    type="url"
                    value={lifeBulletinForm.videoUrl}
                    onChange={(event) =>
                      setLifeBulletinForm((prev) => ({
                        ...prev,
                        videoUrl: event.target.value,
                      }))
                    }
                    placeholder="https://youtu.be/..."
                  />
                </div>
                <div className="field-full">
                  <label>{"\u4e0a\u50b3\u5f71\u7247"}</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(event) =>
                      setLifeBulletinVideoFile(event.target.files?.[0] || null)
                    }
                  />
                  {lifeBulletinVideoFile && (
                    <p className="muted">
                      {"\u5df2\u9078\u64c7\uff1a" + lifeBulletinVideoFile.name}
                    </p>
                  )}
                </div>
                <div className="field-full button-row">
                  <button className="button primary" type="submit">
                    {lifeBulletinEditingId ? "\u66f4\u65b0\u5feb\u5831" : "\u65b0\u589e\u5feb\u5831"}
                  </button>
                </div>
              </form>
              {lifeBulletinMessage && <p className="muted">{lifeBulletinMessage}</p>}
              <div className="weekly-verse-list message-admin-list">
                {lifeBulletins.length ? (
                  lifeBulletins.map((item) => {
                    const thumbnailUrl = item.video_url
                      ? resolveYouTubeThumbnail(item.video_url)
                      : "";
                    return (
                      <div key={item.id} className="weekly-verse-item message-admin-item">
                        <div>
                          <p className="muted">
                            {"\u65e5\u671f\uff1a" + formatDateLabel(item.bulletin_date)}
                          </p>
                          <p className="muted">
                            {"\u5206\u7ad9\uff1a" + resolveSiteName(item.site_id)}
                          </p>
                          <p className="muted">
                            {"\u72c0\u614b\uff1a" +
                              (item.status === "Published"
                                ? "\u5df2\u767c\u5e03"
                                : "\u8349\u7a3f")}
                          </p>
                          <p className="message-description muted">{item.content}</p>
                          {item.video_url && (
                            <a
                              className="muted message-link"
                              href={item.video_url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {item.video_url}
                            </a>
                          )}
                        </div>
                        <div className="message-thumb">
                          {thumbnailUrl ? (
                            <a
                              href={item.video_url || "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="message-thumb-link"
                            >
                              <img src={thumbnailUrl} alt={"Life 快報縮圖"} />
                            </a>
                          ) : item.video_url ? (
                            <video src={item.video_url} controls />
                          ) : (
                            <div className="message-thumb-placeholder muted">
                              {"\u7121\u5f71\u7247"}
                            </div>
                          )}
                        </div>
                        <div className="button-row">
                          <button
                            className="button ghost small"
                            onClick={() => handleEditLifeBulletin(item)}
                          >
                            {"\u7de8\u8f2f"}
                          </button>
                          <button
                            className="button ghost small"
                            onClick={() => handleDeleteLifeBulletin(item.id)}
                          >
                            {"\u522a\u9664"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="muted">{"\u5c1a\u7121 Life \u5feb\u5831\u3002"}</p>
                )}
              </div>
              <div className="pager">
                <button
                  className="button outline small"
                  onClick={() =>
                    setLifeBulletinOffset(Math.max(0, lifeBulletinOffset - lifeBulletinLimit))
                  }
                >
                  {"\u4e0a\u4e00\u9801"}
                </button>
                <span className="muted">
                  {"\u7b2c " +
                    (Math.floor(lifeBulletinOffset / lifeBulletinLimit) + 1) +
                    " \u9801"}
                </span>
                <button
                  className="button outline small"
                  onClick={() => setLifeBulletinOffset(lifeBulletinOffset + lifeBulletinLimit)}
                >
                  {"\u4e0b\u4e00\u9801"}
                </button>
              </div>
            </div>
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
                        {event.statusRaw === "Published" && (
                          <button
                            className="button outline small"
                            onClick={() => handleOpenRegistrationAdmin(event.id)}
                          >
                            報名狀況
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
              <button className="button outline small modal-close" onClick={handleCloseProfileModal}>
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
              <button className="button outline small modal-close" onClick={handleCloseUserModal}>
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

      {lifeBulletinDetailOpen && lifeBulletinDetailItem && (
        <div className="modal">
          <div
            className="modal-backdrop"
            onClick={() => {
              setLifeBulletinDetailOpen(false);
              setLifeBulletinDetailItem(null);
            }}
          />
          <div className="modal-panel modal-wide">
            <div className="panel-header">
              <div>
                <h3>Life 快報完整內容</h3>
                <p className="muted">
                  日期：{formatDateLabel(lifeBulletinDetailItem.bulletin_date)} ·
                  分站：{resolveSiteName(lifeBulletinDetailItem.site_id)}
                </p>
              </div>
              <button
                className="button outline small modal-close"
                onClick={() => {
                  setLifeBulletinDetailOpen(false);
                  setLifeBulletinDetailItem(null);
                }}
              >
                關閉
              </button>
            </div>
            <div className="life-bulletin-detail-content">
              {lifeBulletinDetailItem.content}
            </div>
            {lifeBulletinDetailItem.video_url && (
              <a
                className="button primary"
                href={lifeBulletinDetailItem.video_url}
                target="_blank"
                rel="noreferrer"
              >
                觀看影片
              </a>
            )}
          </div>
        </div>
      )}

      
      {registrationAdminOpen && (
        <div className="modal">
          <div
            className="modal-backdrop"
            onClick={() => {
              setRegistrationAdminOpen(false);
              setRegistrationAdminEditing(null);
              setRegistrationAdminMessage("");
            }}
          />
          <div className="modal-panel modal-wide registration-admin-modal">
            <div className="panel-header">
              <div>
                <h3>報名狀況</h3>
                {registrationAdminEvent && (
                  <p className="muted">
                    {registrationAdminEvent.title} ·{" "}
                    {formatDateRange(
                      registrationAdminEvent.start_at,
                      registrationAdminEvent.end_at
                    )}
                  </p>
                )}
              </div>
              <div className="button-row">
                <button className="button outline small" onClick={handleExportRegistrations}>
                  匯出 Excel
                </button>
                <button
                  className="button outline small modal-close"
                  onClick={() => {
                    setRegistrationAdminOpen(false);
                    setRegistrationAdminEditing(null);
                    setRegistrationAdminMessage("");
                  }}
                >
                  關閉
                </button>
              </div>
            </div>
            <div className="filter-bar registration-admin-filters">
              <input
                placeholder="搜尋姓名或 Email"
                value={registrationAdminQuery}
                onChange={(event) => setRegistrationAdminQuery(event.target.value)}
              />
              <select
                value={registrationAdminStatus}
                onChange={(event) => setRegistrationAdminStatus(event.target.value)}
              >
                <option value="">全部狀態</option>
                <option value="Pending">待確認</option>
                <option value="Confirmed">已確認</option>
                <option value="Waitlisted">候補</option>
                <option value="Cancelled">已取消</option>
              </select>
              <select
                value={registrationAdminLimit}
                onChange={(event) => setRegistrationAdminLimit(Number(event.target.value))}
              >
                <option value={10}>每頁 10 筆</option>
                <option value={20}>每頁 20 筆</option>
                <option value={50}>每頁 50 筆</option>
              </select>
            </div>
            {registrationAdminMessage && <p className="muted">{registrationAdminMessage}</p>}
            <div className="registration-admin-list">
              {registrationAdminList.length ? (
                registrationAdminList.map((item) => (
                  <article key={item.id} className="registration-admin-item">
                    <div>
                      <h4>
                        {item.user_full_name || "未命名"}{" "}
                        <span className="muted">({item.user_email || "無 Email"})</span>
                      </h4>
                      <p className="muted">電話：{item.user_phone || "未提供"}</p>
                      <p className="muted">
                        身分：{item.user_member_type || "未指定"} /{" "}
                        {item.user_role || "未指定"}
                      </p>
                      <p className="muted">狀態：{item.status}</p>
                      <p className="muted">報名人數：{item.ticket_count}</p>
                      <p className="muted">代理報名：{item.is_proxy ? "是" : "否"}</p>
                      <p className="muted">
                        報名時間：{new Date(item.created_at).toLocaleString("zh-TW")}
                      </p>
                      {item.updated_at && (
                        <p className="muted">
                          更新時間：{new Date(item.updated_at).toLocaleString("zh-TW")}
                        </p>
                      )}
                      {item.proxy_entries && item.proxy_entries.length > 0 && (
                        <div className="proxy-summary">
                          <p className="muted">代理名單：</p>
                          <ul>
                            {item.proxy_entries.map((entry, index) => (
                              <li key={`${item.id}-proxy-${index}`}>
                                {entry.name}
                                {entry.relation ? `（${entry.relation}）` : ""}
                                {entry.phone ? ` · ${entry.phone}` : ""}
                                {entry.note ? ` · ${entry.note}` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="button-row">
                      <button
                        className="button outline small"
                        onClick={() => handleEditRegistrationAdmin(item)}
                      >
                        編輯
                      </button>
                      <button
                        className="button ghost small"
                        onClick={() => handleDeleteRegistrationAdmin(item.id)}
                      >
                        刪除
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <p className="muted">尚無報名紀錄。</p>
              )}
            </div>
            <div className="pager">
              <button
                className="button outline small"
                onClick={() =>
                  setRegistrationAdminOffset(
                    Math.max(0, registrationAdminOffset - registrationAdminLimit)
                  )
                }
              >
                上一頁
              </button>
              <span className="muted">
                第 {Math.floor(registrationAdminOffset / registrationAdminLimit) + 1} 頁
              </span>
              <button
                className="button outline small"
                onClick={() =>
                  setRegistrationAdminOffset(registrationAdminOffset + registrationAdminLimit)
                }
              >
                下一頁
              </button>
            </div>
            {registrationAdminEditing && (
              <form className="form-grid registration-admin-editor" onSubmit={handleUpdateRegistrationAdmin}>
                <h4>編輯報名資料</h4>
                <label className="field">
                  狀態
                  <select
                    value={registrationAdminForm.status}
                    onChange={(event) =>
                      setRegistrationAdminForm((prev) => ({
                        ...prev,
                        status: event.target.value,
                      }))
                    }
                  >
                    <option value="Pending">待確認</option>
                    <option value="Confirmed">已確認</option>
                    <option value="Waitlisted">候補</option>
                    <option value="Cancelled">已取消</option>
                  </select>
                </label>
                <label className="field">
                  報名人數
                  <input
                    type="number"
                    min={1}
                    value={registrationAdminForm.ticketCount}
                    onChange={(event) =>
                      setRegistrationAdminForm((prev) => ({
                        ...prev,
                        ticketCount: Math.max(1, Number(event.target.value || 1)),
                      }))
                    }
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={registrationAdminForm.isProxy}
                    onChange={(event) =>
                      setRegistrationAdminForm((prev) => ({
                        ...prev,
                        isProxy: event.target.checked,
                      }))
                    }
                  />
                  代理報名
                </label>
                {registrationAdminForm.isProxy && (
                  <div className="proxy-list">
                    {registrationAdminForm.proxyEntries.map((entry, index) => (
                      <div className="proxy-card" key={`admin-proxy-${index}`}>
                        <div className="proxy-header">
                          <span className="pill">代理對象 {index + 1}</span>
                          {registrationAdminForm.proxyEntries.length > 1 && (
                            <button
                              type="button"
                              className="button ghost small"
                              onClick={() =>
                                setRegistrationAdminForm((prev) => ({
                                  ...prev,
                                  proxyEntries: prev.proxyEntries.filter((_, idx) => idx !== index),
                                }))
                              }
                            >
                              移除
                            </button>
                          )}
                        </div>
                        <label className="field">
                          姓名
                          <input
                            value={entry.name}
                            onChange={(event) =>
                              setRegistrationAdminForm((prev) => ({
                                ...prev,
                                proxyEntries: prev.proxyEntries.map((item, idx) =>
                                  idx === index ? { ...item, name: event.target.value } : item
                                ),
                              }))
                            }
                          />
                        </label>
                        <label className="field">
                          電話
                          <input
                            value={entry.phone || ""}
                            onChange={(event) =>
                              setRegistrationAdminForm((prev) => ({
                                ...prev,
                                proxyEntries: prev.proxyEntries.map((item, idx) =>
                                  idx === index ? { ...item, phone: event.target.value } : item
                                ),
                              }))
                            }
                          />
                        </label>
                        <label className="field">
                          關係
                          <input
                            value={entry.relation || ""}
                            onChange={(event) =>
                              setRegistrationAdminForm((prev) => ({
                                ...prev,
                                proxyEntries: prev.proxyEntries.map((item, idx) =>
                                  idx === index ? { ...item, relation: event.target.value } : item
                                ),
                              }))
                            }
                          />
                        </label>
                        <label className="field">
                          備註
                          <textarea
                            rows={2}
                            value={entry.note || ""}
                            onChange={(event) =>
                              setRegistrationAdminForm((prev) => ({
                                ...prev,
                                proxyEntries: prev.proxyEntries.map((item, idx) =>
                                  idx === index ? { ...item, note: event.target.value } : item
                                ),
                              }))
                            }
                          />
                        </label>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="button outline small"
                      onClick={() =>
                        setRegistrationAdminForm((prev) => ({
                          ...prev,
                          proxyEntries: [
                            ...prev.proxyEntries,
                            { name: "", phone: "", relation: "", note: "" },
                          ],
                        }))
                      }
                    >
                      新增代理對象
                    </button>
                  </div>
                )}
                <div className="field-full">
                  <button className="button primary" type="submit">
                    更新報名
                  </button>
                </div>
              </form>
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
              <button className="button outline small modal-close" onClick={handleCloseEventModal}>
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
