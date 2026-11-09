import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, Sparkles, MessagesSquare, CornerDownLeft, ArrowRight } from "lucide-react";
import { api } from "../../lib/api";
import { useSessions } from "../../lib/sessions";
import { relativeTime } from "../../lib/format";

type MessageHit = { message_id: string; conversation_id: string; role: string; snippet: string; created_at?: string; conversation?: { title?: string } };

/**
 * Ctrl/⌘+K palette. Searches Assistant sessions in this browser instantly, and customer
 * conversations server-side via the existing GET /messages/search endpoint.
 */
export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<MessageHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [cursor, setCursor] = useState(0);
  const sessions = useSessions();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setQ(""); setHits(null); setCursor(0); setTimeout(() => inputRef.current?.focus(), 20); } }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setHits(null); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try { setHits((await api.get("/messages/search", { params: { q: term, limit: 8 } })).data || []); }
      catch { setHits([]); }
      finally { setSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const term = q.trim().toLowerCase();
  const localHits = useMemo(() => (term
    ? sessions.filter((s) => s.title.toLowerCase().includes(term) || s.messages.some((m) => m.content.toLowerCase().includes(term)))
    : sessions
  ).slice(0, 6), [sessions, term]);

  const items = [
    ...localHits.map((s) => ({ key: `s-${s.id}`, go: () => navigate(`/app?c=${s.id}`) })),
    ...(hits || []).map((h) => ({ key: `m-${h.message_id}`, go: () => navigate(`/app/conversations?c=${h.conversation_id}&m=${h.message_id}`) })),
    ...(term ? [{ key: "all", go: () => navigate(`/app/conversations?q=${encodeURIComponent(q.trim())}`) }] : []),
  ];
  const run = (i: number) => { items[i]?.go(); onClose(); };

  if (!open) return null;
  let idx = -1;
  const rowProps = () => { idx += 1; const i = idx; return { "data-active": cursor === i, onMouseEnter: () => setCursor(i), onClick: () => run(i) }; };

  return createPortal(
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal-wrap" style={{ placeItems: "start center", paddingTop: "12vh" }} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal palette" role="dialog" aria-modal="true" aria-label="Search conversations" style={{ maxWidth: 620 }}>
          <div className="palette__input">
            <Search />
            <input
              ref={inputRef} value={q} placeholder="Search Assistant chats and customer conversations…" aria-label="Search"
              onChange={(e) => { setQ(e.target.value); setCursor(0); }}
              onKeyDown={(e) => {
                if (e.key === "Escape") onClose();
                else if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(items.length - 1, c + 1)); }
                else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
                else if (e.key === "Enter") { e.preventDefault(); run(cursor); }
              }}
            />
            {searching && <span className="spinner" style={{ color: "var(--text-subtle)" }} />}
          </div>
          <div className="palette__results">
            <div className="menu__label">Assistant</div>
            {localHits.length === 0 && <div className="palette__empty">{term ? "No matching Assistant chats." : "No Assistant chats yet."}</div>}
            {localHits.map((s) => (
              <button key={s.id} type="button" className="palette__row" {...rowProps()}>
                <Sparkles /><span className="truncate" style={{ flex: 1 }}>{s.title}</span><span className="subtle text-xs nowrap">{relativeTime(s.updatedAt)}</span>
              </button>
            ))}
            {term.length >= 2 && (
              <>
                <div className="menu__label" style={{ marginTop: 6 }}>Customer conversations</div>
                {hits && hits.length === 0 && <div className="palette__empty">No messages match “{q.trim()}”.</div>}
                {(hits || []).map((h) => (
                  <button key={h.message_id} type="button" className="palette__row" {...rowProps()}>
                    <MessagesSquare />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span className="truncate" style={{ display: "block", fontWeight: 700 }}>{h.conversation?.title || "Conversation"}</span>
                      <span className="truncate subtle text-xs" style={{ display: "block" }}>{h.snippet}</span>
                    </span>
                  </button>
                ))}
                <button type="button" className="palette__row" {...rowProps()}>
                  <ArrowRight /><span style={{ flex: 1 }}>See all results in Conversations</span>
                </button>
              </>
            )}
          </div>
          <div className="palette__foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd><CornerDownLeft size={11} /></kbd> open</span><span><kbd>esc</kbd> close</span></div>
        </div>
      </div>
    </>,
    document.body,
  );
}
