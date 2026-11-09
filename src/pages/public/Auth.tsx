import { useEffect, useState, type ReactNode } from "react";
import { ThemeToggle } from "../../lib/theme";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Button, Field, Input } from "../../components/ui";
import { MarketingLogo } from "../../components/marketing/Chrome";

function AuthShell({ children, top }: { children: ReactNode; top?: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth__panel" aria-hidden>
        <span />
        <div className="auth__quote">
          <div className="eyebrow" style={{ marginBottom: 14 }}>AI-Powered Customer Engagement</div>
          <h2>Every conversation creates an <em>opportunity.</em></h2>
          <p>An always-on assistant that knows your business, speaks in your brand voice and hands your team qualified leads.</p>
          <div className="auth__points">
            <span><CheckCircle2 />Answers grounded in your own documents and website</span>
            <span><CheckCircle2 />Lead capture with a built-in follow-up inbox</span>
            <span><CheckCircle2 />Live on your website with one line of code</span>
          </div>
        </div>
        <div className="text-xs subtle">© {new Date().getFullYear()} IT Niche, LLC · People, Projects, Processes</div>
      </aside>
      <main className="auth__main">
        <div className="auth__top"><MarketingLogo /><div className="row" style={{ gap: 6 }}><ThemeToggle />{top}</div></div>
        <div className="auth__form-wrap"><div className="auth__form">{children}</div></div>
        <p className="auth__legal"><Link to="/terms-of-use" className="link" style={{ fontWeight: 400 }}>Terms of Use</Link> · <Link to="/privacy-policy" className="link" style={{ fontWeight: 400 }}>Privacy Policy</Link></p>
      </main>
    </div>
  );
}

function PasswordInput({ id, value, onChange, autoComplete, minLength }: { id: string; value: string; onChange: (v: string) => void; autoComplete: string; minLength?: number }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-group">
      <Input id={id} type={show ? "text" : "password"} required minLength={minLength} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} style={{ paddingRight: 48 }} />
      <span className="input-group__end"><button type="button" className="icon-btn" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((s) => !s)}>{show ? <EyeOff /> : <Eye />}</button></span>
    </div>
  );
}

function FormError({ children }: { children: ReactNode }) {
  return children ? <div className="callout callout--danger" role="alert">{children}</div> : null;
}

function useRedirectIfSignedIn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (user) navigate(user.role === "admin" ? "/admin" : "/app", { replace: true }); }, [user, navigate]);
}

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useRedirectIfSignedIn();
  useEffect(() => { document.title = "Sign in | IT Niche ChatBOT"; }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const u = await login(email, password);
      navigate(u.role === "admin" ? "/admin" : "/app");
    } catch (err) { setError(errorMessage(err, "Couldn't sign you in. Check your email and password.")); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell top={<Link to="/register" className="btn btn--secondary btn--sm">Create account</Link>}>
      <h1>Welcome back</h1>
      <p>Sign in to your IT Niche ChatBOT workspace.</p>
      <form onSubmit={submit} noValidate={false}>
        <FormError>{error}</FormError>
        <Field label="Email" htmlFor="email"><Input id="email" type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></Field>
        <Field label={<span className="row" style={{ justifyContent: "space-between", width: "100%" }}>Password<Link to="/forgot-password" className="link text-xs">Forgot password?</Link></span>} htmlFor="password">
          <PasswordInput id="password" value={password} onChange={setPassword} autoComplete="current-password" />
        </Field>
        <Button type="submit" size="lg" block loading={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
      <p className="auth__alt">New to ChatBOT? <Link to="/register" className="link">Create an account</Link></p>
    </AuthShell>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useRedirectIfSignedIn();
  useEffect(() => { document.title = "Create account | IT Niche ChatBOT"; }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try { await register(email, password, name); navigate("/app"); }
    catch (err) { setError(errorMessage(err, "Couldn't create your account.")); }
    finally { setBusy(false); }
  };

  return (
    <AuthShell top={<Link to="/login" className="btn btn--secondary btn--sm">Sign in</Link>}>
      <h1>Create your assistant</h1>
      <p>Start your free trial — no credit card required.</p>
      <form onSubmit={submit}>
        <FormError>{error}</FormError>
        <Field label="Full name" htmlFor="name"><Input id="name" required autoComplete="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Work email" htmlFor="email"><Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters."><PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} /></Field>
        <Button type="submit" size="lg" block loading={busy}>{busy ? "Creating account…" : "Create account"}</Button>
        <p className="text-xs subtle" style={{ textAlign: "center" }}>By creating an account you agree to the <Link to="/terms-of-use" className="link">Terms of Use</Link> and <Link to="/privacy-policy" className="link">Privacy Policy</Link>.</p>
      </form>
      <p className="auth__alt">Already have an account? <Link to="/login" className="link">Sign in</Link></p>
    </AuthShell>
  );
}

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try { await api.post("/auth/forgot-password", { email }); setSent(true); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  return (
    <AuthShell>
      <Link to="/login" className="breadcrumb"><ArrowLeft />Back to sign in</Link>
      {sent ? (
        <div className="anim-fade-up">
          <div className="empty__icon" style={{ marginBottom: 20 }}><MailCheck /></div>
          <h1>Check your inbox</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 8 }}>If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.</p>
          <Button variant="secondary" style={{ marginTop: 24 }} onClick={() => setSent(false)}>Try another email</Button>
        </div>
      ) : (
        <>
          <h1>Reset your password</h1>
          <p>Enter your email and we'll send you a secure reset link.</p>
          <form onSubmit={submit}>
            <FormError>{error}</FormError>
            <Field label="Email" htmlFor="email"><Input id="email" type="email" required autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            <Button type="submit" size="lg" block loading={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
          </form>
        </>
      )}
    </AuthShell>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setBusy(true);
    try { await api.post("/auth/reset-password", { token, password }); setDone(true); setTimeout(() => navigate("/login"), 2000); }
    catch (err) { setError(errorMessage(err)); }
    finally { setBusy(false); }
  };
  return (
    <AuthShell>
      <Link to="/login" className="breadcrumb"><ArrowLeft />Back to sign in</Link>
      <h1>Choose a new password</h1>
      <p>Make it at least 8 characters.</p>
      {done ? (
        <div className="callout callout--success" style={{ marginTop: 24 }} role="status"><CheckCircle2 />Password updated. Redirecting to sign in…</div>
      ) : (
        <form onSubmit={submit}>
          {!token && <FormError>This reset link is missing its token. Request a new link from the sign-in page.</FormError>}
          <FormError>{error}</FormError>
          <Field label="New password" htmlFor="password"><PasswordInput id="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={8} /></Field>
          <Button type="submit" size="lg" block loading={busy} disabled={!token}>{busy ? "Saving…" : "Set new password"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
