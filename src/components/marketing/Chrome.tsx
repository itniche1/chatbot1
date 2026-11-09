import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import { ThemeToggle } from "../../lib/theme";
import { ProductLogo } from "../brand/Logo";

export function MarketingLogo() {
  return (
    <Link to="/" className="mk-logo" aria-label="Chatbase — A Product of IT Niche. Home">
      <ProductLogo size="lg" />
    </Link>
  );
}

export function MarketingHeader({ children }: { children?: ReactNode }) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`mk-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="mk-container mk-header__inner">
        <MarketingLogo />
        <nav className="mk-nav" aria-label="Main">
          {children}
          <ThemeToggle />
          {user ? (
            <Link to={user.role === "admin" ? "/admin" : "/app"} className="btn btn--primary btn--sm">Open workspace</Link>
          ) : (
            <>
              <Link to="/login" className="mk-nav__link">Sign in</Link>
              <Link to="/register" className="btn btn--primary btn--sm">Start free trial</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="mk-footer" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="mk-container">
        <div className="mk-footer__grid">
          <div style={{ maxWidth: 380 }}>
            <ProductLogo size="lg" />
            <p style={{ marginTop: 12 }}>AI-Powered Customer Engagement. Every conversation creates an opportunity.</p>
          </div>
          <div className="mk-footer__links">
            <a href="https://www.itniche.com/" target="_blank" rel="noreferrer">itniche.com</a>
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms-of-use">Terms of Use</Link>
            <a href="mailto:support@itniche.com">support@itniche.com</a>
          </div>
        </div>
        <div className="mk-footer__bottom">
          <span>© {new Date().getFullYear()} IT Niche, LLC. All rights reserved.</span>
          <span>People · Projects · Processes</span>
        </div>
      </div>
    </footer>
  );
}
