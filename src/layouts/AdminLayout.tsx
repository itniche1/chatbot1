import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Gauge, Users, Bot, MessagesSquare, Cpu, Megaphone, ClipboardList, ArrowLeft, LogOut, Menu as MenuIcon, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/auth";
import { ProductLogo } from "../components/brand/Logo";
import { Avatar, IconButton } from "../components/ui";
import { FullPageLoader } from "../components/app/FullPageLoader";
import { ThemeToggle } from "../lib/theme";

const NAV = [
  { to: "/admin", label: "Overview", icon: Gauge, end: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/chatbots", label: "Chatbots", icon: Bot },
  { to: "/admin/conversations", label: "Conversations", icon: MessagesSquare },
  { to: "/admin/usage", label: "AI Usage", icon: Cpu },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate("/login", { replace: true });
    else if (user.role !== "admin") navigate("/app", { replace: true });
  }, [loading, user, navigate]);
  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (loading || !user || user.role !== "admin") return <FullPageLoader label="Loading admin console" />;

  return (
    <div className={`app-shell ${mobileOpen ? "is-mobile-open" : ""}`}>
      <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />
      <aside className="sidebar" aria-label="Admin">
        <div className="sidebar__head">
          <NavLink to="/admin" className="sidebar__brand"><ProductLogo tone="light" /></NavLink>
        </div>
        <div style={{ padding: "0 14px 10px" }}><span className="badge badge--brand badge--plain"><ShieldCheck size={12} />Admin console</span></div>
        <nav className="sidebar__scroll">
          <div className="nav-group">
            <div className="nav-group__label">Platform</div>
            {NAV.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className="nav-link"><Icon /><span>{label}</span></NavLink>)}
          </div>
          <div className="nav-group">
            <NavLink to="/app" className="nav-link"><ArrowLeft /><span>Back to workspace</span></NavLink>
          </div>
        </nav>
        <div className="sidebar__foot">
          <div className="user-chip" style={{ cursor: "default" }}>
            <Avatar name={user.name || user.email} size="sm" />
            <span style={{ minWidth: 0, flex: 1 }}><span className="user-chip__name truncate" style={{ display: "block" }}>{user.name}</span><span className="user-chip__meta truncate" style={{ display: "block" }}>{user.email}</span></span>
            <ThemeToggle variant="ink" />
            <button type="button" className="icon-btn" aria-label="Sign out" title="Sign out" onClick={async () => { await logout(); navigate("/"); }}><LogOut /></button>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <IconButton label="Open navigation" onClick={() => setMobileOpen(true)}><MenuIcon /></IconButton>
          <div className="topbar__title"><ProductLogo tone="light" /></div>
          <ThemeToggle variant="ink" />
        </header>
        <main id="main" style={{ flex: 1 }}><Outlet /></main>
      </div>
    </div>
  );
}
