import { useEffect, useState } from "react";

import { apiGet } from "../api/client";

type UserProfile = {
  id: string;
  email: string;
  full_name?: string;
  role: "Admin" | "CenterStaff" | "BranchStaff" | "Leader" | "Member";
  phone?: string | null;
  member_type?: "Member" | "Seeker";
  site_id?: string | null;
};

type ProfileFormState = {
  fullName: string;
  email: string;
  phone: string;
  memberType: "Member" | "Seeker";
};

type UseUserProfileOptions = {
  token: string | null;
  setLoginMessage: (message: string) => void;
  setWeeklyVerseForm: React.Dispatch<
    React.SetStateAction<{
      siteId: string;
      weekStart: string;
      text: string;
      reference: string;
    }>
  >;
  weeklyVerseFormSiteId: string;
  centerSiteId: string;
};

export default function useUserProfile({
  token,
  setLoginMessage,
  setWeeklyVerseForm,
  weeklyVerseFormSiteId,
  centerSiteId,
}: UseUserProfileOptions) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    fullName: "",
    email: "",
    phone: "",
    memberType: "Member",
  });

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }
    apiGet<UserProfile>("/auth/me", token)
      .then((data) => setCurrentUser(data))
      .catch((error) => {
        setLoginMessage(error?.message || "\u53d6\u5f97\u767b\u5165\u8cc7\u8a0a\u5931\u6557");
        setCurrentUser(null);
      });
  }, [token, setLoginMessage]);

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
      weeklyVerseFormSiteId === centerSiteId &&
      currentUser.site_id !== centerSiteId
    ) {
      setWeeklyVerseForm((prev) => ({ ...prev, siteId: currentUser.site_id as string }));
    }
  }, [currentUser, weeklyVerseFormSiteId, centerSiteId, setWeeklyVerseForm]);

  return { currentUser, setCurrentUser, profileForm, setProfileForm };
}
