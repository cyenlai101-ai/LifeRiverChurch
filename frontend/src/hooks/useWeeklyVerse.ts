import { useEffect, useState } from "react";

import { apiGet } from "../api/client";
import { getCurrentSundayDate } from "../utils/date";

type WeeklyVerse = {
  id: string;
  site_id: string;
  week_start: string;
  text: string;
  reference: string;
  reading_plan?: string | null;
  updated_at: string;
};

type WeeklyVerseFormState = {
  siteId: string;
  weekStart: string;
  text: string;
  reference: string;
  readingPlan: string;
};

type UseWeeklyVerseOptions = {
  activeView: string;
  homeSiteId?: string | null;
  weeklyVerseSiteId?: string | null;
  token?: string | null;
  weeklyVerseForm: WeeklyVerseFormState;
  setWeeklyVerseForm: React.Dispatch<React.SetStateAction<WeeklyVerseFormState>>;
  setWeeklyVerseMessage: (message: string) => void;
};

export default function useWeeklyVerse({
  activeView,
  homeSiteId,
  weeklyVerseSiteId,
  token,
  weeklyVerseForm,
  setWeeklyVerseForm,
  setWeeklyVerseMessage,
}: UseWeeklyVerseOptions) {
  const [weeklyVerse, setWeeklyVerse] = useState<WeeklyVerse | null>(null);
  const [weeklyVerseList, setWeeklyVerseList] = useState<WeeklyVerse[]>([]);

  useEffect(() => {
    if (!weeklyVerseForm.weekStart) {
      setWeeklyVerseForm((prev) => ({ ...prev, weekStart: getCurrentSundayDate() }));
    }
  }, [weeklyVerseForm.weekStart, setWeeklyVerseForm]);

  useEffect(() => {
    if (activeView !== "home") {
      return;
    }
    if (!homeSiteId) {
      setWeeklyVerse(null);
      return;
    }
    apiGet<WeeklyVerse>(`/weekly-verse/current?site_id=${homeSiteId}`)
      .then((data) => setWeeklyVerse(data))
      .catch(() => setWeeklyVerse(null));
  }, [activeView, homeSiteId]);

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
      readingPlan: weeklyVerse.reading_plan || "",
    }));
  }, [weeklyVerse, setWeeklyVerseForm]);

  useEffect(() => {
    if (activeView !== "admin") {
      return;
    }
    if (!weeklyVerseSiteId) {
      setWeeklyVerse(null);
      return;
    }
    apiGet<WeeklyVerse[]>(`/weekly-verse?site_id=${weeklyVerseSiteId}`, token || undefined)
      .then((data) => setWeeklyVerseList(data))
      .catch(() => setWeeklyVerseList([]));
  }, [activeView, weeklyVerseSiteId, token]);

  useEffect(() => {
    setWeeklyVerseMessage("");
  }, [weeklyVerseForm.siteId, setWeeklyVerseMessage]);

  return {
    weeklyVerse,
    setWeeklyVerse,
    weeklyVerseList,
    setWeeklyVerseList,
  };
}
