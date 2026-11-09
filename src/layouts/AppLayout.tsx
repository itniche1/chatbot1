import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  MessageSquarePlus, Search, Sparkles, LayoutDashboard, Bot, MessagesSquare, Users, BookOpen, BarChart3, Plug,
  CreditCard, Settings, LifeBuoy, ShieldCheck, Sun, Moon, PanelLeftClose, PanelLeftOpen, ChevronsUpDown, LogOut, Menu as MenuIcon, Trash2,
} from "lucide-react";
import { useAuth } from "../lib/auth";
import { WorkspaceProvider } from "../lib/workspace";
import { sessionStore, useSessions } from "../lib/sessions";
import { ProductLogo, BrandMark } from "../components/brand/Logo";
import { Avatar, Menu, MenuItem, IconButton } from "../components/ui";
import { AnnouncementsButton } from "../components/app/Announcements";
import { SearchPalette } from "../components/app/SearchPalette";
import { FullPageLoader } from "../components/app/FullPageLoader";
import { ThemeToggle, useTheme } from "../lib/theme";

const COLLAPSE_KEY = "itniche_sidebar_collapsed";
const IS_MAC = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
const MOD = IS_MAC ? "⌘" : "Ctrl";

const WORKSPACE = [
  { to: "/app", label: "Assistant", icon: Sparkles, end: true },
  { to: "/app/overview", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/chatbots", label: "Chatbots", icon: Bot },
  { to: "/app/conversations", label: "Conversations", icon: MessagesSquare },
  { to: "/app/leads", label: "Leads", icon: Users },
  { to: "/app/knowledge", label: "Knowledge Base", icon: BookOpen },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/app/integrations", label: "Integrations", icon: Plug },
];
const ACCOUNT = [
  { to: "/app/billing", label: "Plan & Billing", icon: CreditCard },
  { to: "/app/settings", label: "Settings", icon: Settings },
  { to: "/app/help", label: "Help & Support", icon: LifeBuoy },
];

export default function AppLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(COLLAPSE_KEY) === "1"; } catch { return false; } });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [theme, setTheme] = useTheme();

  useEffect(() => { if (user) sessionStore.setUser(user.id); }, [user]);
  useEffect(() => { if (!loading && !user) navigate("/login", { replace: true }); }, [loading, user, navigate]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname, location.search]);
  useEffect(() => { try { localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0"); } catch { /* ignore */ } }, [collapsed]);

  const newChat = useCallback(() => navigate("/app", { state: { fresh: Date.now() } }), [navigate]);

  // Keyboard shortcuts: Ctrl/⌘+K search · Ctrl/⌘+Shift+O new conversation · Ctrl/⌘+B toggle sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "k") { e.preventDefault(); setSearchOpen(true); }
      else if (k === "o" && e.shiftKey) { e.preventDefault(); newChat(); }
      else if (k === "b" && !e.shiftKey) { e.preventDefault(); setCollapsed((c) => !c); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [newChat]);

  if (loading || !user) return <FullPageLoader />;

  return (
    <WorkspaceProvider>
      <div className={`app-shell ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}>
        <a href="#main" className="skip-link">Skip to content</a>
        <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />

        <aside className="sidebar" aria-label="Primary">
          <div className="sidebar__head">
            <NavLink to="/app" className="sidebar__brand" aria-label="IT Niche ChatBOT home">
              <span className="show-collapsed"><BrandMark /></span><span className="hide-collapsed"><ProductLogo tone="light" /></span>
            </NavLink>
            <div className="row" style={{ gap: 2 }}>
              <IconButton label={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"} className="sidebar__collapse" onClick={() => setCollapsed((c) => !c)}>
                {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              </IconButton>
            </div>
          </div>

          <div className="sidebar__cta" data-tip={`New conversation (${MOD}+Shift+O)`}>
            <button type="button" className="btn" onClick={newChat}>
              <MessageSquarePlus /><span className="hide-collapsed">New conversation</span>
            </button>
          </div>
          <div className="sidebar__search" data-tip={`Search (${MOD}+K)`}>
            <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search conversations">
              <Search /><span className="hide-collapsed" style={{ flex: 1, textAlign: "left" }}>Search conversations</span>
              <kbd className="hide-collapsed" aria-hidden style={{ width: "auto", padding: "0 6px", fontSize: 10 }}>{MOD} K</kbd>
            </button>
          </div>

          <nav className="sidebar__scroll">
            <div className="nav-group">
              <div className="nav-group__label"><span className="hide-collapsed">Workspace</span></div>
              {WORKSPACE.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className="nav-link" data-tip={label}>
                  <Icon /><span className="hide-collapsed">{label}</span>
                </NavLink>
              ))}
            </div>

            <RecentConversations />

            <div className="nav-group">
              <div className="nav-group__label"><span className="hide-collapsed">Account</span></div>
              {ACCOUNT.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className="nav-link" data-tip={label}>
                  <Icon /><span className="hide-collapsed">{label}</span>
                </NavLink>
              ))}
              {user.role === "admin" && (
                <NavLink to="/admin" className="nav-link nav-link--admin" data-tip="Admin console">
                  <ShieldCheck /><span className="hide-collapsed">Admin console</span>
                </NavLink>
              )}
            </div>
          </nav>

          <div className="sidebar__foot" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
            <Menu align="up" trigger={({ open, toggle }) => (
              <button type="button" className="user-chip" aria-expanded={open} aria-haspopup="menu" onClick={toggle} data-tip={user.name || user.email}>
                <Avatar name={user.name || user.email} size="sm" />
                <span className="hide-collapsed" style={{ minWidth: 0, flex: 1 }}>
                  <span className="user-chip__name truncate" style={{ display: "block" }}>{user.name || "Your account"}</span>
                  <span className="user-chip__meta truncate" style={{ display: "block" }}>{user.email}</span>
                </span>
                <ChevronsUpDown className="hide-collapsed" />
              </button>
            )}>
              {(close) => (
                <>
                  <div className="menu__label">{user.email}</div>
                  <MenuItem icon={<Settings />} onClick={() => { close(); navigate("/app/settings"); }}>Account settings</MenuItem>
                  <MenuItem icon={<CreditCard />} onClick={() => { close(); navigate("/app/billing"); }}>Plan & billing</MenuItem>
                  {user.role === "admin" && <MenuItem icon={<ShieldCheck />} onClick={() => { close(); navigate("/admin"); }}>Admin console</MenuItem>}
                  <MenuItem icon={theme === "dark" ? <Sun /> : <Moon />} onClick={() => { close(); setTheme(theme === "dark" ? "light" : "dark"); }}>{theme === "dark" ? "Light mode" : "Dark mode"}</MenuItem>
                  <div className="menu__sep" />
                  <MenuItem icon={<LogOut />} onClick={async () => { close(); await logout(); navigate("/"); }}>Sign out</MenuItem>
                </>
              )}
            </Menu>
            </div>
            <span className="hide-collapsed row" style={{ gap: 0 }}><ThemeToggle variant="ink" /><AnnouncementsButton align="up" /></span>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <IconButton label="Open navigation" onClick={() => setMobileOpen(true)}><MenuIcon /></IconButton>
            <div className="topbar__title"><NavLink to="/app" aria-label="Home"><ProductLogo tone="light" /></NavLink></div>
            <ThemeToggle variant="ink" />
            <AnnouncementsButton />
            <IconButton label="New conversation" onClick={newChat}><MessageSquarePlus /></IconButton>
          </header>
          <main id="main" tabIndex={-1} style={{ outline: "none", flex: 1, display: "flex", flexDirection: "column" }}>
            <Outlet />
          </main>
        </div>

        <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>
    </WorkspaceProvider>
  );
}

function RecentConversations() {
  const sessions = useSessions();
  const location = useLocation();
  const navigate = useNavigate();
  const activeId = new URLSearchParams(location.search).get("c");
  return (
    <div className="nav-group hide-collapsed">
      <div className="nav-group__label"><span>Recent</span></div>
      <div className="nav-recent">
        {sessions.length === 0 && <div className="nav-recent__empty">Your Assistant conversations will appear here.</div>}
        {sessions.slice(0, 8).map((s) => (
          <div key={s.id} className={`nav-recent__item ${activeId === s.id ? "active" : ""}`}>
            <NavLink to={`/app?c=${s.id}`} title={s.title}>{s.title}</NavLink>
            <button type="button" aria-label={`Delete “${s.title}”`} onClick={() => {
              sessionStore.remove(s.id);
              if (activeId === s.id) navigate("/app", { replace: true });
            }}><Trash2 /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
