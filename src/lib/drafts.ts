import { useEffect, useRef } from "react";
import { api } from "./api";

/**
 * Builder drafts — same behaviour and storage key as the previous build:
 * unsaved form state is mirrored to localStorage (`chatbase_builder_draft_<id>`) and
 * PUT /builder/chatbots/:id/draft (debounced 1.2s). Saving the bot clears both.
 */
export const draftKey = (id: string) => `chatbase_builder_draft_${id}`;

export type Draft = Record<string, Record<string, unknown> | undefined>;

export function readDraft(id: string): Draft | null {
  try {
    const raw = localStorage.getItem(draftKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearDraft(id: string) {
  try { localStorage.removeItem(draftKey(id)); } catch { /* ignore */ }
  api.delete(`/builder/chatbots/${id}/draft`).catch(() => {});
}

/** Debounced autosave of one draft section (e.g. "general", "aiProfile", "appearance"). */
export function useDraftAutosave(id: string, section: string, value: Record<string, unknown>, enabled = true) {
  const last = useRef("");
  const serialized = JSON.stringify(value);
  useEffect(() => {
    if (!enabled || !id) return;
    // Skip the very first render so opening a tab doesn't create a draft.
    if (!last.current) { last.current = serialized; return; }
    if (serialized === last.current) return;
    const t = setTimeout(() => {
      const next = { ...(readDraft(id) || {}), [section]: JSON.parse(serialized) };
      const body = JSON.stringify(next);
      try { localStorage.setItem(draftKey(id), body); } catch { /* ignore */ }
      api.put(`/builder/chatbots/${id}/draft`, next).catch(() => {});
      last.current = serialized;
    }, 1200);
    return () => clearTimeout(t);
  }, [id, section, serialized, enabled]);
}
