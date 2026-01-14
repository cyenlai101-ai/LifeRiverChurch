import { useEffect, useState } from "react";

export default function useEventsFilters() {
  const [eventQuery, setEventQuery] = useState("");
  const [eventStatus, setEventStatus] = useState("");
  const [eventSite, setEventSite] = useState("");
  const [eventUpcomingOnly, setEventUpcomingOnly] = useState(false);
  const [eventSortBy, setEventSortBy] = useState("start_at");
  const [eventSortDir, setEventSortDir] = useState("desc");
  const [eventLimit, setEventLimit] = useState(50);
  const [eventOffset, setEventOffset] = useState(0);

  useEffect(() => {
    setEventOffset(0);
  }, [eventQuery, eventStatus, eventSite, eventUpcomingOnly, eventSortBy, eventSortDir, eventLimit]);

  return {
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
  };
}
