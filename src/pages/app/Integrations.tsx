import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Code2, ShieldCheck, ExternalLink, Globe, Mail, Plus, Plug } from "lucide-react";
import { useWorkspace } from "../../lib/workspace";
import { Badge, Card, EmptyState, PageHeader, Select, Skeleton } from "../../components/ui";
import { EmbedPanel } from "./chatbot/EmbedPanel";

/**
 * Integrations available today: the website embed (script tag) plus the related
 * domain allow-list and email features. Nothing here is simulated.
 */
export default function Integrations() {
  const { bots } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [botId, setBotId] = useState(params.get("bot") || "");
  useEffect(() => { if (bots?.length && !bots.some((b) => b.id === botId)) setBotId(bots[0].id); }, [bots, botId]);
  const bot = bots?.find((b) => b.id === botId);

  return (
    <div className="page">
      <PageHeader eyebrow="Website integration" title="Integrations" description="Put your assistant to work on your website in minutes." />

      <div className="grid-3" style={{ marginBottom: "var(--sp-8)" }}>
        <IntegrationCard icon={<Globe />} title="Website widget" status="Available" desc="One script tag adds the chat launcher to any site — WordPress, Webflow, Shopify, Wix or custom HTML." />
        <IntegrationCard icon={<ShieldCheck />} title="Domain allow-list" status="Available" desc="Restrict which websites can load each chatbot to protect your message quota." />
        <IntegrationCard icon={<Mail />} title="Email hand-off & transcripts" status="Available" desc="Escalation alerts to your team and transcript emails for visitors, configured per chatbot." />
      </div>

      {bots === null ? <Skeleton variant="block" height={260} /> : bots.length === 0 ? (
        <div className="card"><EmptyState icon={<Plug />} title="Create a chatbot to get your embed code" action={<Link to="/app/chatbots?new=1" className="btn btn--primary"><Plus />Create chatbot</Link>} /></div>
      ) : (
        <>
          <div className="section-title">
            <div><h2>Install on your website</h2><p>Choose a chatbot to get its embed snippet.</p></div>
            <div className="row-wrap">
              <Select value={botId} onChange={(e) => { setBotId(e.target.value); setParams({ bot: e.target.value }, { replace: true }); }} aria-label="Chatbot" style={{ minWidth: 220 }}>
                {bots.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </div>
          </div>
          {bot && (
            <>
              <EmbedPanel bot={bot} compact />
              <div className="row-wrap">
                <Link to={`/app/chatbots/${bot.id}?tab=domains`} className="btn btn--secondary"><ShieldCheck />Manage domains</Link>
                <Link to={`/app/chatbots/${bot.id}?tab=embed`} className="btn btn--secondary"><Code2 />Test page & key rotation</Link>
                <Link to={`/app/chatbots/${bot.id}?tab=ai-profile`} className="btn btn--ghost"><ExternalLink />Email hand-off settings</Link>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function IntegrationCard({ icon, title, desc, status }: { icon: React.ReactNode; title: string; desc: string; status: string }) {
  return (
    <Card pad className="stack-sm">
      <div className="row" style={{ justifyContent: "space-between" }}><span className="stat__icon" style={{ width: 40, height: 40 }}>{icon}</span><Badge tone="success">{status}</Badge></div>
      <h3 style={{ marginTop: 6 }}>{title}</h3>
      <p className="text-sm muted">{desc}</p>
    </Card>
  );
}
