import {
  forwardRef, useEffect, useId, useRef, useState,
  type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { X, Inbox, Copy, Check } from "lucide-react";

/* ---------- Button ---------- */
type Variant = "primary" | "dark" | "secondary" | "ghost" | "danger";
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant; size?: "sm" | "md" | "lg"; block?: boolean; loading?: boolean; icon?: ReactNode; iconOnly?: boolean;
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", block, loading, icon, iconOnly, className = "", children, disabled, type = "button", ...rest }, ref,
) {
  const cls = ["btn", `btn--${variant}`, size !== "md" && `btn--${size}`, block && "btn--block", iconOnly && "btn--icon", className].filter(Boolean).join(" ");
  return (
    <button ref={ref} type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="spinner" aria-hidden /> : icon}
      {children}
    </button>
  );
});

export function IconButton({ label, children, className = "", size, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: "sm" }) {
  return (
    <button type="button" aria-label={label} title={label} className={`icon-btn ${size === "sm" ? "icon-btn--sm" : ""} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Form fields ---------- */
export function Field({ label, hint, error, optional, children, htmlFor }: { label?: ReactNode; hint?: ReactNode; error?: ReactNode; optional?: boolean; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      {label && <label className="field__label" htmlFor={htmlFor}>{label}{optional && <span className="optional">(optional)</span>}</label>}
      {children}
      {error ? <div className="field__error" role="alert">{error}</div> : hint ? <div className="field__hint">{hint}</div> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className = "", ...rest }, ref) {
  return <input ref={ref} className={`input ${className}`} {...rest} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className = "", ...rest }, ref) {
  return <textarea ref={ref} className={`textarea ${className}`} {...rest} />;
});
export function Select({ className = "", children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`select ${className}`} {...rest}>{children}</select>;
}

export function Switch({ checked, onChange, label, disabled, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean; id?: string }) {
  return (
    <span className="switch">
      <input id={id} type="checkbox" role="switch" checked={checked} aria-checked={checked} aria-label={label} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch__track" />
      <span className="switch__thumb" />
    </span>
  );
}

export function SwitchRow({ title, description, checked, onChange, disabled }: { title: ReactNode; description?: ReactNode; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  const id = useId();
  return (
    <div className="switch-row">
      <div>
        <label htmlFor={id} className="field__label" style={{ cursor: "pointer" }}>{title}</label>
        {description && <div className="field__hint" style={{ marginTop: 4, maxWidth: 560 }}>{description}</div>}
      </div>
      <Switch id={id} checked={checked} onChange={onChange} disabled={disabled} label={typeof title === "string" ? title : "Toggle"} />
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function ColorField({ value, onChange, id }: { value: string; onChange: (v: string) => void; id?: string }) {
  const swatch = value && /^#[0-9A-Fa-f]{3,8}$/.test(value) ? (value.length === 4 ? `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}` : value.slice(0, 7)) : "#888888";
  return (
    <div className="color-field">
      <input type="color" value={swatch} onChange={(e) => onChange(e.target.value)} aria-label="Pick color" />
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="#hex or blank" className="mono" />
      {value && <Button variant="ghost" size="sm" onClick={() => onChange("")}>Clear</Button>}
    </div>
  );
}

/* ---------- Surfaces ---------- */
export function Card({ children, className = "", pad, hover, as: As = "div", ...rest }: { children: ReactNode; className?: string; pad?: boolean; hover?: boolean; as?: "div" | "section" | "article" } & Record<string, unknown>) {
  return <As className={`card ${pad ? "card--pad" : ""} ${hover ? "card--hover" : ""} ${className}`} {...rest}>{children}</As>;
}
export function CardHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="card__header">
      <div style={{ minWidth: 0 }}><h3>{title}</h3>{description && <p>{description}</p>}</div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow, back }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; back?: ReactNode }) {
  return (
    <header className="page-header">
      <div className="page-header__text">
        {back}
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 8 }}>{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </header>
  );
}

export function Stat({ label, value, hint, icon }: { label: ReactNode; value: ReactNode; hint?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="card stat">
      <div className="stat__label">{icon && <span className="stat__icon">{icon}</span>}{label}</div>
      <div className="stat__value">{value ?? "—"}</div>
      {hint && <div className="stat__hint">{hint}</div>}
    </div>
  );
}

export type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info" | "dark";
export function Badge({ tone = "neutral", children, plain }: { tone?: Tone; children: ReactNode; plain?: boolean }) {
  return <span className={`badge badge--${tone} ${plain ? "badge--plain" : ""}`}>{children}</span>;
}

export function EmptyState({ icon, title, description, action, compact }: { icon?: ReactNode; title: ReactNode; description?: ReactNode; action?: ReactNode; compact?: boolean }) {
  return (
    <div className={`empty ${compact ? "empty--compact" : ""}`}>
      <div className="empty__icon">{icon || <Inbox />}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ variant = "text", width, height, style }: { variant?: "text" | "title" | "block"; width?: number | string; height?: number | string; style?: CSSProperties }) {
  return <span className={`skeleton skeleton--${variant}`} style={{ width, height, ...style }} aria-hidden />;
}
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="list" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="list-item" key={i}>
          <Skeleton variant="block" width={36} height={36} style={{ borderRadius: "50%" }} />
          <div className="list-item__body stack-sm"><Skeleton width="45%" /><Skeleton width="70%" /></div>
        </div>
      ))}
    </div>
  );
}

export function Avatar({ name, src, size, brand }: { name?: string; src?: string | null; size?: "sm" | "lg"; brand?: boolean }) {
  return (
    <span className={`avatar ${size ? `avatar--${size}` : ""} ${brand ? "avatar--brand" : ""}`} aria-hidden>
      {src ? <img src={src} alt="" /> : (name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

/* ---------- Modal & Drawer ---------- */
function useLockScroll(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);
}
function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
}

export function Modal({ open, onClose, title, description, children, footer, size }: { open: boolean; onClose: () => void; title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode; size?: "lg" }) {
  useLockScroll(open);
  useEscape(open, onClose);
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (open) setTimeout(() => ref.current?.querySelector<HTMLElement>("input, textarea, select, button:not([data-close])")?.focus(), 30);
  }, [open]);
  if (!open) return null;
  return createPortal(
    <>
      <div className="overlay" onClick={onClose} />
      <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div ref={ref} className={`modal ${size === "lg" ? "modal--lg" : ""}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
          <div className="modal__header">
            <div><h2 id={titleId}>{title}</h2>{description && <p>{description}</p>}</div>
            <IconButton label="Close" onClick={onClose} data-close><X /></IconButton>
          </div>
          <div className="modal__body">{children}</div>
          {footer && <div className="modal__footer">{footer}</div>}
        </div>
      </div>
    </>,
    document.body,
  );
}

export function Drawer({ open, onClose, header, children }: { open: boolean; onClose: () => void; header: ReactNode; children: ReactNode }) {
  useLockScroll(open);
  useEscape(open, onClose);
  if (!open) return null;
  return createPortal(
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true">
        <div className="drawer__header">
          <div style={{ minWidth: 0, flex: 1 }}>{header}</div>
          <IconButton label="Close" onClick={onClose}><X /></IconButton>
        </div>
        <div className="drawer__body">{children}</div>
      </aside>
    </>,
    document.body,
  );
}

/* ---------- Dropdown menu ---------- */
export function Menu({ trigger, children, align = "right" }: { trigger: (p: { open: boolean; toggle: () => void }) => ReactNode; children: (close: () => void) => ReactNode; align?: "right" | "left" | "up" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);
  return (
    <div className="menu-anchor" ref={ref} style={align === "up" ? { display: "block", position: "relative" } : undefined}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && <div className={`menu menu--${align}`} role="menu">{children(() => setOpen(false))}</div>}
    </div>
  );
}
export function MenuItem({ icon, children, onClick, danger }: { icon?: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return <button type="button" role="menuitem" className={`menu__item ${danger ? "menu__item--danger" : ""}`} onClick={onClick}>{icon}{children}</button>;
}

/* ---------- Tabs ---------- */
export function Tabs<T extends string>({ value, onChange, tabs, label }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: ReactNode; icon?: ReactNode; count?: number }[]; label: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.value} type="button" role="tab" className="tab" aria-selected={value === t.value} onClick={() => onChange(t.value)}>
          {t.icon}{t.label}{t.count != null && <span className="tab__count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Copy ---------- */
export function useCopy(timeout = 1500) {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), timeout); return true; }
    catch { return false; }
  };
  return { copied, copy };
}
export function CodeBlock({ code, label }: { code: string; label: string }) {
  const { copied, copy } = useCopy();
  return (
    <div className="codeblock">
      <div className="codeblock__bar"><span>{label}</span>
        <button type="button" className="btn btn--sm" onClick={() => copy(code)}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy"}</button>
      </div>
      <pre><code>{code}</code></pre>
    </div>
  );
}

export function Meter({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return <div className="meter" role="progressbar" aria-valuenow={value} aria-valuemax={max}><div className={`meter__fill ${pct >= 90 ? "is-high" : ""}`} style={{ width: `${pct}%` }} /></div>;
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />;
}
