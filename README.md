# IT Niche ChatBOT — frontend

The redesigned frontend for IT Niche ChatBOT (previously "Chatbase"), branded to match itniche.com.
It was rebuilt as a new codebase because the original React source was not available. It talks to the **existing, unchanged `/api` backend**.

```bash
npm install
npm run dev        # http://localhost:5173 — proxies /api to the live backend (see .env.example)
npm run build      # outputs to build/ (same folder as the old Create React App build)
```

## Compatibility with the existing backend

Everything below was reverse-engineered from the live production bundle and kept identical. Do not change it without changing the backend too.

| Area | Contract |
|---|---|
| API base | `${VITE_BACKEND_URL}/api` (empty = same origin, as in production) |
| Auth | Bearer token from `localStorage.chatbase_access_token`; on 401, one refresh via `POST /auth/refresh` with `chatbase_refresh_token` |
| Streaming | `POST /widget/chat` and `POST /builder/preview-chat` return SSE events of the form `data: {"content": "…"}` |
| Widget route | `/widget/:publicId` (`?sandbox=1`, `?host_origin=` sent as the `X-Chatbase-Host-Origin` header) |
| Widget ↔ host | `postMessage({source:"chatbase", type:"resize", …})` out; `{source:"chatbase-host", url, title, action}` in |
| Visitor storage | `chatbase_v2_<id>`, `chatbase_proactive_seen_<id>` |
| Builder drafts | `chatbase_builder_draft_<id>` + `PUT/GET/DELETE /builder/chatbots/:id/draft`, with the same section keys (`general`, `aiProfile`, `appearance`) |
| Routes | All original routes are kept. `/app` now opens the Assistant; the old overview lives at `/app/overview` |

All endpoints used are in `src/lib/api.ts` callers. Search the source for `api.get` / `api.post` and similar to list them.

## New screens (built only on existing endpoints)

- **Assistant** (`/app`): full-page chat with your own chatbots via `/builder/preview-chat` (sandbox: no quota used, no leads created). That endpoint doesn't store history, so Assistant conversations are saved **in the browser** per user (`itniche_chatbot_sessions_<userId>`).
- **Knowledge Base** (`/app/knowledge`), **Integrations** (`/app/integrations`) and **Help** (`/app/help`): workspace-level views of existing per-chatbot features.
- **⌘/Ctrl+K search**: Assistant sessions plus `GET /messages/search`.

## Design system

- Version 3 ("IT Niche product"). Tokens are in `src/styles/tokens.css`; brand values come from itniche.com (orange `#E57119`, ink `#0B0B0D`, Lato).
- Primary actions are IT Niche orange (`--primary`), like the CTAs on itniche.com. Headlines are Lato 900 with tight tracking, and eyebrows are uppercase, tracked and orange (`.eyebrow`).
- The workspace sidebar, the dashboard hero (`.hero-band`), the Help hero, the auth panel and the landing CTA are **ink bands**, like the itniche.com footer. Page content sits on a warm off-white canvas (`--canvas`) with white cards (12px radius, soft shadows).
- Orange also marks state: active nav, tabs, switches, selected options, focus rings, meters and the main chart series.
- The embeddable widget still uses each chatbot owner's own colours from Appearance settings (intro card, suggestion chips and buttons are all tinted from `--wg-primary`).
- **Logo**: the Chatbase mark and "Chatbase. / A Product of IT Niche" lockup (`ProductLogo`, `ChatbaseMark` in `src/components/brand/Logo.tsx`; asset `public/brand/chatbase-mark.svg`, also the favicon).
- **Light / dark theme**: `html[data-theme]`, toggled by `ThemeToggle` (`src/lib/theme.tsx`) and stored in `localStorage.itniche_theme` (defaults to light). Dark values live in `src/styles/theme-dark.css`; use tokens (`--surface`, `--bg`, `--text`…) rather than literal colours so new UI works in both. The widget is excluded.
- **Landing feature scenes**: animated SVGs in `src/components/marketing/FeatureArt.tsx`, styled by `.fx-*` classes in `marketing.css` (paused off-screen, static under reduced motion).
- Components: `src/components/ui`; chat: `src/components/chat`; charts: `src/components/app/Charts.tsx` (plain SVG, no chart library).

## Structure

```
src/
  lib/          api client, auth, streaming, drafts, validation, sessions, formatting
  components/   ui kit, chat (Markdown, Composer), app chrome, marketing chrome, brand
  layouts/      AppLayout (workspace), AdminLayout
  pages/        public/ (landing, auth, legal), app/ (+ chatbot/ tabs), admin/, widget/
  styles/       tokens, base, components, layout, chat, marketing, widget
  data/legal.json   Privacy Policy / Terms text, copied verbatim from the previous build
```
