type EventCardData = {
  id: string;
  title: string;
  date: string;
  location: string;
  description: string;
  capacity: number | null | undefined;
  posterUrl: string | null;
  statusRaw: "Draft" | "Published" | "Closed";
  registered: boolean;
  registrationCount: number;
};

import type React from "react";

type EventCardProps = {
  event: EventCardData;
  onRegister: (eventId: string) => void;
  className?: string;
  style?: React.CSSProperties;
};

export default function EventCard({ event, onRegister, className, style }: EventCardProps) {
  return (
    <article className={`week-card${className ? ` ${className}` : ""}`} style={style}>
      <div className="week-card-body">
        <div className="week-card-header">
          <div>
            {event.registered && <span className="pill">{"\u5df2\u5831\u540d"}</span>}
            <h3>{event.title}</h3>
          </div>
          {event.statusRaw === "Published" ? (
            <button className="text-link" type="button" onClick={(eventClick) => { eventClick.stopPropagation(); onRegister(event.id); }}>
              {"\u5feb\u901f\u5831\u540d \u2192"}
            </button>
          ) : event.statusRaw === "Closed" ? (
            <span className="muted">{"\u5df2\u7d50\u675f"}</span>
          ) : (
            <span className="muted">{"\u5c1a\u672a\u958b\u653e"}</span>
          )}
        </div>
        <div className="week-meta">
          <span>
            {"\u5206\u7ad9\uFF1A"}
            {event.location}
          </span>
          <span>
            {"\u6642\u9593\uFF1A"}
            {event.date}
          </span>
          {event.description && (
            <span>
              {"\u8aaa\u660e\uFF1A"}
              {event.description}
            </span>
          )}
          <span>
            {"\u540d\u984d\uFF1A"}
            {event.capacity ?? "\u4e0d\u9650"}
          </span>
          <span>
            {"\u6211\u7684\u5831\u540d\u4eba\u6578\uFF1A"}
            {event.registrationCount}
          </span>
        </div>
      </div>
      <div className="week-card-media">
        {event.posterUrl ? (
          <img src={event.posterUrl} alt={`${event.title} \u6d77\u5831`} />
        ) : (
          <div className="week-card-placeholder">
            <span>{"\u7121\u6d77\u5831"}</span>
          </div>
        )}
      </div>
    </article>
  );
}
