import { useEffect, useMemo, useState } from "react";

import { apiGet } from "../api/client";

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

export default function useRegistrations(token: string | null) {
  const [registrationsData, setRegistrationsData] = useState<RegistrationItem[] | null>(null);

  useEffect(() => {
    if (!token) {
      setRegistrationsData(null);
      return;
    }
    apiGet<RegistrationItem[]>("/registrations", token)
      .then((data) => setRegistrationsData(data))
      .catch(() => setRegistrationsData([]));
  }, [token]);

  const registrationCountByEvent = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!registrationsData) {
      return counts;
    }
    registrationsData.forEach((item) => {
      if (!item.event_id) {
        return;
      }
      const proxyCount = item.proxy_entries ? item.proxy_entries.length : 0;
      const effectiveCount = item.is_proxy ? proxyCount + 1 : item.ticket_count || 1;
      counts[item.event_id] = (counts[item.event_id] || 0) + effectiveCount;
    });
    return counts;
  }, [registrationsData]);

  return { registrationsData, registrationCountByEvent, setRegistrationsData };
}
