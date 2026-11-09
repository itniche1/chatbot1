import { useMemo, useState } from "react";

const shortDate = (d: string) => {
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const niceMax = (v: number) => {
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / p) * p;
};

/** Vertical bar chart (one series). */
export function BarChart({ data, xKey, yKey, label }: { data: Record<string, number | string>[]; xKey: string; yKey: string; label: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 800, H = 240, padL = 36, padB = 28, padT = 12;
  const max = niceMax(Math.max(0, ...data.map((d) => Number(d[yKey]) || 0)));
  const bw = (W - padL) / Math.max(1, data.length);
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const step = Math.max(1, Math.ceil(data.length / 8));
  return (
    <div className="chart" style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ width: "100%", height: "auto", overflow: "visible" }}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={padL} x2={W} y1={y(max * t)} y2={y(max * t)} stroke="var(--chart-grid)" strokeDasharray={t ? "4 4" : undefined} />
            <text x={padL - 8} y={y(max * t) + 4} textAnchor="end" fontSize="11" fill="var(--text-subtle)">{Math.round(max * t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const v = Number(d[yKey]) || 0;
          const x = padL + i * bw + bw * 0.18;
          const w = bw * 0.64;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={padL + i * bw} y={padT} width={bw} height={H - padT - padB} fill="transparent" />
              <rect x={x} y={y(v)} width={w} height={Math.max(0, H - padB - y(v))} rx={Math.min(5, w / 2)} fill={hover === i ? "var(--brand-strong)" : "var(--brand)"} opacity={hover === null || hover === i ? 1 : 0.45} style={{ transition: "opacity .15s" }} />
              {i % step === 0 && <text x={x + w / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-subtle)">{shortDate(String(d[xKey]))}</text>}
            </g>
          );
        })}
      </svg>
      {hover !== null && data[hover] && (
        <div className="chart-tip" style={{ left: `${((padL + hover * bw + bw / 2) / W) * 100}%` }}>
          <strong>{Number(data[hover][yKey]).toLocaleString()}</strong> {label.toLowerCase()}<br /><span>{shortDate(String(data[hover][xKey]))}</span>
        </div>
      )}
    </div>
  );
}

/** Multi-series line chart. */
export function LineChart({ data, xKey, series }: { data: Record<string, number | string>[]; xKey: string; series: { key: string; label: string; color: string }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 800, H = 240, padL = 36, padB = 28, padT = 12, padR = 8;
  const max = useMemo(() => niceMax(Math.max(0, ...data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0)))), [data, series]);
  const n = data.length;
  const x = (i: number) => padL + (n <= 1 ? (W - padL - padR) / 2 : (i * (W - padL - padR)) / (n - 1));
  const y = (v: number) => padT + (H - padT - padB) * (1 - v / max);
  const step = Math.max(1, Math.ceil(n / 8));
  return (
    <div className="chart" style={{ position: "relative" }}>
      <div className="chart-legend">{series.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>)}</div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={series.map((s) => s.label).join(", ")} style={{ width: "100%", height: "auto", overflow: "visible" }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = n <= 1 ? 0 : Math.round(((px - padL) / (W - padL - padR)) * (n - 1));
          setHover(Math.max(0, Math.min(n - 1, i)));
        }}>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y(max * t)} y2={y(max * t)} stroke="var(--chart-grid)" strokeDasharray={t ? "4 4" : undefined} />
            <text x={padL - 8} y={y(max * t) + 4} textAnchor="end" fontSize="11" fill="var(--text-subtle)">{Math.round(max * t)}</text>
          </g>
        ))}
        {series.map((s, si) => {
          const d = data.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(Number(p[s.key]) || 0)}`).join(" ");
          return (
            <g key={s.key}>
              {si === 0 && <path d={`${d} L${x(n - 1)},${H - padB} L${x(0)},${H - padB} Z`} fill={s.color} opacity=".08" />}
              <path d={d} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            </g>
          );
        })}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="var(--ink-200)" />
            {series.map((s) => <circle key={s.key} cx={x(hover)} cy={y(Number(data[hover]?.[s.key]) || 0)} r="4.5" fill="#fff" stroke={s.color} strokeWidth="2.5" />)}
          </g>
        )}
        {data.map((p, i) => i % step === 0 && <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--text-subtle)">{shortDate(String(p[xKey]))}</text>)}
      </svg>
      {hover !== null && data[hover] && (
        <div className="chart-tip" style={{ left: `${(x(hover) / W) * 100}%` }}>
          <span>{shortDate(String(data[hover][xKey]))}</span>
          {series.map((s) => <div key={s.key}><i style={{ background: s.color }} />{s.label}: <strong>{Number(data[hover][s.key] || 0).toLocaleString()}</strong></div>)}
        </div>
      )}
    </div>
  );
}

/** Horizontal funnel with step-to-step conversion. */
export function Funnel({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="funnel">
      {steps.map((s, i) => {
        const pct = Math.max(2, (s.value / max) * 100);
        const prev = steps[i - 1];
        const conv = prev ? Math.round((s.value / Math.max(1, prev.value)) * 100) : null;
        return (
          <div className="funnel__row" key={s.label}>
            <div className="funnel__label">{s.label}</div>
            <div className="funnel__track"><div className="funnel__bar" style={{ width: `${pct}%`, background: s.color }}><span>{s.value.toLocaleString()}</span></div></div>
            <div className="funnel__conv">{conv === null ? "" : `${conv}% converted`}</div>
          </div>
        );
      })}
    </div>
  );
}
