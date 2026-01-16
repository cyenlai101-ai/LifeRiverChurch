import type React from "react";

type RegistrationEvent = {
  id: string;
  title: string;
  description?: string | null;
  start_at: string;
  end_at?: string | null;
  capacity?: number | null;
  site_id?: string | null;
};

type ProxyEntry = {
  name: string;
  phone: string;
  relation: string;
  note: string;
};

type RegistrationFormState = {
  ticketCount: number;
  isProxy: boolean;
  proxyEntries: ProxyEntry[];
};

type RegistrationRecord = {
  id: string;
  status: string;
  ticket_count: number;
  is_proxy: boolean;
  proxy_entries?: ProxyEntry[];
  created_at: string;
  updated_at?: string | null;
};

type RegistrationViewProps = {
  registrationEvent: RegistrationEvent | null;
  registrationRecord?: RegistrationRecord | null;
  currentUserLabel: string;
  registrationForm: RegistrationFormState;
  setRegistrationForm: React.Dispatch<React.SetStateAction<RegistrationFormState>>;
  registrationMessage: string;
  registrationSubmitting: boolean;
  onSubmit: (event: React.FormEvent) => void;
  onBack: () => void;
  resolveSiteName: (siteId?: string | null) => string;
  formatDateRange: (startAt: string, endAt?: string | null) => string;
};

export default function RegistrationView({
  registrationEvent,
  registrationRecord,
  currentUserLabel,
  registrationForm,
  setRegistrationForm,
  registrationMessage,
  registrationSubmitting,
  onSubmit,
  onBack,
  resolveSiteName,
  formatDateRange,
}: RegistrationViewProps) {
  return (
    <section className="section page-view">
      <div className="section-header">
        <div>
          <p className="eyebrow">{"\u6d3b\u52d5\u5831\u540d"}</p>
          <h2>{"\u586b\u5beb\u5831\u540d\u8cc7\u6599"}</h2>
        </div>
        <button className="button outline small" onClick={onBack}>
          {"\u8fd4\u56de\u6d3b\u52d5"}
        </button>
      </div>
      {registrationEvent ? (
        <div className="panel registration-panel">
          <div className="registration-info">
            <p className="eyebrow">{"\u6d3b\u52d5\u8cc7\u8a0a"}</p>
            <h3>{registrationEvent.title}</h3>
            <p className="muted">
              {"\u5206\u7ad9\uFF1A"}
              {resolveSiteName(registrationEvent.site_id)}
            </p>
            <p className="muted">
              {"\u6642\u9593\uFF1A"}
              {formatDateRange(registrationEvent.start_at, registrationEvent.end_at)}
            </p>
            {registrationEvent.description && (
              <p className="muted">
                {"\u8aaa\u660e\uFF1A"}
                {registrationEvent.description}
              </p>
            )}
            <p className="muted">
              {"\u540d\u984d\uFF1A"}
              {registrationEvent.capacity ?? "\u4e0d\u9650"}
            </p>
            {registrationRecord && (
              <div className="registration-status">
                <p className="pill">{"\u5df2\u5831\u540d"}</p>
                <p className="muted">
                  {"\u5831\u540d\u72c0\u614b\uFF1A"}
                  {registrationRecord.status}
                </p>
                <p className="muted">
                  {"\u5831\u540d\u6642\u9593\uFF1A"}
                  {new Date(registrationRecord.created_at).toLocaleString("zh-TW")}
                </p>
              </div>
            )}
          </div>
          <form className="registration-form" onSubmit={onSubmit}>
            <div className="form-section">
              <p className="eyebrow">{"\u5831\u540d\u4eba"}</p>
              <p className="muted">
                {"\u5e33\u865f\u59d3\u540d\uFF1A"}
                {currentUserLabel}
              </p>
              {registrationRecord && (
                <p className="muted">{"\u53ef\u4ee5\u76f4\u63a5\u4fee\u6539\u4e0b\u65b9\u5831\u540d\u8cc7\u6599\u3002"}</p>
              )}
              <label className="field">
                {"\u4eba\u6578\uff08\u81ea\u52d5\u8a08\u7b97\uff09"}
                <input
                  type="number"
                  min={1}
                  max={registrationEvent.capacity ?? undefined}
                  value={registrationForm.ticketCount}
                  readOnly
                  onChange={(event) =>
                    setRegistrationForm((prev) => ({
                      ...prev,
                      ticketCount: Math.max(1, Number(event.target.value || 1)),
                    }))
                  }
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={registrationForm.isProxy}
                  onChange={(event) =>
                    setRegistrationForm((prev) => ({
                      ...prev,
                      isProxy: event.target.checked,
                    }))
                  }
                />
                {"\u4ee3\u70ba\u5831\u540d"}
              </label>
            </div>
            {registrationForm.isProxy && (
              <div className="form-section">
                <p className="eyebrow">{"\u4ee3\u70ba\u5831\u540d\u8cc7\u8a0a"}</p>
                <div className="proxy-list">
                  {registrationForm.proxyEntries.map((entry, index) => (
                    <div className="proxy-card" key={`proxy-${index}`}>
                      <div className="proxy-header">
                        <span className="pill">
                          {"\u4ee3\u5831\u5c0d\u8c61 "} {index + 1}
                        </span>
                        {registrationForm.proxyEntries.length > 1 && (
                          <button
                            type="button"
                            className="button ghost small"
                            onClick={() =>
                              setRegistrationForm((prev) => ({
                                ...prev,
                                proxyEntries: prev.proxyEntries.filter((_, idx) => idx !== index),
                              }))
                            }
                          >
                            {"\u79fb\u9664"}
                          </button>
                        )}
                      </div>
                      <label className="field">
                        {"\u59d3\u540d"}
                        <input
                          value={entry.name}
                          onChange={(event) =>
                            setRegistrationForm((prev) => ({
                              ...prev,
                              proxyEntries: prev.proxyEntries.map((item, idx) =>
                                idx === index ? { ...item, name: event.target.value } : item
                              ),
                            }))
                          }
                          required
                        />
                      </label>
                      <label className="field">
                        {"\u96fb\u8a71 (\u9078\u586b)"}
                        <input
                          value={entry.phone}
                          onChange={(event) =>
                            setRegistrationForm((prev) => ({
                              ...prev,
                              proxyEntries: prev.proxyEntries.map((item, idx) =>
                                idx === index ? { ...item, phone: event.target.value } : item
                              ),
                            }))
                          }
                        />
                      </label>
                      <label className="field">
                        {"\u95dc\u4fc2"}
                        <select
                          value={entry.relation}
                          onChange={(event) =>
                            setRegistrationForm((prev) => ({
                              ...prev,
                              proxyEntries: prev.proxyEntries.map((item, idx) =>
                                idx === index ? { ...item, relation: event.target.value } : item
                              ),
                            }))
                          }
                          required
                        >
                          <option value="">{"\u8acb\u9078\u64c7"}</option>
                          <option value="friend">{"\u670b\u53cb"}</option>
                          <option value="family">{"\u5bb6\u4eba"}</option>
                          <option value="other">{"\u5176\u4ed6"}</option>
                        </select>
                      </label>
                      <label className="field">
                        {"\u5099\u8a3b\u8aaa\u660e"}
                        <textarea
                          rows={3}
                          value={entry.note}
                          onChange={(event) =>
                            setRegistrationForm((prev) => ({
                              ...prev,
                              proxyEntries: prev.proxyEntries.map((item, idx) =>
                                idx === index ? { ...item, note: event.target.value } : item
                              ),
                            }))
                          }
                        />
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="button outline small"
                    onClick={() =>
                      setRegistrationForm((prev) => ({
                        ...prev,
                        proxyEntries: [
                          ...prev.proxyEntries,
                          { name: "", phone: "", relation: "", note: "" },
                        ],
                      }))
                    }
                  >
                    {"\u65b0\u589e\u4ee3\u5831\u5c0d\u8c61"}
                  </button>
                </div>
              </div>
            )}
            <button className="button primary" type="submit" disabled={registrationSubmitting}>
              {registrationSubmitting
                ? "\u9001\u51fa\u4e2d..."
                : registrationRecord
                ? "\u66f4\u65b0\u5831\u540d\u8cc7\u6599"
                : "\u9001\u51fa\u5831\u540d"}
            </button>
            {registrationMessage && <p className="muted">{registrationMessage}</p>}
          </form>
        </div>
      ) : (
        <div className="panel empty-panel">{"\u8acb\u5148\u5f9e\u6d3b\u52d5\u5217\u8868\u9078\u64c7\u6d3b\u52d5\u3002"}</div>
      )}
    </section>
  );
}
