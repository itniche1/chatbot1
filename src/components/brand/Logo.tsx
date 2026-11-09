import { Sparkles } from "lucide-react";

/** The Chatbase mark: orange tile with a chat-bubble "C" (same artwork as /brand/chatbase-mark.svg). */
export function ChatbaseMark({ size = 36, title }: { size?: number; title?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} style={{ flex: "none", display: "block" }}>
      <rect x="1" y="1" width="46" height="46" rx="14" fill="#E57119" />
      <path d="M32 14H24C18.477 14 14 18.477 14 24C14 29.523 18.477 34 24 34H26L33 39V29H24" stroke="#111111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="29" cy="22" r="2" fill="#111111" />
      <circle cx="35" cy="22" r="2" fill="#111111" />
    </svg>
  );
}

/**
 * Product lockup: [mark] Chatbase. / A Product of IT Niche
 * `tone="light"` is for ink surfaces (sidebar, mobile top bar); "auto" follows the colour theme.
 */
export function ProductLogo({ tone = "auto", size = "md", compact = false }: { tone?: "dark" | "light" | "auto"; size?: "md" | "lg"; compact?: boolean }) {
  if (compact) return <BrandMark />;
  const lg = size === "lg";
  return (
    <span className={`cb-logo cb-logo--${tone} ${lg ? "cb-logo--lg" : ""}`}>
      <ChatbaseMark size={lg ? 44 : 32} />
      <span className="cb-logo__lockup">
        <span className="cb-logo__name">Chatbase<span className="cb-logo__dot">.</span></span>
        <span className="cb-logo__credit">A Product of <b>IT Niche</b></span>
      </span>
    </span>
  );
}

/** Square app mark used in the collapsed sidebar, loaders and anywhere a compact logo is needed. */
export function BrandMark({ size = 36 }: { size?: number }) {
  return <ChatbaseMark size={size} />;
}

/** The assistant's avatar — a warm orange tile with a spark. */
export function AiAvatar({ thinking = false }: { thinking?: boolean }) {
  return <span className={`ai-avatar ${thinking ? "is-thinking" : ""}`} aria-hidden><Sparkles /></span>;
}
