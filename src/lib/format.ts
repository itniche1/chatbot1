const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
const dateFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function toDate(v?: string | number | Date | null): Date | null {
  if (v == null || v === "") return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
export const fmtTime = (v?: string | null) => { const d = toDate(v); return d ? timeFmt.format(d) : ""; };
export const fmtDay = (v?: string | null) => { const d = toDate(v); return d ? dayFmt.format(d) : ""; };
export const fmtDate = (v?: string | null) => { const d = toDate(v); return d ? dateFmt.format(d) : "—"; };
export const fmtDateTime = (v?: string | null) => { const d = toDate(v); return d ? dateTimeFmt.format(d) : "—"; };

export function dayKey(v?: string | null) {
  const d = toDate(v);
  return d ? `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}` : "";
}
/** True when message i starts a new calendar day (used for date dividers). */
export function startsNewDay(list: { created_at?: string | null }[], i: number) {
  const k = dayKey(list[i]?.created_at);
  return !!k && k !== dayKey(list[i - 1]?.created_at);
}

export function relativeTime(v?: string | null) {
  const d = toDate(v);
  if (!d) return "just now";
  const s = Math.max(0, Date.now() - d.getTime()) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 2592000) return `${Math.floor(s / 86400)}d ago`;
  return dateFmt.format(d);
}

export const fmtNumber = (n?: number | null) => (n == null ? "—" : Number(n).toLocaleString());
export const fmtBytes = (b?: number | null) => {
  if (b == null) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};
export const initial = (s?: string | null) => (s || "?").trim().charAt(0).toUpperCase() || "?";
export const firstName = (u?: { name?: string; email?: string } | null) =>
  (u?.name || u?.email || "").split(/[\s@]/)[0] || "there";

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
