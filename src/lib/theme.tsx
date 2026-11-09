import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

/**
 * Light / dark colour theme for the app and marketing pages (not the embeddable widget,
 * which follows each chatbot's own Appearance settings).
 * The choice is stored per browser; with no stored choice the default is light.
 * index.html applies the stored theme before first paint to avoid a flash.
 */
export type Theme = "light" | "dark";
const KEY = "itniche_theme";
const listeners = new Set<() => void>();

export const DEFAULT_THEME: Theme = "light";
function storedTheme(): Theme | null {
  try { const v = localStorage.getItem(KEY); return v === "dark" || v === "light" ? v : null; } catch { return null; }
}
export function getTheme(): Theme {
  const t = document.documentElement.dataset.theme;
  return t === "dark" || t === "light" ? t : storedTheme() || DEFAULT_THEME;
}
export function setTheme(t: Theme) {
  try { localStorage.setItem(KEY, t); } catch { /* storage unavailable */ }
  const root = document.documentElement;
  root.classList.add("theme-switching"); // suppress transitions for one frame
  root.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "dark" ? "#0B0B0D" : "#FFFFFF");
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
  listeners.forEach((l) => l());
}

export function useTheme(): [Theme, (t: Theme) => void] {
  const theme = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    getTheme,
    () => DEFAULT_THEME,
  );
  return [theme, setTheme];
}

/** Sun/moon button. `variant="ink"` for use on the dark sidebar and mobile top bar. */
export function ThemeToggle({ className = "", variant }: { className?: string; variant?: "ink" }) {
  const [theme, set] = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;
  return (
    <button type="button" className={`icon-btn theme-toggle ${variant === "ink" ? "theme-toggle--ink" : ""} ${className}`}
      onClick={() => set(next)} aria-label={label} title={label} aria-pressed={theme === "dark"}>
      <span className="theme-toggle__icons" data-theme-icon={theme}><Sun /><Moon /></span>
    </button>
  );
}
