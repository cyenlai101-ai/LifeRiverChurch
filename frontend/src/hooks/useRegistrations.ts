import { useEffect, useMemo, useState } from "react";

import { apiGet } from "../api/client";

type RegistrationItem = {
  id: string;
  event_id: string;
  ticket_count: number;
  status: string;
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
      counts[item.event_id] = (counts[item.event_id] || 0) + (item.ticket_count || 0);
    });
    return counts;
  }, [registrationsData]);

  return { registrationsData, registrationCountByEvent, setRegistrationsData };
}
