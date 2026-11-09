/**
 * Animated SVG illustrations for the landing page "Everything you need" section.
 * Colours come from CSS classes (fx-*) so they follow the light/dark theme; motion is
 * pure CSS (see .fx-* keyframes in marketing.css), paused off-screen and disabled for
 * prefers-reduced-motion by the global rule in base.css.
 */

const CHAT_GLYPH = "M32 14H24C18.477 14 14 18.477 14 24C14 29.523 18.477 34 24 34H26L33 39V29H24";

/** Small Chatbase-style tile used as the "assistant" in several scenes. */
export function BotTile({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="1" y="1" width="46" height="46" rx="14" className="fx-brand" />
      <path d={CHAT_GLYPH} fill="none" stroke="#111" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="29" cy="22" r="2" fill="#111" /><circle cx="35" cy="22" r="2" fill="#111" />
    </g>
  );
}

/** Knowledge: documents and web pages flow into the assistant, which answers. */
export function KnowledgeArt() {
  const paths = ["M96 38 C 160 38, 170 85, 214 85", "M96 85 L 214 85", "M96 132 C 160 132, 170 85, 214 85"];
  return (
    <svg viewBox="0 0 480 170" className="fx" aria-hidden>
      {paths.map((d, i) => <path key={i} d={d} className="fx-line fx-flow" style={{ animationDelay: `${i * -0.4}s` }} />)}
      {paths.map((d, i) => <circle key={`p${i}`} r="3.5" className="fx-brand fx-travel" style={{ offsetPath: `path("${d}")`, animationDelay: `${i * 0.7}s` }} />)}
      {[
        { y: 18, label: "PDF", tag: "fx-tag--a" },
        { y: 65, label: "DOCX", tag: "fx-tag--b" },
        { y: 112, label: "WEB", tag: "fx-tag--c" },
      ].map((d, i) => (
        <g key={d.label} className="fx-bob" style={{ animationDelay: `${i * 0.35}s` }}>
          <rect x="30" y={d.y} width="66" height="40" rx="8" className="fx-surface fx-stroke" />
          <rect x="38" y={d.y + 8} width="22" height="10" rx="3" className={`fx-tag ${d.tag}`} />
          <text x="49" y={d.y + 15.5} textAnchor="middle" className="fx-tagtext">{d.label}</text>
          <rect x="38" y={d.y + 24} width="48" height="4" rx="2" className="fx-soft" />
          <rect x="38" y={d.y + 31} width="34" height="4" rx="2" className="fx-soft" />
        </g>
      ))}
      <circle cx="238" cy="85" r="34" className="fx-tint fx-pulse" />
      <BotTile x={214} y={61} />
      <path d="M262 85 L 300 85" className="fx-line fx-flow" />
      <g className="fx-pop" style={{ animationDelay: ".2s" }}>
        <rect x="300" y="40" width="150" height="38" rx="12" className="fx-surface fx-stroke" />
        <rect x="314" y="52" width="96" height="5" rx="2.5" className="fx-ink-soft" />
        <rect x="314" y="62" width="70" height="5" rx="2.5" className="fx-soft" />
      </g>
      <g className="fx-pop" style={{ animationDelay: ".9s" }}>
        <rect x="300" y="88" width="150" height="46" rx="12" className="fx-surface fx-stroke" />
        <rect x="314" y="100" width="110" height="5" rx="2.5" className="fx-ink-soft" />
        <rect x="314" y="110" width="84" height="5" rx="2.5" className="fx-soft" />
        <rect x="314" y="120" width="52" height="5" rx="2.5" className="fx-brand-soft" />
      </g>
    </svg>
  );
}

/** Lead capture: a pre-chat form fills itself in, then a lead is captured. */
export function LeadArt() {
  return (
    <svg viewBox="0 0 320 170" className="fx" aria-hidden>
      <rect x="40" y="14" width="180" height="142" rx="14" className="fx-surface fx-stroke" />
      <rect x="56" y="28" width="70" height="7" rx="3.5" className="fx-ink-soft" />
      {[48, 78, 108].map((y, i) => (
        <g key={y}>
          <rect x="56" y={y} width="148" height="22" rx="7" className="fx-field" />
          <rect x="64" y={y + 8} width={[78, 104, 62][i]} height="6" rx="3" className="fx-ink-soft fx-type" style={{ animationDelay: `${i * 0.6}s` }} />
        </g>
      ))}
      <rect x="56" y="136" width="148" height="12" rx="6" className="fx-brand" opacity=".9" />
      <g className="fx-badge">
        <circle cx="226" cy="36" r="17" className="fx-success" />
        <path d="M218 36 l6 6 l10 -12" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="fx-slide">
        <rect x="196" y="112" width="104" height="34" rx="17" className="fx-ink" />
        <circle cx="214" cy="129" r="9" className="fx-brand" />
        <text x="230" y="133" className="fx-chiptext">New lead</text>
      </g>
    </svg>
  );
}

/** On-brand: the widget re-colours itself through brand palettes. */
export function BrandArt() {
  return (
    <svg viewBox="0 0 320 170" className="fx" aria-hidden>
      <rect x="56" y="12" width="150" height="128" rx="14" className="fx-surface fx-stroke" />
      <path d="M56 26 a14 14 0 0 1 14 -14 h122 a14 14 0 0 1 14 14 v16 h-150 z" className="fx-recolor" />
      <circle cx="74" cy="27" r="7" fill="#fff" opacity=".35" />
      <rect x="88" y="23" width="54" height="7" rx="3.5" fill="#fff" opacity=".85" />
      <rect x="68" y="56" width="92" height="20" rx="8" className="fx-field" />
      <rect x="104" y="84" width="90" height="20" rx="8" className="fx-recolor" />
      <rect x="68" y="112" width="70" height="18" rx="8" className="fx-field" />
      <circle cx="236" cy="128" r="18" className="fx-recolor" />
      <path d="M229 124 h14 M229 131 h9" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <g>
        {["#E57119", "#111111", "#2457C5", "#16A34A"].map((c, i) => <circle key={c} cx={228 + i * 20} cy="40" r="7" fill={c} />)}
        <circle cx="228" cy="40" r="11" fill="none" className="fx-ring" />
      </g>
    </svg>
  );
}

/** Voice & rules: tone, length and strictness controls tuning the assistant. */
export function VoiceArt() {
  const rows = [{ y: 40, label: "Tone" }, { y: 80, label: "Length" }];
  return (
    <svg viewBox="0 0 320 170" className="fx" aria-hidden>
      {rows.map((r, i) => (
        <g key={r.label}>
          <text x="40" y={r.y - 10} className="fx-label">{r.label}</text>
          <rect x="40" y={r.y} width="240" height="6" rx="3" className="fx-soft" />
          <rect x="40" y={r.y} width="240" height="6" rx="3" className="fx-brand fx-fill" style={{ animationDelay: `${i * -1.4}s` }} />
          <circle cx="40" cy={r.y + 3} r="9" className="fx-surface fx-knob fx-slide-knob" style={{ animationDelay: `${i * -1.4}s` }} />
        </g>
      ))}
      <text x="40" y="118" className="fx-label">Answer only from knowledge</text>
      <rect x="40" y="128" width="46" height="26" rx="13" className="fx-switch" />
      <circle cx="53" cy="141" r="9" fill="#fff" className="fx-switch-knob" />
      {["Friendly", "Formal", "Concise"].map((t, i) => (
        <g key={t} className="fx-chip" style={{ animationDelay: `${i * 1.2}s` }}>
          <rect x={112 + i * 58} y="130" width="52" height="22" rx="11" className="fx-chipbg" />
          <text x={138 + i * 58} y="144.5" textAnchor="middle" className="fx-chiplabel">{t}</text>
        </g>
      ))}
    </svg>
  );
}

/** Human hand-off: the assistant escalates to a person by email. */
export function HandoffArt() {
  const route = "M86 86 C 140 30, 190 30, 234 86";
  return (
    <svg viewBox="0 0 320 170" className="fx" aria-hidden>
      <BotTile x={38} y={62} />
      <path d={route} className="fx-line fx-flow" />
      <g className="fx-travel fx-travel--slow" style={{ offsetPath: `path("${route}")`, offsetRotate: "0deg" }}>
        <rect x="-14" y="-10" width="28" height="20" rx="4" className="fx-surface fx-stroke-brand" />
        <path d="M-14 -8 L0 2 L14 -8" fill="none" className="fx-stroke-brand-only" strokeWidth="2" strokeLinejoin="round" />
      </g>
      <circle cx="258" cy="86" r="26" className="fx-tint" />
      <circle cx="258" cy="80" r="9" className="fx-ink" />
      <path d="M241 104 a17 14 0 0 1 34 0 z" className="fx-ink" />
      <circle cx="278" cy="64" r="7" className="fx-brand fx-notify" />
      <rect x="196" y="124" width="104" height="28" rx="10" className="fx-surface fx-stroke fx-pop" style={{ animationDelay: "1.2s" }} />
      <text x="248" y="142" textAnchor="middle" className="fx-label fx-pop" style={{ animationDelay: "1.2s" }}>Team notified</text>
      <rect x="22" y="124" width="112" height="28" rx="10" className="fx-surface fx-stroke" />
      <text x="78" y="142" textAnchor="middle" className="fx-label">“Talk to a person”</text>
    </svg>
  );
}

/** Analytics: funnel bars grow and the trend line draws itself. */
export function AnalyticsArt() {
  const bars = [46, 70, 58, 88, 76, 104, 96, 122];
  return (
    <svg viewBox="0 0 480 170" className="fx" aria-hidden>
      {[40, 80, 120].map((y) => <line key={y} x1="30" x2="450" y1={y} y2={y} className="fx-grid" />)}
      {bars.map((h, i) => (
        <rect key={i} x={44 + i * 50} y={150 - h} width="26" height={h} rx="6" className={i === bars.length - 1 ? "fx-brand fx-grow" : "fx-brand-soft fx-grow"} style={{ animationDelay: `${i * 0.08}s` }} />
      ))}
      <path d="M57 118 L107 96 L157 104 L207 74 L257 82 L307 54 L357 60 L407 34" fill="none" className="fx-trend fx-draw" />
      <circle cx="407" cy="34" r="5" className="fx-brand fx-pulse-dot" />
      <g className="fx-bob" style={{ animationDelay: ".5s" }}>
        <rect x="36" y="8" width="118" height="40" rx="12" className="fx-surface fx-stroke fx-shadow" />
        <text x="50" y="25" className="fx-label">Leads this week</text>
        <text x="50" y="40" className="fx-kpi">+24%</text>
      </g>
    </svg>
  );
}
