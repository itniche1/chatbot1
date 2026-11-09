import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios, { type AxiosInstance } from "axios";
import { X, ChevronLeft, Menu as MenuIcon, Mail, MessageCircle, Plus, ArrowRight, ArrowUp, Mic, Square, MessagesSquare } from "lucide-react";
import { API_BASE, getAccessToken } from "../../lib/api";
import { streamChat } from "../../lib/stream";
import { validateEmail, validatePhone } from "../../lib/validate";
import { fmtDay, fmtTime, relativeTime, startsNewDay, firstName } from "../../lib/format";
import { useSpeech } from "../../lib/useSpeech";
import type { Appearance, Behavior, ChatMessage } from "../../lib/types";
import { Markdown } from "../../components/chat/Markdown";
import "../../styles/widget.css";

/* ------------------------------------------------------------------------------------------------
   Embeddable widget (/widget/:publicId). Loaded in an iframe by /api/widget.js on customer sites.
   Contract kept identical to the previous build: endpoints, payloads, the X-Chatbase-Host-Origin
   header, postMessage protocol ({source:"chatbase"} out, {source:"chatbase-host"} in) and the
   localStorage keys used for visitor continuity.
   ------------------------------------------------------------------------------------------------ */

type WidgetBot = { name: string; behavior: Behavior; appearance: Appearance };
type Identity = { visitor_id: string; name?: string; email?: string };
type WConversation = { id: string; title?: string; message_count?: number; last_message_at?: string; created_at?: string };
type View = "loading" | "lead" | "list" | "chat";

const identityKey = (id: string) => `chatbase_v2_${id}`;
const proactiveKey = (id: string) => `chatbase_proactive_seen_${id}`;
const store = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
  remove(k: string) { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
function readIdentity(id: string): Identity | null {
  const raw = store.get(identityKey(id));
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v?.visitor_id) return null;
    return Date.now() - (v.last_active || 0) > 2592e6 ? null : v; // 30 days
  } catch { return null; }
}
const writeIdentity = (id: string, v: Identity) => store.set(identityKey(id), JSON.stringify({ ...v, last_active: Date.now() }));
const clamp = (v: unknown, def: number, min: number, max: number) => { const n = Number(v); return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : def; };
const msg = (role: ChatMessage["role"], content: string): ChatMessage => ({ role, content, created_at: new Date().toISOString() });
const uuid = () => (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(v);
const SHADOWS = ["none", "0 8px 20px rgba(15, 23, 42, 0.16)", "0 16px 42px rgba(15, 23, 42, 0.22)", "0 22px 58px rgba(15, 23, 42, 0.28)", "0 28px 76px rgba(15, 23, 42, 0.36)"];
const detailOf = (e: unknown, fb: string) => {
  const d = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail;
  return typeof d === "string" && d ? d : fb;
};

export default function Widget() {
  const { publicId = "" } = useParams();
  const [params] = useSearchParams();
  const sandbox = params.get("sandbox") === "1";
  const hostOrigin = params.get("host_origin") || "";
  const hostHeaders = useMemo((): Record<string, string> => (hostOrigin ? { "X-Chatbase-Host-Origin": hostOrigin } : {}), [hostOrigin]);
  const client = useRef<AxiosInstance>(
    sandbox
      ? axios.create({ baseURL: API_BASE, headers: getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {} })
      : axios.create({ baseURL: API_BASE, headers: hostHeaders }),
  ).current;

  const [bot, setBot] = useState<WidgetBot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("loading");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [conversations, setConversations] = useState<WConversation[]>([]);
  const [conversation, setConversation] = useState<WConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [page, setPage] = useState({ url: "", title: "" });
  const [sidebar, setSidebar] = useState(false);
  const [proactive, setProactive] = useState(false);
  const [transcript, setTranscript] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [transcriptBusy, setTranscriptBusy] = useState(false);
  const botRef = useRef(bot); botRef.current = bot;
  const identityRef = useRef(identity); identityRef.current = identity;

  // Transparent page so only the launcher / panel is visible on the host site.
  useEffect(() => {
    const html = document.documentElement.style, body = document.body.style, root = document.getElementById("root");
    const prev = { h: html.background, b: body.background, m: body.margin, r: root?.style.background, o: body.overflow };
    html.background = "transparent"; body.background = "transparent"; body.margin = "0"; body.overflow = "hidden";
    if (root) root.style.background = "transparent";
    return () => { html.background = prev.h; body.background = prev.b; body.margin = prev.m; body.overflow = prev.o; if (root) root.style.background = prev.r || ""; };
  }, []);

  // Messages from the host page (page context + programmatic open).
  useEffect(() => {
    const on = (e: MessageEvent) => {
      const d = e.data;
      if (!d || d.source !== "chatbase-host") return;
      if (d.url) setPage({ url: d.url, title: d.title || "" });
      if (d.action === "open") { setProactive(false); store.set(proactiveKey(publicId), String(Date.now())); setOpen(true); }
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [publicId]);

  // Load the bot.
  useEffect(() => {
    client.get(`/widget/bot/${publicId}`, { params: sandbox ? { sandbox: "1" } : undefined })
      .then((r) => setBot(r.data))
      .catch((e) => setLoadError(detailOf(e, "Could not load chatbot")));
  }, [client, publicId, sandbox]);

  // Proactive popup after the configured delay (once per visitor).
  useEffect(() => {
    if (!bot || sandbox || open || !bot.behavior?.proactive_message) { if (open) setProactive(false); return; }
    if (store.get(proactiveKey(publicId))) return;
    const t = setTimeout(() => { if (!store.get(proactiveKey(publicId))) setProactive(true); }, 1000 * clamp(bot.behavior?.proactive_delay_seconds, 5, 1, 120));
    return () => clearTimeout(t);
  }, [bot, sandbox, open, publicId]);

  const dismissProactive = useCallback(() => { setProactive(false); store.set(proactiveKey(publicId), String(Date.now())); }, [publicId]);
  const openWidget = useCallback(() => { dismissProactive(); setOpen(true); }, [dismissProactive]);

  // View tracking (non-sandbox).
  useEffect(() => {
    if (!bot || sandbox) return;
    const id = readIdentity(publicId);
    client.post("/widget/view", { chatbot_id: publicId, visitor_id: id?.visitor_id || null, page_url: page.url || null, referrer: document.referrer || null }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot, publicId, sandbox]);

  // Initial view: sandbox → chat; no lead form → chat; known visitor → restore; else lead form.
  useEffect(() => {
    if (!bot) return;
    const welcome = bot.behavior.welcome_message || "Hi! How can I help?";
    if (sandbox) {
      setIdentity({ visitor_id: "sandbox-visitor", name: "Preview", email: "preview@example.com" });
      setConversation({ id: "sandbox-conv", title: "Preview chat" });
      setView("chat"); setOpen(true); setMessages([msg("assistant", welcome)]);
      return;
    }
    if (!bot.behavior.require_lead) { setView("chat"); setMessages([msg("assistant", welcome)]); return; }
    const saved = readIdentity(publicId);
    if (!saved) { setView("lead"); return; }
    client.post("/widget/visitor/restore", { chatbot_id: publicId, visitor_id: saved.visitor_id })
      .then((r) => {
        const v = r.data.visitor;
        const id = { visitor_id: v.id, name: v.name || saved.name, email: v.email || saved.email };
        setIdentity(id);
        setConversations(r.data.conversations || []);
        writeIdentity(publicId, { visitor_id: v.id, name: v.name, email: v.email });
        setView("list");
      })
      .catch(() => { store.remove(identityKey(publicId)); setView("lead"); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bot, publicId]);

  const openConversation = useCallback(async (c?: WConversation | null) => {
    if (!c) { setView("list"); return; }
    const welcome = botRef.current?.behavior?.welcome_message || "Hi! How can I help?";
    setConversation(c); setView("chat");
    if ((c.message_count || 0) > 0) {
      try {
        const { data } = await client.get(`/widget/conversation/${c.id}/messages`, { params: { chatbot_id: publicId, visitor_id: identityRef.current?.visitor_id } });
        setMessages(data.messages || []);
      } catch { setMessages([msg("assistant", welcome)]); }
    } else setMessages([msg("assistant", welcome)]);
  }, [client, publicId]);

  const onLeadCaptured = useCallback((r: { visitor_id: string; conversations?: WConversation[]; is_returning?: boolean; name: string; email: string }) => {
    const id = { visitor_id: r.visitor_id, name: r.name, email: r.email };
    identityRef.current = id;
    setIdentity(id);
    setConversations(r.conversations || []);
    writeIdentity(publicId, id);
    if (r.is_returning || r.conversations?.length !== 1) setView("list");
    else openConversation(r.conversations[0]);
  }, [publicId, openConversation]);

  const newConversation = useCallback(async () => {
    if (!identity) return;
    try {
      const { data } = await client.post("/widget/conversation", { chatbot_id: publicId, visitor_id: identity.visitor_id, page_url: page.url });
      setConversations((l) => [data, ...l]);
      openConversation(data);
    } catch { /* ignore */ }
  }, [client, identity, publicId, page.url, openConversation]);

  const sendTranscript = useCallback(async () => {
    if (!conversation || !identity || transcriptBusy) return;
    setTranscriptBusy(true); setTranscript(null);
    try {
      const { data } = await client.post("/widget/transcript-email", { chatbot_id: publicId, visitor_id: identity.visitor_id, conversation_id: conversation.id });
      setTranscript({ type: "success", message: `Sent to ${data.sent_to}.` });
    } catch (e) { setTranscript({ type: "error", message: detailOf(e, "Couldn't send transcript right now.") }); }
    finally { setTranscriptBusy(false); }
  }, [client, conversation, identity, publicId, transcriptBusy]);
  useEffect(() => { if (!transcript) return; const t = setTimeout(() => setTranscript(null), 4000); return () => clearTimeout(t); }, [transcript]);

  /* ---------- Appearance ---------- */
  const a = bot?.appearance || {};
  const primary = isHex(a.primary_color) ? a.primary_color : "#E57119";
  const accent = isHex(a.accent_color) ? a.accent_color : primary;
  const width = clamp(a.chat_width, 420, 320, 720);
  const height = clamp(a.chat_height, 640, 400, 900);
  const radius = clamp(a.border_radius, 0, 0, 32);
  const shadow = SHADOWS[clamp(a.shadow_intensity, 2, 0, 4)] || SHADOWS[2];
  const position = a.position === "bottom-left" ? "bottom-left" : "bottom-right";
  const dark = a.theme === "dark";
  const showProactive = proactive && !open && !!bot?.behavior?.proactive_message;
  const hasLabel = !!a.bubble_label;
  const closedWidth = showProactive ? 360 : hasLabel ? 240 : 88;
  const closedHeight = showProactive ? 148 : 88;

  // Tell the host page how big the iframe should be.
  useEffect(() => {
    try {
      window.parent?.postMessage({
        source: "chatbase", type: "resize", open, width, height, closedWidth, closedHeight,
        bottomOffset: open ? 0 : 64, position, radius: open ? radius : 0, shadow: open ? shadow : "none",
      }, "*");
    } catch { /* ignore */ }
  }, [open, width, height, closedWidth, closedHeight, position, radius, shadow]);

  if (loadError) return <div className="wg-error">{loadError}</div>;
  if (!bot) return null;

  const vars = {
    "--wg-primary": primary,
    "--wg-accent": accent,
    "--wg-user": a.user_bubble_color || primary,
    "--wg-bot": a.bot_bubble_color || (dark ? "#1A1A1D" : "#FFFFFF"),
    "--wg-bg": a.background_color || (dark ? "#0B0B0D" : "#FFFFFF"),
    "--wg-panel": a.background_color || (dark ? "#0B0B0D" : "#F7F7F7"),
    "--wg-text": a.text_color || (dark ? "#FFFFFF" : "#111111"),
    "--wg-radius": `${radius}px`,
    "--wg-bubble-radius": `${Math.max(8, Math.min(18, radius || 14))}px`,
    fontFamily: a.font_family || '"Lato", system-ui, -apple-system, "Segoe UI", sans-serif',
  } as CSSProperties;

  return (
    <div className={`wg ${dark ? "wg--dark" : ""}`} style={vars}>
      {open ? (
        <div className="wg-panel" style={{ borderRadius: radius, boxShadow: shadow }}>
          <Header
            bot={bot}
            onClose={() => setOpen(false)}
            onBack={view === "chat" && conversations.length > 0 && identity ? () => { setView("list"); setConversation(null); setMessages([]); } : null}
            onToggleSidebar={view === "chat" && conversations.length > 1 ? () => setSidebar((s) => !s) : null}
            transcript={view === "chat" && bot.behavior?.send_transcript_to_visitor && !!conversation?.id ? { onSend: sendTranscript, busy: transcriptBusy, status: transcript } : null}
          />
          {view === "loading" && <div className="wg-center"><span className="wg-dots"><i /><i /><i /></span></div>}
          {view === "lead" && <LeadForm client={client} publicId={publicId} pageUrl={page.url} onCaptured={onLeadCaptured} />}
          {view === "list" && identity && <ConversationList identity={identity} conversations={conversations} onOpen={openConversation} onNew={newConversation} />}
          {view === "chat" && (
            <ChatView
              bot={bot} publicId={publicId} sandbox={sandbox} identity={identity} conversation={conversation} conversations={conversations}
              sidebarOpen={sidebar} onCloseSidebar={() => setSidebar(false)}
              onSwitch={(c) => { setSidebar(false); openConversation(c); }} onNew={() => { setSidebar(false); newConversation(); }}
              onConversationUpdate={(c) => { if (sandbox) return; setConversation(c); setConversations((l) => [c, ...l.filter((x) => x.id !== c.id)]); }}
              messages={messages} setMessages={setMessages} page={page} client={client} hostHeaders={hostHeaders} showAvatar={a.show_avatar !== false} logoUrl={a.logo_url}
            />
          )}
          {bot.behavior.show_branding && (
            <div className="wg-brand"><svg aria-hidden width="14" height="14" viewBox="0 0 48 48" fill="none"><rect x="1" y="1" width="46" height="46" rx="14" fill="#E57119" /><path d="M32 14H24C18.477 14 14 18.477 14 24C14 29.523 18.477 34 24 34H26L33 39V29H24" stroke="#111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="29" cy="22" r="2" fill="#111" /><circle cx="35" cy="22" r="2" fill="#111" /></svg><span>Powered by <a href="/" target="_blank" rel="noreferrer"><b>IT</b>Niche ChatBOT</a></span></div>
          )}
        </div>
      ) : (
        <div className={`wg-closed wg-closed--${position}`}>
          {showProactive && (
            <div className="wg-proactive">
              <button type="button" className="wg-proactive__msg" onClick={openWidget} style={{ borderRadius: Math.max(12, radius) }}>{bot.behavior.proactive_message}</button>
              <button type="button" className="wg-proactive__close" aria-label="Dismiss" onClick={dismissProactive}><X size={12} /></button>
            </div>
          )}
          <button type="button" className={`wg-launcher ${hasLabel ? "has-label" : ""}`} onClick={openWidget} aria-label="Open chat">
            {a.launcher_icon_url ? <img src={a.launcher_icon_url} alt="" /> : <MessageCircle fill="currentColor" strokeWidth={1.5} />}
            {hasLabel && <span>{a.bubble_label}</span>}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Header ---------- */
function Header({ bot, onClose, onBack, onToggleSidebar, transcript }: {
  bot: WidgetBot; onClose: () => void; onBack: (() => void) | null; onToggleSidebar: (() => void) | null;
  transcript: { onSend: () => void; busy: boolean; status: { type: "success" | "error"; message: string } | null } | null;
}) {
  return (
    <div className="wg-header">
      {onToggleSidebar && <button type="button" className="wg-hbtn" onClick={onToggleSidebar} aria-label="Your chats"><MenuIcon /></button>}
      {onBack && <button type="button" className="wg-hbtn" onClick={onBack} aria-label="Back to chats"><ChevronLeft /></button>}
      <div className="wg-header__logo">
        {bot.appearance.logo_url ? <img src={bot.appearance.logo_url} alt="" /> : <span>{bot.name.charAt(0)}</span>}
        <i className="wg-online" aria-hidden />
      </div>
      <div className="wg-header__text">
        <div className="wg-header__name">{bot.name}</div>
        <div className="wg-header__tag">{bot.behavior?.tagline || "Online · usually replies instantly"}</div>
      </div>
      {transcript && (
        <div style={{ position: "relative" }}>
          <button type="button" className="wg-hbtn" onClick={transcript.onSend} disabled={transcript.busy} aria-label="Email transcript" title="Email me this conversation"><Mail /></button>
          {transcript.status && <div className={`wg-toast wg-toast--${transcript.status.type}`} role="status">{transcript.status.message}</div>}
        </div>
      )}
      <button type="button" className="wg-hbtn" onClick={onClose} aria-label="Close chat"><X /></button>
    </div>
  );
}

/* ---------- Lead form ---------- */
function LeadForm({ client, publicId, pageUrl, onCaptured }: { client: AxiosInstance; publicId: string; pageUrl: string; onCaptured: (r: { visitor_id: string; conversations?: WConversation[]; is_returning?: boolean; name: string; email: string }) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = validateEmail(email);
    if (!em.valid) { setEmail(em.email); setError(em.message); return; }
    setEmail(em.email);
    const ph = validatePhone(phone);
    if (!ph.valid) { setPhone(ph.phone); setError(ph.message); return; }
    setPhone(ph.phone); setBusy(true); setError("");
    try {
      const { data } = await client.post("/widget/lead", { chatbot_id: publicId, session_id: uuid(), name, email: em.email, phone: ph.phone || null, page_url: pageUrl });
      onCaptured({ ...data, name, email: em.email });
    } catch (err) { setError(detailOf(err, "Could not submit")); }
    finally { setBusy(false); }
  };

  return (
    <form className="wg-body wg-lead" onSubmit={submit}>
      <div className="wg-lead__intro">
        <div className="wg-lead__badge" aria-hidden>👋</div>
        <div className="wg-lead__title">Before we chat</div>
        <p>Tell us a bit about you and we'll take it from there. We'll also restore any past conversations.</p>
      </div>
      <label className="wg-field"><span>Name</span><input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></label>
      <label className="wg-field"><span>Email</span>
        <input required type="email" value={email} autoComplete="email" aria-invalid={!!error}
          onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
          onBlur={() => { if (!email) return; const r = validateEmail(email); setEmail(r.email); if (!r.valid) setError(r.message); }} />
      </label>
      <label className="wg-field"><span>Phone <em>(optional)</em></span>
        <input value={phone} inputMode="tel" autoComplete="tel" aria-invalid={!!error}
          onChange={(e) => { setPhone(e.target.value); if (error) setError(""); }}
          onBlur={() => { if (!phone) return; const r = validatePhone(phone); setPhone(r.phone); if (!r.valid) setError(r.message); }} />
      </label>
      {error && <div className="wg-error-text" role="alert">{error}</div>}
      <button type="submit" className="wg-primary-btn" disabled={busy}>{busy ? <span className="wg-dots wg-dots--light"><i /><i /><i /></span> : <>Start chat <ArrowRight size={16} /></>}</button>
    </form>
  );
}

/* ---------- Conversation list ---------- */
function ConversationList({ identity, conversations, onOpen, onNew }: { identity: Identity; conversations: WConversation[]; onOpen: (c: WConversation) => void; onNew: () => void }) {
  return (
    <div className="wg-body wg-list">
      <div>
        <div className="wg-lead__title">Welcome back, {firstName(identity)} <span aria-hidden>👋</span></div>
        <p className="wg-muted">Pick up where you left off, or start a new conversation.</p>
      </div>
      <div className="wg-list__items">
        {conversations.length === 0 && <p className="wg-muted">No previous chats yet.</p>}
        {conversations.map((c) => (
          <button key={c.id} type="button" className="wg-conv" onClick={() => onOpen(c)}>
            <MessagesSquare size={18} />
            <span className="wg-conv__body"><span className="wg-conv__title">{c.title || "Conversation"}</span><span className="wg-conv__meta">{c.message_count || 0} msgs · {relativeTime(c.last_message_at || c.created_at)}</span></span>
          </button>
        ))}
      </div>
      <button type="button" className="wg-primary-btn" onClick={onNew}><Plus size={16} /> Start new chat</button>
    </div>
  );
}

/* ---------- Chat ---------- */
function ChatView(props: {
  bot: WidgetBot; publicId: string; sandbox: boolean; identity: Identity | null; conversation: WConversation | null; conversations: WConversation[];
  sidebarOpen: boolean; onCloseSidebar: () => void; onSwitch: (c: WConversation) => void; onNew: () => void; onConversationUpdate: (c: WConversation) => void;
  messages: ChatMessage[]; setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>; page: { url: string; title: string };
  client: AxiosInstance; hostHeaders: Record<string, string>; showAvatar: boolean; logoUrl?: string | null;
}) {
  const { bot, publicId, sandbox, identity, conversation, messages, setMessages, page, client, hostHeaders } = props;
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const inputRef = useRef(input); inputRef.current = input;
  const speech = useSpeech(() => inputRef.current, setInput);
  const starters = bot.behavior.starter_questions || [];

  useEffect(() => { if (stick.current) end.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => { stick.current = true; end.current?.scrollIntoView({ behavior: "auto" }); }, [conversation?.id]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    speech.stop();
    setMessages((m) => [...m, msg("user", text), { role: "assistant", content: "", created_at: null }]);
    setInput(""); setBusy(true); stick.current = true;
    try {
      const url = sandbox ? `${API_BASE}/builder/preview-chat` : `${API_BASE}/widget/chat`;
      const body = sandbox
        ? { chatbot_id: publicId, message: text, history: messages.filter((m) => m.content).map((m) => ({ role: m.role, content: m.content })), page_url: page.url || null }
        : { chatbot_id: publicId, session_id: conversation?.id || uuid(), visitor_id: identity?.visitor_id, conversation_id: conversation?.id, message: text, page_url: page.url, page_title: page.title };
      const token = getAccessToken();
      await streamChat(url, body, {
        headers: sandbox ? (token ? { Authorization: `Bearer ${token}` } : {}) : hostHeaders,
        onToken: (t) => setMessages((list) => {
          const last = list[list.length - 1];
          if (!last || last.role !== "assistant") return list;
          return [...list.slice(0, -1), { ...last, content: (last.content || "") + t, created_at: last.created_at || new Date().toISOString() }];
        }),
      });
      if (!sandbox && conversation?.id && identity?.visitor_id) {
        try {
          const { data } = await client.get(`/widget/conversation/${conversation.id}/messages`, { params: { chatbot_id: publicId, visitor_id: identity.visitor_id } });
          if (data?.conversation) props.onConversationUpdate(data.conversation);
          if (data?.messages?.length) setMessages(data.messages);
        } catch { /* keep streamed copy */ }
      }
    } catch {
      setMessages((list) => {
        const copy = [...list];
        const last = copy[copy.length - 1];
        if (last && last.role === "assistant" && !last.content) copy[copy.length - 1] = { ...last, content: "Sorry, something went wrong.", created_at: last.created_at || new Date().toISOString() };
        return copy;
      });
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="wg-body wg-thread" ref={scroller} onScroll={() => { const el = scroller.current; if (el) stick.current = el.scrollHeight - el.clientHeight - el.scrollTop < 80; }}>
        {props.sidebarOpen && (
          <div className="wg-sidebar">
            <div className="wg-sidebar__panel">
              <div className="wg-sidebar__head"><strong>Your chats</strong><button type="button" className="wg-icon" onClick={props.onCloseSidebar} aria-label="Close"><X size={16} /></button></div>
              <button type="button" className="wg-primary-btn wg-primary-btn--sm" onClick={props.onNew}><Plus size={14} /> New chat</button>
              {props.conversations.map((c) => (
                <button key={c.id} type="button" className={`wg-conv ${conversation?.id === c.id ? "is-active" : ""}`} onClick={() => props.onSwitch(c)}>
                  <span className="wg-conv__body"><span className="wg-conv__title">{c.title || "Conversation"}</span><span className="wg-conv__meta">{c.message_count || 0} msgs · {relativeTime(c.last_message_at || c.created_at)}</span></span>
                </button>
              ))}
            </div>
            <div className="wg-sidebar__scrim" onClick={props.onCloseSidebar} />
          </div>
        )}

        {messages.length <= 1 && !busy && (
          <div className="wg-intro">
            <span className="wg-intro__avatar">{props.logoUrl ? <img src={props.logoUrl} alt="" /> : bot.name.charAt(0)}</span>
            <span className="wg-intro__name">{bot.name}</span>
            <span className="wg-intro__tag">{bot.behavior?.tagline || "Online · usually replies instantly"}</span>
          </div>
        )}

        {messages.map((m, i) => {
          const time = fmtTime(m.created_at);
          return (
            <div key={(m as { id?: string }).id || `${m.role}-${i}`}>
              {startsNewDay(messages, i) && <div className="wg-day">{fmtDay(m.created_at)}</div>}
              <div className={`wg-msg wg-msg--${m.role}`}>
                {m.role === "assistant" && props.showAvatar && (
                  <span className="wg-avatar">{props.logoUrl ? <img src={props.logoUrl} alt="" /> : bot.name.charAt(0)}</span>
                )}
                <div className="wg-msg__col">
                  <div className="wg-bubble">
                    {m.content ? <Markdown content={m.content} /> : m.role === "assistant" && busy ? <span className="wg-dots" aria-label="Typing"><i /><i /><i /></span> : null}
                  </div>
                  {time && <div className="wg-time">{time}</div>}
                </div>
              </div>
            </div>
          );
        })}

        {messages.length <= 1 && starters.length > 0 && (
          <div className="wg-starters">
            <div className="wg-starters__label">Try asking</div>
            {starters.map((s, i) => <button key={i} type="button" className="wg-starter" onClick={() => send(s)}>{s}<ArrowRight size={13} /></button>)}
          </div>
        )}
        <div ref={end} />
      </div>

      <form className="wg-composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <div className="wg-composer__box">
          <input value={input} onChange={(e) => { setInput(e.target.value); if (speech.error) speech.clearError(); }} placeholder={speech.listening ? "Listening..." : "Type your message..."} disabled={busy} aria-label="Message" />
          {speech.supported && (
            <button type="button" className={`wg-icon ${speech.listening ? "is-active" : ""}`} disabled={busy} onClick={speech.toggle}
              aria-label={speech.listening ? "Stop voice input" : "Start voice input"} title={speech.listening ? "Stop voice input" : "Speak your message"}>
              {speech.listening ? <Square size={14} fill="currentColor" /> : <Mic size={18} />}
            </button>
          )}
          <button type="submit" className="wg-send" disabled={busy || !input.trim()} aria-label="Send"><ArrowUp size={18} /></button>
        </div>
        {(speech.listening || speech.error) && <div className={`wg-hint ${speech.error ? "is-error" : ""}`}>{speech.error || "Listening... speak now"}</div>}
      </form>
    </>
  );
}
