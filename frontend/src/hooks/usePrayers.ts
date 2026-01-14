import { useEffect, useState } from "react";

import { apiGet } from "../api/client";

type PrayerItem = {
  id: string;
  content: string;
  privacy_level: "Private" | "Group" | "Public";
  status: "Pending" | "Approved" | "Archived";
  amen_count: number;
  created_at: string;
};

type UsePrayersOptions = {
  activeView: string;
  token: string | null;
  isStaff: boolean;
  buildPrayersPath: () => string;
  buildAdminPrayersPath: () => string;
  publicDeps: Array<string | number | boolean>;
  adminDeps: Array<string | number | boolean>;
};

export default function usePrayers({
  activeView,
  token,
  isStaff,
  buildPrayersPath,
  buildAdminPrayersPath,
  publicDeps,
  adminDeps,
}: UsePrayersOptions) {
  const [prayersData, setPrayersData] = useState<PrayerItem[] | null>(null);
  const [adminPrayers, setAdminPrayers] = useState<PrayerItem[] | null>(null);
  const [prayersError, setPrayersError] = useState("");
  const [adminPrayersError, setAdminPrayersError] = useState("");

  useEffect(() => {
    if (activeView !== "prayers") {
      return;
    }
    apiGet<PrayerItem[]>(buildPrayersPath())
      .then((data) => {
        setPrayersError("");
        setPrayersData(data);
      })
      .catch((error) => {
        setPrayersError(error?.message || "\u53d6\u5f97\u4ee3\u7981\u7246\u5931\u6557");
        setPrayersData(null);
      });
  }, [activeView, buildPrayersPath, ...publicDeps]);

  useEffect(() => {
    if (activeView !== "admin" || !token || !isStaff) {
      return;
    }
    apiGet<PrayerItem[]>(buildAdminPrayersPath(), token)
      .then((data) => {
        setAdminPrayersError("");
        setAdminPrayers(data);
      })
      .catch((error) => {
        setAdminPrayersError(error?.message || "\u53d6\u5f97\u5f85\u5be9\u6838\u4ee3\u7981\u5931\u6557");
        setAdminPrayers(null);
      });
  }, [activeView, token, isStaff, buildAdminPrayersPath, ...adminDeps]);

  return {
    prayersData,
    setPrayersData,
    adminPrayers,
    setAdminPrayers,
    prayersError,
    adminPrayersError,
  };
}
