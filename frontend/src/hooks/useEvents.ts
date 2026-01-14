import { useEffect, useState } from "react";

import { apiGet } from "../api/client";

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

type EventsFilters = {
  query: string;
  status: string;
  site: string;
  upcomingOnly: boolean;
  sortBy: string;
  sortDir: string;
  limit: number;
  offset: number;
};

type UseEventsOptions = {
  activeView: string;
  adminTab: string;
  filters: EventsFilters;
  homeSiteId?: string | null;
};

export default function useEvents({
  activeView,
  adminTab,
  filters,
  homeSiteId,
}: UseEventsOptions) {
  const [eventsData, setEventsData] = useState<EventItem[] | null>(null);
  const [homeEvents, setHomeEvents] = useState<EventItem[] | null>(null);
  const [eventsError, setEventsError] = useState("");

  const buildEventsPath = () => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.status) params.set("status", filters.status);
    if (filters.site) params.set("site_id", filters.site);
    if (filters.upcomingOnly) params.set("upcoming_only", "true");
    if (filters.sortBy) params.set("sort_by", filters.sortBy);
    if (filters.sortDir) params.set("sort_dir", filters.sortDir);
    params.set("limit", String(filters.limit));
    params.set("offset", String(filters.offset));
    return params.toString() ? `/events?${params.toString()}` : "/events";
  };

  const refreshEvents = () =>
    apiGet<EventItem[]>(buildEventsPath())
      .then((data) => {
        setEventsError("");
        setEventsData(data);
        return data;
      })
      .catch((error) => {
        setEventsError(error?.message || "Unable to load events");
        setEventsData(null);
      });

  useEffect(() => {
    if (activeView !== "events") {
      return;
    }
    refreshEvents();
  }, [
    activeView,
    filters.query,
    filters.status,
    filters.site,
    filters.upcomingOnly,
    filters.sortBy,
    filters.sortDir,
    filters.limit,
    filters.offset,
  ]);

  useEffect(() => {
    if (activeView !== "admin" || adminTab !== "events") {
      return;
    }
    refreshEvents();
  }, [
    activeView,
    adminTab,
    filters.query,
    filters.status,
    filters.site,
    filters.upcomingOnly,
    filters.sortBy,
    filters.sortDir,
    filters.limit,
    filters.offset,
  ]);

  useEffect(() => {
    if (activeView !== "home") {
      return;
    }
    const params = new URLSearchParams({
      limit: "4",
      sort_by: "start_at",
      sort_dir: "desc",
    });
    if (homeSiteId) {
      params.set("site_id", homeSiteId);
    }
    apiGet<EventItem[]>(`/events?${params.toString()}`)
      .then((data) => setHomeEvents(data))
      .catch(() => setHomeEvents([]));
  }, [activeView, homeSiteId]);

  return {
    eventsData,
    homeEvents,
    eventsError,
    setEventsData,
    setHomeEvents,
    refreshEvents,
  };
}
