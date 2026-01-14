export type EventStatus = "Draft" | "Published" | "Closed";

type EventStatusSource = {
  status: EventStatus;
  end_at?: string | null;
};

export function resolveEventStatus(event: EventStatusSource): EventStatus {
  if (event.status === "Draft") {
    return "Draft";
  }
  if (event.end_at) {
    const end = new Date(event.end_at);
    if (Number.isFinite(end.getTime()) && end.getTime() < Date.now()) {
      return "Closed";
    }
  }
  return event.status;
}
