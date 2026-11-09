import { Link } from "react-router-dom";
import { BadgeCheck, AlertCircle, KeyRound, Mail } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { Avatar, Badge, Field, Input, PageHeader } from "../../components/ui";
import { FormSection } from "./chatbot/FormSection";

export default function Settings() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <PageHeader eyebrow="Account" title="Settings" description="Your account details." />
      <div className="card card--pad row" style={{ marginBottom: "var(--sp-5)", gap: 16 }}>
        <Avatar name={user.name || user.email} size="lg" />
        <div style={{ minWidth: 0 }}>
          <div className="fw-900" style={{ fontSize: "var(--fs-lg)" }}>{user.name || "—"}</div>
          <div className="muted text-sm truncate">{user.email}</div>
        </div>
        <span className="spacer" />
        <Badge tone={user.role === "admin" ? "dark" : "neutral"}>{user.role || "user"}</Badge>
      </div>
      <FormSection title="Profile" description="Contact support to change your name or email.">
        <div className="grid-2">
          <Field label="Name" htmlFor="s-name"><Input id="s-name" value={user.name || ""} disabled /></Field>
          <Field label="Email" htmlFor="s-email"><Input id="s-email" value={user.email || ""} disabled /></Field>
          <Field label="Role" htmlFor="s-role"><Input id="s-role" value={user.role || ""} disabled style={{ textTransform: "capitalize" }} /></Field>
          <Field label="Email verification">
            <div className="row" style={{ minHeight: 42 }}>
              {user.is_email_verified ? <Badge tone="success"><BadgeCheck size={12} />Verified</Badge> : <Badge tone="warning"><AlertCircle size={12} />Not verified</Badge>}
            </div>
          </Field>
        </div>
      </FormSection>
      <FormSection title="Security" description="Change your password with a secure reset link sent to your email.">
        <div className="row-wrap">
          <Link to="/forgot-password" className="btn btn--secondary"><KeyRound />Send password reset link</Link>
          <a href="mailto:support@itniche.com?subject=ChatBOT%20account" className="btn btn--ghost"><Mail />Contact support</a>
        </div>
      </FormSection>
    </div>
  );
}
