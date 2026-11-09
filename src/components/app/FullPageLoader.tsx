import { BrandMark } from "../brand/Logo";

export function FullPageLoader({ label = "Loading your workspace" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "var(--bg-subtle)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <div style={{ animation: "pulse-ring 1.4s ease-out infinite", borderRadius: 14 }}><BrandMark size={48} /></div>
        <div className="muted text-sm">{label}…</div>
      </div>
    </div>
  );
}
