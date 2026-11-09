import { useSyncExternalStore } from "react";
import type { ChatMessage } from "./types";

/**
 * Assistant sessions (the full-page chat the workspace owner uses to talk to their bots).
 * The chat itself goes through the existing /builder/preview-chat endpoint (sandbox mode: no quota, no leads),
 * which does not persist history server-side — so sessions are kept in this browser, per user.
 */
export type AssistantSession = {
  id: string;
  title: string;
  botId: string;        // chatbot public_id (what the chat endpoint expects)
  botName: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

const MAX_SESSIONS = 50;
let userKey = "anon";
let cache: AssistantSession[] | null = null;
const listeners = new Set<() => void>();
const storageKey = () => `itniche_chatbot_sessions_${userKey}`;

function load(): AssistantSession[] {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(storageKey()) || "[]"); }
  catch { cache = []; }
  if (!Array.isArray(cache)) cache = [];
  return cache!;
}
function save(next: AssistantSession[]) {
  cache = next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, MAX_SESSIONS);
  try { localStorage.setItem(storageKey(), JSON.stringify(cache)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}

export const sessionStore = {
  setUser(id: string | undefined) {
    const next = id || "anon";
    if (next === userKey) return;
    userKey = next; cache = null;
    listeners.forEach((l) => l());
  },
  list: () => load(),
  get: (id: string) => load().find((s) => s.id === id) || null,
  upsert(s: AssistantSession) { save([s, ...load().filter((x) => x.id !== s.id)]); },
  rename(id: string, title: string) {
    const s = load().find((x) => x.id === id);
    if (s) save(load().map((x) => (x.id === id ? { ...x, title } : x)));
  },
  remove(id: string) { save(load().filter((s) => s.id !== id)); },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; },
};

export function useSessions() {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.list, sessionStore.list);
}

export function newId() {
  return (crypto as Crypto & { randomUUID?: () => string }).randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function titleFrom(text: string) {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length > 60 ? `${t.slice(0, 57).trimEnd()}…` : t || "New conversation";
}
