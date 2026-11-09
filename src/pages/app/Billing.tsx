import { Check, Mail, MessageCircle, Bot, CalendarClock } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useWorkspace } from "../../lib/workspace";
import { useApi } from "../../lib/useApi";
import { fmtNumber } from "../../lib/format";
import type { Plan } from "../../lib/types";
import { Badge, Button, Card, Meter, PageHeader, Skeleton } from "../../components/ui";

export default function Billing() {
  const { user } = useAuth();
  const { features } = useWorkspace();
  const { data: plans } = useApi<Plan[]>("/plans");
  const currentId = user ? user.plan_id : null;
  const trialEnds = user && user.trial_ends_at ? new Date(user.trial_ends_at) : null;
  const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86400000)) : null;
  const current = plans?.find((p) => p.id === currentId);

  return (
    <div className="page">
      <PageHeader eyebrow="Plan & billing" title="Plan & Billing" description="Your plan, usage and limits." />

      <div className="grid-3" style={{ marginBottom: "var(--sp-8)" }}>
        <UsageCard icon={<MessageCircle />} label="Messages used" used={features?.usage?.messages} max={features?.features?.max_messages} />
        <UsageCard icon={<Bot />} label="Chatbots" used={features?.usage?.chatbots} max={features?.features?.max_chatbots} />
        <Card pad className="stack-sm">
          <div className="stat__label"><span className="stat__icon"><CalendarClock /></span>{current?.is_trial || daysLeft !== null ? "Trial" : "Current plan"}</div>
          <div className="stat__value">{daysLeft !== null ? `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : current?.name || "—"}</div>
          <div className="stat__hint">{trialEnds ? `Ends ${trialEnds.toLocaleDateString()}` : current ? `$${current.price_monthly}/month` : ""}</div>
        </Card>
      </div>

      <div className="section-title"><div><h2>Plans</h2><p>Compare limits and features.</p></div></div>
      {!plans ? <div className="grid-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="block" height={340} />)}</div> : (
        <div className="plans">
          {plans.map((p) => {
            const isCurrent = p.id === currentId;
            const f = p.features;
            return (
              <div key={p.id} className={`card plan ${isCurrent ? "is-current" : ""}`}>
                <div className="row" style={{ justifyContent: "space-between" }}><h3>{p.name}</h3>{isCurrent && <Badge tone="brand">Current</Badge>}</div>
                <div className="plan__price">${p.price_monthly}{p.price_monthly > 0 && <span>/mo</span>}</div>
                {p.is_trial && p.trial_days ? <div className="text-xs muted">{p.trial_days}-day trial</div> : <div className="text-xs muted">&nbsp;</div>}
                <ul className="plan__features">
                  <li><Check />{fmtNumber(f.max_chatbots)} chatbot{f.max_chatbots === 1 ? "" : "s"}</li>
                  <li><Check />{fmtNumber(f.max_messages)} messages</li>
                  <li><Check />{(f.max_kb_size_bytes / 1048576).toFixed(f.max_kb_size_bytes < 1048576 ? 1 : 0)} MB knowledge · {f.max_kb_files} files</li>
                  <li><Check />{f.max_domains} domain{f.max_domains === 1 ? "" : "s"}</li>
                  {f.can_use_crawler && <li><Check />Website crawler</li>}
                  {f.can_export_chats && <li><Check />Export chats</li>}
                  {f.can_remove_branding && <li><Check />Remove branding</li>}
                </ul>
                <Button variant={isCurrent ? "secondary" : "dark"} block disabled>{isCurrent ? "Current plan" : "Coming soon"}</Button>
              </div>
            );
          })}
        </div>
      )}
      <div className="callout callout--brand" style={{ marginTop: "var(--sp-6)" }}>
        <Mail />
        <div>Online payments are coming soon. For now, plan changes are handled by our team — email <a className="link" href="mailto:support@itniche.com?subject=ChatBOT%20plan%20change">support@itniche.com</a> and we'll switch you over.</div>
      </div>
    </div>
  );
}

function UsageCard({ icon, label, used, max }: { icon: React.ReactNode; label: string; used?: number; max?: number }) {
  return (
    <Card pad className="stack-sm">
      <div className="stat__label"><span className="stat__icon">{icon}</span>{label}</div>
      <div className="stat__value">{used == null ? <Skeleton variant="title" width={90} /> : fmtNumber(used)}<span className="muted" style={{ fontSize: "var(--fs-base)", fontWeight: 700 }}> / {fmtNumber(max)}</span></div>
      <Meter value={used || 0} max={max || 0} />
    </Card>
  );
}
