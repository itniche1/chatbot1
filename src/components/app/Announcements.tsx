import { useEffect, useState } from "react";
import { Bell, BellDot, Check, RotateCcw } from "lucide-react";
import { api } from "../../lib/api";
import { relativeTime } from "../../lib/format";
import { Menu } from "../ui";

type Announcement = { id: string; title: string; body: string; created_at?: string; dismissed?: boolean };

// Shared across the sidebar and mobile topbar instances so both stay in sync.
let shared: Announcement[] | null = null;
const subs = new Set<(a: Announcement[]) => void>();
const publish = (a: Announcement[]) => { shared = a; subs.forEach((s) => s(a)); };
let inflight: Promise<void> | null = null;

export function AnnouncementsButton({ align = "right" }: { align?: "right" | "up" }) {
  const [items, setItems] = useState<Announcement[]>(shared || []);

  useEffect(() => {
    subs.add(setItems);
    if (!shared && !inflight) inflight = api.get("/announcements").then((r) => publish(r.data || [])).catch(() => publish([])).finally(() => { inflight = null; });
    return () => { subs.delete(setItems); };
  }, []);

  const setDismissed = async (id: string, dismissed: boolean) => {
    const prev = shared || [];
    publish(prev.map((a) => (a.id === id ? { ...a, dismissed } : a)));
    try { await api.post(`/announcements/${id}/${dismissed ? "dismiss" : "restore"}`); }
    catch { publish(prev); }
  };

  const active = items.filter((a) => !a.dismissed);
  const archived = items.filter((a) => a.dismissed);

  return (
    <Menu align={align} trigger={({ open, toggle }) => (
      <button
        type="button" onClick={toggle} aria-expanded={open} aria-label={`Announcements${active.length ? ` (${active.length} new)` : ""}`}
        className="icon-btn" style={{ position: "relative" }}
      >
        {active.length ? <BellDot style={{ color: "var(--brand)" }} /> : <Bell />}
        {active.length > 0 && <span className="sr-only">{active.length} new</span>}
      </button>
    )}>
      {() => (
        <div style={{ width: 340, maxWidth: "calc(100vw - 32px)", maxHeight: 420, overflowY: "auto", color: "var(--text)" }}>
          <div className="menu__label">Announcements</div>
          {items.length === 0 && <div style={{ padding: "18px 10px", fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>You're all caught up.</div>}
          {active.map((a) => (
            <div key={a.id} style={{ padding: "10px", borderRadius: 8, display: "flex", gap: 10 }}>
              <span style={{ width: 8, height: 8, borderRadius: 8, background: "var(--brand)", marginTop: 7, flex: "none" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)", color: "var(--text-strong)" }}>{a.title}</div>
                <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)", whiteSpace: "pre-wrap", marginTop: 2 }}>{a.body}</div>
                <div style={{ fontSize: "var(--fs-2xs)", color: "var(--text-subtle)", marginTop: 4 }}>{relativeTime(a.created_at)}</div>
              </div>
              <button type="button" className="icon-btn icon-btn--sm" title="Mark as read" aria-label="Mark as read" onClick={() => setDismissed(a.id, true)}><Check /></button>
            </div>
          ))}
          {archived.length > 0 && (
            <>
              <div className="menu__sep" />
              <div className="menu__label">Read</div>
              {archived.map((a) => (
                <div key={a.id} style={{ padding: "8px 10px", display: "flex", gap: 10, opacity: .7 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "var(--fs-sm)" }} className="truncate">{a.title}</div>
                    <div style={{ fontSize: "var(--fs-xs)", color: "var(--text-muted)" }} className="truncate">{a.body}</div>
                  </div>
                  <button type="button" className="icon-btn icon-btn--sm" title="Mark as unread" aria-label="Mark as unread" onClick={() => setDismissed(a.id, false)}><RotateCcw /></button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </Menu>
  );
}
