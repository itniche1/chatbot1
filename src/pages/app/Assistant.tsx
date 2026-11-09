import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2, Brain, Globe2, Workflow, Copy, Check, RefreshCw, ChevronDown, ArrowDown, Bot, AlertCircle, FlaskConical, Plus, Settings2,
} from "lucide-react";
import { API_BASE, getAccessToken } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useWorkspace } from "../../lib/workspace";
import { streamChat } from "../../lib/stream";
import { firstName, fmtDay, fmtTime, greeting, startsNewDay } from "../../lib/format";
import { newId, sessionStore, titleFrom, type AssistantSession } from "../../lib/sessions";
import type { ChatMessage } from "../../lib/types";
import { Markdown } from "../../components/chat/Markdown";
import { Composer, type ComposerHandle } from "../../components/chat/Composer";
import { AiAvatar } from "../../components/brand/Logo";
import { Button, EmptyState, Menu, MenuItem, Skeleton, useCopy } from "../../components/ui";

const SUGGESTED = [
  { icon: Building2, text: "Tell me about IT Niche services.", hint: "Overview of what IT Niche offers" },
  { icon: Brain, text: "How can AI improve my business?", hint: "Practical, high-impact use cases" },
  { icon: Globe2, text: "Explore website development solutions.", hint: "Sites that convert visitors" },
  { icon: Workflow, text: "How can I automate customer engagement?", hint: "Always-on, on-brand answers" },
];
const BOT_KEY = "itniche_assistant_bot";

type UiMessage = ChatMessage & { key: string; error?: string; streaming?: boolean };

const toUi = (m: ChatMessage): UiMessage => ({ ...m, key: newId() });

export default function Assistant() {
  const { user } = useAuth();
  const { bots } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = params.get("c");

  const [botId, setBotId] = useState<string | null>(() => { try { return localStorage.getItem(BOT_KEY); } catch { return null; } });
  const [messages, setMessagesState] = useState<UiMessage[]>([]);
  const listRef = useRef<UiMessage[]>([]);
  const setMessages = useCallback((next: UiMessage[]) => { listRef.current = next; setMessagesState(next); }, []);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionRef = useRef<AssistantSession | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const [showJump, setShowJump] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const composerRef = useRef<ComposerHandle>(null);

  const activeBots = useMemo(() => (bots || []), [bots]);
  const bot = useMemo(() => activeBots.find((b) => b.public_id === botId) || activeBots[0] || null, [activeBots, botId]);

  useEffect(() => { if (bot) { try { localStorage.setItem(BOT_KEY, bot.public_id); } catch { /* ignore */ } } }, [bot]);

  // Load the session from ?c=, or reset for a new conversation.
  useEffect(() => {
    abortRef.current?.abort();
    setBusy(false);
    if (sessionId && sessionRef.current?.id === sessionId) return; // just created by this view
    if (sessionId) {
      const s = sessionStore.get(sessionId);
      if (s) {
        sessionRef.current = s;
        setMessages(s.messages.map(toUi));
        if (s.botId) setBotId(s.botId);
        stickRef.current = true;
        return;
      }
    }
    sessionRef.current = null;
    setMessages([]);
    setTimeout(() => composerRef.current?.focus(), 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, location.state]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Auto-scroll while streaming unless the user scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const fromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
    stickRef.current = fromBottom < 80;
    setShowJump(fromBottom > 240);
    setScrolled(el.scrollTop > 4);
  };
  const jump = () => { const el = scrollRef.current; if (el) { stickRef.current = true; el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); } };

  const persist = useCallback((list: UiMessage[]) => {
    if (!bot) return;
    const clean: ChatMessage[] = list.filter((m) => m.content && !m.error).map(({ role, content, created_at }) => ({ role, content, created_at }));
    if (!clean.length) return;
    const now = new Date().toISOString();
    const prev = sessionRef.current;
    const s: AssistantSession = prev
      ? { ...prev, messages: clean, updatedAt: now }
      : { id: newId(), title: titleFrom(clean.find((m) => m.role === "user")?.content || ""), botId: bot.public_id, botName: bot.name, messages: clean, createdAt: now, updatedAt: now };
    sessionRef.current = s;
    sessionStore.upsert(s);
    if (!prev) setParams({ c: s.id }, { replace: true });
  }, [bot, setParams]);

  /** Streams an answer for `text`, given the conversation that precedes it. */
  const ask = useCallback(async (text: string, before: UiMessage[]) => {
    if (!bot || busy) return;
    const userMsg: UiMessage = { key: newId(), role: "user", content: text, created_at: new Date().toISOString() };
    const reply: UiMessage = { key: newId(), role: "assistant", content: "", created_at: null, streaming: true };
    const history = before.filter((m) => m.content && !m.error).map((m) => ({ role: m.role, content: m.content }));
    stickRef.current = true;
    setMessages([...before, userMsg, reply]);
    setBusy(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const token = getAccessToken();
    const update = (fn: (m: UiMessage) => UiMessage) => setMessages(listRef.current.map((m) => (m.key === reply.key ? fn(m) : m)));

    try {
      await streamChat(`${API_BASE}/builder/preview-chat`, {
        chatbot_id: bot.public_id,
        message: text,
        history,
        page_url: null,
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: ctrl.signal,
        onToken: (t) => update((m) => ({ ...m, content: m.content + t, created_at: m.created_at || new Date().toISOString() })),
      });
      update((m) => ({ ...m, streaming: false, ...(m.content ? {} : { error: "No response was returned. Try regenerating." }) }));
    } catch (e) {
      if ((e as Error).name === "AbortError") update((m) => ({ ...m, streaming: false, created_at: m.created_at || new Date().toISOString() }));
      else update((m) => ({ ...m, streaming: false, error: (e as Error).message || "Something went wrong." }));
    } finally {
      abortRef.current = null;
      setBusy(false);
      persist(listRef.current);
    }
  }, [bot, busy, persist, setMessages]);

  const send = (text: string) => ask(text, messages);
  const stop = () => abortRef.current?.abort();
  const regenerate = (assistantIndex: number) => {
    const userIdx = assistantIndex - 1;
    const userMsg = messages[userIdx];
    if (!userMsg || userMsg.role !== "user") return;
    ask(userMsg.content, messages.slice(0, userIdx));
  };

  /* ---------- Render ---------- */
  if (bots === null) {
    return <div className="chat"><div className="welcome"><Skeleton variant="block" width={64} height={64} /><Skeleton variant="title" width="60%" style={{ marginTop: 24 }} /><Skeleton width="80%" style={{ marginTop: 16 }} /></div></div>;
  }

  if (!bot) {
    return (
      <div className="chat">
        <div className="chat__scroll" style={{ display: "grid", placeItems: "center" }}>
          <EmptyState
            icon={<Bot />}
            title="Create your first chatbot to start chatting"
            description="The Assistant talks to your own chatbots using their live knowledge base and AI profile. Create one in under a minute."
            action={<Button icon={<Plus />} onClick={() => navigate("/app/chatbots?new=1")}>Create chatbot</Button>}
          />
        </div>
      </div>
    );
  }

  const empty = messages.length === 0;
  const lastAssistant = messages.map((m) => m.role).lastIndexOf("assistant");

  return (
    <div className="chat">
      <div className={`chat__header ${scrolled ? "is-scrolled" : ""}`}>
        <Menu align="left" trigger={({ open, toggle }) => (
          <button type="button" className="bot-picker" onClick={toggle} aria-expanded={open} aria-haspopup="menu" title="Choose which chatbot answers">
            <AiAvatar />
            <span className="truncate">{bot.name}</span>
            <span className={`bot-picker__dot ${bot.is_active ? "" : "is-paused"}`} title={bot.is_active ? "Active" : "Paused"} />
            <ChevronDown />
          </button>
        )}>
          {(close) => (
            <>
              <div className="menu__label">Chat with</div>
              {activeBots.map((b) => (
                <MenuItem key={b.id} icon={b.public_id === bot.public_id ? <Check /> : <Bot />} onClick={() => {
                  close();
                  if (b.public_id !== bot.public_id) { setBotId(b.public_id); if (messages.length) navigate("/app", { state: { fresh: Date.now() } }); }
                }}>
                  <span className="truncate">{b.name}</span>
                </MenuItem>
              ))}
              <div className="menu__sep" />
              <MenuItem icon={<Settings2 />} onClick={() => { close(); navigate(`/app/chatbots/${bot.id}`); }}>Configure {bot.name}</MenuItem>
            </>
          )}
        </Menu>
        <span className="spacer" />
        <span className="mode-pill" title="Uses your bot's live configuration and knowledge base. No quota used, no leads captured."><FlaskConical />Test mode</span>
      </div>

      <div className="chat__scroll" ref={scrollRef} onScroll={onScroll}>
        {empty ? (
          <div className="welcome">
            <div className="welcome__mark"><AiAvatar /></div>
            <div className="eyebrow welcome__eyebrow">AI-Powered Customer Engagement</div>
            <h1>Your Business. <em>Smarter</em> Conversations.</h1>
            <p className="welcome__sub">Meet IT Niche ChatBOT — an intelligent AI assistant designed to help businesses engage customers, answer questions, and turn conversations into opportunities.</p>
            <p className="welcome__greeting">{greeting()}, <strong>{firstName(user || null)}</strong>. You're chatting with <strong>{bot.name}</strong>.</p>
            <Composer ref={composerRef} onSend={send} onStop={stop} busy={busy} autoFocus />
            <div className="prompt-grid">
              {SUGGESTED.map(({ icon: Icon, text, hint }) => (
                <button key={text} type="button" className="prompt-card" onClick={() => send(text)} disabled={busy}>
                  <span className="prompt-card__icon"><Icon /></span>
                  <span><span className="prompt-card__text" style={{ display: "block" }}>{text}</span><span className="prompt-card__hint" style={{ display: "block" }}>{hint}</span></span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat__thread" aria-live="polite" aria-busy={busy}>
            {messages.map((m, i) => (
              <div key={m.key}>
                {startsNewDay(messages, i) && i > 0 && <DayDivider date={m.created_at} />}
                <Message m={m} canRegenerate={m.role === "assistant" && i === lastAssistant && !busy} onRegenerate={() => regenerate(i)} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showJump && !empty && <button type="button" className="jump" onClick={jump}><ArrowDown />Jump to latest</button>}

      {!empty && (
        <div className="chat__footer">
          <div className="chat__footer-inner">
            <Composer ref={composerRef} onSend={send} onStop={stop} busy={busy} autoFocus />
            <p className="chat__disclaimer">Answers come from <Link to={`/app/chatbots/${bot.id}`} className="link">{bot.name}</Link>’s knowledge base and AI profile. AI can make mistakes — review important information.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DayDivider({ date }: { date?: string | null }) {
  return (
    <div className="row" style={{ gap: 12, color: "var(--text-subtle)", fontSize: "var(--fs-xs)", fontWeight: 700 }}>
      <span style={{ flex: 1, height: 1, background: "var(--border)" }} />{fmtDay(date)}<span style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function Message({ m, canRegenerate, onRegenerate }: { m: UiMessage; canRegenerate: boolean; onRegenerate: () => void }) {
  const { copied, copy } = useCopy();
  if (m.role === "user") {
    return (
      <div className="msg msg--user">
        <div className="msg__body">
          <div className="msg__bubble">{m.content}</div>
          <div className="msg__meta">
            <time dateTime={m.created_at || undefined}>{fmtTime(m.created_at)}</time>
            <button type="button" className={`icon-btn icon-btn--sm ${copied ? "is-done" : ""}`} aria-label="Copy message" title="Copy" onClick={() => copy(m.content)}>{copied ? <Check /> : <Copy />}</button>
          </div>
        </div>
      </div>
    );
  }
  const thinking = m.streaming && !m.content;
  return (
    <div className="msg msg--assistant">
      <AiAvatar thinking={thinking} />
      <div className="msg__body">
        <div className="msg__bubble">
          {thinking ? <span className="typing" aria-label="Assistant is typing"><span /><span /><span /></span>
            : <Markdown content={m.content} className={m.streaming ? "is-streaming" : ""} />}
          {m.error && <div className="msg__error" role="alert"><AlertCircle />{m.error}</div>}
        </div>
        {!m.streaming && (
          <div className="msg__meta msg__actions">
            {m.created_at && <time dateTime={m.created_at}>{fmtTime(m.created_at)}</time>}
            {m.content && <button type="button" className={`icon-btn ${copied ? "is-done" : ""}`} aria-label="Copy response" title={copied ? "Copied" : "Copy"} onClick={() => copy(m.content)}>{copied ? <Check /> : <Copy />}</button>}
            {canRegenerate && <button type="button" className="icon-btn" aria-label="Regenerate response" title="Regenerate" onClick={onRegenerate}><RefreshCw /></button>}
          </div>
        )}
      </div>
    </div>
  );
}
