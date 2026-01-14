export function formatDateRange(startAt: string, endAt?: string | null) {
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

export function formatWeekStartDate(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getCurrentSundayDate() {
  const today = new Date();
  const diff = today.getDay();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - diff);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
}

export function formatEventTimePreview(startAt: string, endAt?: string | null) {
  const start = new Date(startAt);
  if (!Number.isFinite(start.getTime())) {
    return startAt;
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

export function splitDateTime(value: string) {
  if (!value) {
    return { date: "", hour: "", minute: "" };
  }
  const [datePart, timePart] = value.split("T");
  if (!timePart) {
    return { date: datePart, hour: "", minute: "" };
  }
  const [hour, minute] = timePart.split(":");
  return { date: datePart, hour, minute };
}

export function buildDateTime(date: string, hour: string, minute: string) {
  if (!date) {
    return "";
  }
  return `${date}T${hour || "00"}:${minute || "00"}`;
}

export function formatDateInput(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return value;
  }
  const pad = (val: number) => String(val).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export function formatDateLabel(value?: string | null) {
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
