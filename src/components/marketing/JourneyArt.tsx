/**
 * Line-art scenes for the landing page "How it works" journey: hand-drawn style people
 * on a coloured blob, with light motion. Strokes and fills use theme tokens via .jx-* classes
 * (marketing.css), so the drawings invert cleanly in dark mode.
 */
import { BotTile } from "./FeatureArt";

type Hair = "short" | "long" | "bun" | "cap";
type Pt = [number, number];

/** A standing figure whose feet rest on the ground line (y≈236). Hands go wherever the scene needs them. */
function Person({ x, hair, left, right, armClass }: { x: number; hair: Hair; left: Pt; right: Pt; armClass?: { left?: string; right?: string } }) {
  const arm = ([hx, hy]: Pt, side: -1 | 1) => {
    const sx = x + side * 14, sy = 98;
    const cx = (sx + hx) / 2 + side * 10, cy = (sy + hy) / 2 + 10;
    return `M${sx} ${sy} Q${cx} ${cy} ${hx} ${hy}`;
  };
  const top = `M${x - 12} 67 C${x - 13} 52 ${x + 13} 50 ${x + 12} 64 C${x + 5} 60 ${x - 4} 61 ${x - 12} 67 Z`;
  return (
    <g>
      {hair === "long" && <path d={`M${x - 13} 62 C${x - 16} 86 ${x - 17} 102 ${x - 15} 118 L${x - 4} 112 L${x - 5} 72 Z`} className="jx-ink" />}
      <path d={`M${x - 8} 160 L${x - 9} 234 h-8 M${x + 8} 160 L${x + 9} 234 h8`} className="jx-line" />
      <path d={`M${x - 15} 94 Q${x} 86 ${x + 15} 94 L${x + 19} 162 L${x - 19} 162 Z`} className="jx-fill" />
      <path d={`M${x} 80 V88`} className="jx-line" />
      <circle cx={x} cy={68} r={12} className="jx-fill" />
      {hair === "cap"
        ? <><path d={`M${x - 13} 64 C${x - 12} 50 ${x + 12} 50 ${x + 13} 62 Z`} className="jx-ink" /><path d={`M${x + 8} 62 h12`} className="jx-line" /></>
        : <path d={top} className="jx-ink" />}
      {hair === "bun" && <circle cx={x + 2} cy={50} r={5.5} className="jx-ink" />}
      <g className={armClass?.left}><path d={arm(left, -1)} className="jx-line" /><circle cx={left[0]} cy={left[1]} r={3.5} className="jx-fill" /></g>
      <g className={armClass?.right}><path d={arm(right, 1)} className="jx-line" /><circle cx={right[0]} cy={right[1]} r={3.5} className="jx-fill" /></g>
    </g>
  );
}

function Diamond({ x, y, d = 0 }: { x: number; y: number; d?: number }) {
  return <rect x={x - 3.5} y={y - 3.5} width={7} height={7} transform={`rotate(45 ${x} ${y})`} className="jx-fill jx-twinkle" style={{ animationDelay: `${d}s` }} />;
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g className="jx-sway">
      <path d={`M${x} ${y} C${x} ${y - 22} ${x - 4} ${y - 36} ${x - 12} ${y - 46}`} className="jx-line" />
      <path d={`M${x - 12} ${y - 46} c-9 -5 -5 -18 6 -16 c4 7 1 13 -6 16z`} className="jx-fill" />
      <path d={`M${x - 1} ${y - 22} c9 -7 18 -3 17 6 c-7 3 -13 1 -17 -6z`} className="jx-fill" />
    </g>
  );
}

/** 01 — configuring the assistant on a board. */
export function CreateScene() {
  return (
    <svg viewBox="0 0 360 240" className="jx" aria-hidden>
      <path d="M0 240 L0 118 C24 86 72 82 96 112 C118 140 104 176 142 190 C172 200 192 220 200 240 Z" className="jx-blob jx-blob--1" />
      <rect x="18" y="196" width="34" height="40" rx="3" className="jx-fill" />
      <Plant x={35} y={196} />
      <path d="M176 140 L166 236 M254 140 L264 236" className="jx-line" />
      <rect x="150" y="30" width="130" height="110" rx="4" className="jx-fill" />
      <rect x="164" y="44" width="62" height="14" rx="7" className="jx-tint" />
      <path d="M172 51 h40" className="jx-line jx-line--thin" />
      <g className="jx-pop"><BotTile x={240} y={42} s={0.58} /></g>
      <path d="M166 82 h100 M166 104 h100" className="jx-line jx-line--soft" />
      <circle cx="186" cy="82" r="5" className="jx-fill jx-knob" />
      <circle cx="226" cy="104" r="5" className="jx-fill jx-knob jx-knob--b" />
      <path d="M166 124 h44" className="jx-line jx-line--thin" />
      <path d="M248 124 l5 5 l10 -11" className="jx-check jx-pop" style={{ animationDelay: ".8s" }} />
      <Person x={110} hair="long" left={[88, 152]} right={[156, 90]} armClass={{ right: "jx-point" }} />
      <Person x={312} hair="short" left={[283, 112]} right={[330, 152]} />
      <Diamond x={68} y={40} /><Diamond x={300} y={18} d={1.2} /><Diamond x={336} y={70} d={2.1} />
      <path d="M100 26 v-26" className="jx-line" />
    </svg>
  );
}

/** 02 — documents and web pages flowing into the laptop as the bot learns. */
export function TeachScene() {
  const toLaptop = "M160 96 C190 58 232 70 264 112";
  const fromCard = "M206 32 C242 30 270 60 274 110";
  return (
    <svg viewBox="0 0 360 240" className="jx" aria-hidden>
      <path d="M0 240 L0 200 C40 170 92 192 140 186 C200 178 232 150 290 160 C330 166 350 190 360 200 L360 240 Z" className="jx-blob jx-blob--2" />
      <path d={toLaptop} className="jx-dash" /><path d={fromCard} className="jx-dash" />
      <circle r="3.5" className="jx-dot jx-travel" style={{ offsetPath: `path("${toLaptop}")` }} />
      <circle r="3.5" className="jx-dot jx-travel" style={{ offsetPath: `path("${fromCard}")`, animationDelay: "1s" }} />
      <g className="jx-float">
        <rect x="150" y="22" width="56" height="20" rx="4" className="jx-fill" />
        <rect x="156" y="27" width="16" height="10" rx="2" className="jx-tag" />
        <path d="M178 32 h20" className="jx-line jx-line--thin" />
      </g>
      <g className="jx-float" style={{ animationDelay: "1.1s" }}>
        <rect x="296" y="56" width="50" height="20" rx="4" className="jx-fill" />
        <path d="M303 66 h34" className="jx-line jx-line--thin" />
      </g>
      <path d="M200 172 H342 M210 172 V236 M332 172 V236" className="jx-line" />
      <rect x="236" y="110" width="78" height="56" rx="4" className="jx-fill" />
      <path d="M226 172 h96" className="jx-line jx-line--thick" />
      <BotTile x={246} y={120} s={0.5} />
      <rect x="276" y="128" width="30" height="6" rx="3" className="jx-track" />
      <rect x="276" y="128" width="30" height="6" rx="3" className="jx-progress" />
      <path d="M276 144 h24 M276 152 h16" className="jx-line jx-line--thin" />
      <g className="jx-signal"><path d="M324 106 a10 10 0 0 1 0 16 M330 100 a18 18 0 0 1 0 28" className="jx-line jx-line--thin" /></g>
      <Person x={96} hair="bun" left={[72, 152]} right={[142, 112]} />
      <g className="jx-float" style={{ animationDuration: "3.6s" }}>
        <rect x="132" y="92" width="26" height="32" rx="3" className="jx-fill" />
        <path d="M138 102 h14 M138 109 h14 M138 116 h9" className="jx-line jx-line--thin" />
      </g>
      <Diamond x={60} y={44} d={0.6} /><Diamond x={226} y={18} d={1.6} />
    </svg>
  );
}

/** 03 — live on the website: a high-five next to the site with the widget converting. */
export function EngageScene() {
  return (
    <svg viewBox="0 0 360 240" className="jx" aria-hidden>
      <path d="M58 240 C40 198 72 150 122 150 C172 150 182 190 232 196 C262 199 272 220 282 240 Z" className="jx-blob jx-blob--3" />
      <rect x="10" y="180" width="50" height="56" rx="3" className="jx-fill" />
      <path d="M10 196 h50" className="jx-line jx-line--thin" />
      <Plant x={30} y={180} />
      <g className="jx-burst">
        {[[150, 18, 150, 6], [134, 24, 126, 16], [166, 24, 174, 16], [128, 40, 118, 38], [172, 40, 182, 38]].map(([x1, y1, x2, y2], i) => (
          <path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} className="jx-spark" style={{ animationDelay: `${i * 0.12}s` }} />
        ))}
      </g>
      <g className="jx-hi5">
        <Person x={112} hair="short" left={[90, 152]} right={[147, 46]} />
        <Person x={190} hair="long" left={[153, 46]} right={[212, 152]} />
      </g>
      <path d="M258 160 L250 236 M326 160 L334 236" className="jx-line" />
      <rect x="236" y="66" width="112" height="94" rx="6" className="jx-fill" />
      <path d="M236 80 h112" className="jx-line jx-line--thin" />
      <circle cx="245" cy="73" r="2" className="jx-ink" /><circle cx="252" cy="73" r="2" className="jx-ink" /><circle cx="259" cy="73" r="2" className="jx-ink" />
      <path d="M246 94 h40 M246 102 h28" className="jx-line jx-line--thin" />
      <g className="jx-pop" style={{ animationDelay: ".4s" }}>
        <rect x="268" y="108" width="62" height="28" rx="8" className="jx-fill" />
        <path d="M276 118 h42 M276 126 h28" className="jx-line jx-line--thin" />
      </g>
      <circle cx="334" cy="148" r="8" className="jx-brand" />
      <g className="jx-pop" style={{ animationDelay: "1.2s" }}>
        <circle cx="250" cy="146" r="9" className="jx-success" />
        <path d="M246 146 l3 3 l6 -7" className="jx-check jx-check--light" />
      </g>
    </svg>
  );
}
