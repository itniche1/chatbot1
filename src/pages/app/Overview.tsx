import { Link } from "react-router-dom";
import { Bot, MessagesSquare, Users, Activity, MessageCircle, Coins, ArrowRight, Plus, Upload, Code2, Sparkles, ChevronRight, Inbox } from "lucide-react";
import { useAuth } from "../../lib/auth";
import { useWorkspace } from "../../lib/workspace";
import { useApi } from "../../lib/useApi";
import { firstName, fmtNumber, greeting, relativeTime } from "../../lib/format";
import type { Conversation } from "../../lib/types";
import { Avatar, Card, CardHeader, EmptyState, Meter, Skeleton, SkeletonRows, Stat, Badge } from "../../components/ui";
import { BarChart } from "../../components/app/Charts";

export type OverviewData = {
  total_chatbots?: number; total_conversations?: number; successful_conversations?: number; total_leads?: number;
  engagement_rate?: number; total_messages?: number; prompt_tokens?: number; completion_tokens?: number; ai_cost_usd?: number | string;
  daily_messages?: { date: string; messages: number }[];
};

const QUICK = [
  { icon: Plus, title: "Create a chatbot", desc: "Name, tone and welcome message", to: "/app/chatbots?new=1" },
  { icon: Upload, title: "Add knowledge", desc: "Upload files or crawl a website", to: "/app/knowledge" },
  { icon: Code2, title: "Install on website", desc: "Copy one script tag", to: "/app/integrations" },
  { icon: MessagesSquare, title: "Review conversations", desc: "Inbox, transcripts and exports", to: "/app/conversations" },
];

export default function Overview() {
  const { user } = useAuth();
  const { features, bots } = useWorkspace();
  const { data, loading } = useApi<OverviewData>("/analytics/overview");
  const { data: convs, loading: convsLoading } = useApi<Conversation[]>("/conversations");
  const v = (n?: number) => (loading && !data ? <Skeleton variant="title" width={70} /> : fmtNumber(n));
  const activeBots = bots?.filter((b) => b.is_active).length;
  const msgs7 = data?.daily_messages?.slice(-7).reduce((t, d) => t + (Number(d.messages) || 0), 0);

  return (
    <div className="page">
      <section className="hero-band anim-fade-up" aria-label="Welcome">
        <div style={{ minWidth: 0, position: "relative" }}>
          <span className="eyebrow eyebrow--light">Dashboard</span>
          <h1>{greeting()}, <span className="accent">{firstName(user || null)}.</span></h1>
          <p>Here's how your AI assistants are engaging customers. Every conversation creates an opportunity.</p>
          <div className="hero-band__meta">
            <div><strong>{bots ? `${activeBots}/${bots.length}` : "—"}</strong><span>Chatbots live</span></div>
            <div><strong>{msgs7 == null ? "—" : fmtNumber(msgs7)}</strong><span>Messages · last 7 days</span></div>
            <div><strong>{data ? `$${data.ai_cost_usd ?? 0}` : "—"}</strong><span>AI cost to date</span></div>
          </div>
        </div>
        <div className="hero-band__actions">
          <Link to="/app" className="btn btn--light"><Sparkles />Open Assistant</Link>
          <Link to="/app/chatbots?new=1" className="btn btn--primary"><Plus />Create chatbot</Link>
        </div>
      </section>

      <nav className="quick-actions" aria-label="Quick actions">
        {QUICK.map(({ icon: Icon, title, desc, to }) => (
          <Link key={title} to={to} className="quick-action">
            <span className="quick-action__icon"><Icon /></span>
            <span style={{ minWidth: 0 }}><span className="quick-action__title" style={{ display: "block" }}>{title}</span><span className="quick-action__desc truncate" style={{ display: "block" }}>{desc}</span></span>
            <ChevronRight />
          </Link>
        ))}
      </nav>

      <div className="section-title"><div><h2>Performance</h2><p>All chatbots, all time.</p></div><Link to="/app/analytics" className="btn btn--ghost btn--sm">Full analytics<ArrowRight /></Link></div>
      <div className="grid-4" style={{ marginBottom: "var(--sp-4)" }}>
        <Stat icon={<Bot />} label="Chatbots" value={v(data?.total_chatbots)} hint={features ? `${features.usage?.chatbots ?? 0} of ${features.features?.max_chatbots ?? "—"} on your plan` : undefined} />
        <Stat icon={<MessagesSquare />} label="Conversations" value={v(data?.total_conversations)} hint={data ? `${fmtNumber(data.successful_conversations)} successful` : undefined} />
        <Stat icon={<Users />} label="Leads" value={v(data?.total_leads)} hint="Captured by your chatbots" />
        <Stat icon={<Activity />} label="Engagement" value={data ? `${data.engagement_rate ?? 0}%` : v(undefined)} hint="Successful conversations" />
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", marginBottom: "var(--sp-8)" }}>
        <Card>
          <CardHeader title="Messages — last 14 days" description="Visitor and assistant messages across all chatbots." />
          <div className="card__body">
            {loading && !data ? <Skeleton variant="block" height={200} /> :
              data?.daily_messages?.length ? <BarChart data={data.daily_messages} xKey="date" yKey="messages" label="Messages" /> :
                <EmptyState compact icon={<MessageCircle />} title="No messages yet" description="Share your chatbot to start the conversation." />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Usage" description="This billing period" actions={<Link to="/app/billing" className="btn btn--ghost btn--sm">Plan<ArrowRight /></Link>} />
          <div className="card__body stack-lg">
            <UsageRow icon={<MessageCircle size={16} />} label="Messages" used={features?.usage?.messages} max={features?.features?.max_messages} />
            <UsageRow icon={<Bot size={16} />} label="Chatbots" used={features?.usage?.chatbots} max={features?.features?.max_chatbots} />
            <div className="stack-sm" style={{ paddingTop: "var(--sp-4)", borderTop: "1px solid var(--border)" }}>
              <div className="row text-sm" style={{ justifyContent: "space-between" }}><span className="row" style={{ gap: 8, fontWeight: 700, color: "var(--text-strong)" }}><Coins size={16} className="text-brand" />AI cost</span><strong className="fw-900" style={{ fontSize: "var(--fs-lg)" }}>{data ? `$${data.ai_cost_usd ?? 0}` : "—"}</strong></div>
              <div className="row text-xs muted" style={{ justifyContent: "space-between" }}><span>Prompt tokens</span><span>{fmtNumber(data?.prompt_tokens)}</span></div>
              <div className="row text-xs muted" style={{ justifyContent: "space-between" }}><span>Completion tokens</span><span>{fmtNumber(data?.completion_tokens)}</span></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", alignItems: "start" }}>
        <Card>
          <CardHeader title="Recent conversations" description="Latest visitor activity across your chatbots." actions={<Link to="/app/conversations" className="btn btn--ghost btn--sm">Inbox<ArrowRight /></Link>} />
          {convsLoading && !convs ? <SkeletonRows rows={4} /> : convs && convs.length > 0 ? (
            <div className="activity">
              {convs.slice(0, 5).map((c) => (
                <Link key={c.id} to={`/app/conversations?c=${c.id}`} className="activity__row">
                  <Avatar name={c.lead?.name || c.lead?.email || c.title || "A"} size="sm" />
                  <div className="activity__body">
                    <div className="activity__title truncate">{c.title || c.lead?.name || "Anonymous visitor"}</div>
                    <div className="activity__meta truncate">{c.lead?.name ? `${c.lead.name} · ${c.message_count ?? 0} messages` : `${c.message_count ?? 0} messages · no lead details`}</div>
                  </div>
                  {c.lead && <Badge tone="brand" plain>Lead</Badge>}
                  <span className="activity__time">{relativeTime(c.last_message_at || c.started_at || c.created_at)}</span>
                </Link>
              ))}
            </div>
          ) : <EmptyState compact icon={<Inbox />} title="No conversations yet" description="When visitors chat with your website widget, they'll show up here." />}
        </Card>

        <Card>
          <CardHeader title="Your chatbots" description={bots ? `${bots.length} in this workspace` : undefined} actions={<Link to="/app/chatbots" className="btn btn--ghost btn--sm">Manage<ArrowRight /></Link>} />
          {bots === null ? <SkeletonRows rows={3} /> : bots.length > 0 ? (
            <div className="activity">
              {bots.slice(0, 5).map((b) => (
                <Link key={b.id} to={`/app/chatbots/${b.id}`} className="activity__row">
                  <span className="bot-tile__avatar" style={{ width: 32, height: 32, fontSize: "var(--fs-sm)", borderRadius: 8, background: b.appearance?.primary_color || "var(--brand)" }}>
                    {b.appearance?.logo_url ? <img src={b.appearance.logo_url} alt="" style={{ padding: 5 }} /> : b.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="activity__body"><div className="activity__title truncate">{b.name}</div><div className="activity__meta mono truncate">{b.public_id}</div></div>
                  <Badge tone={b.is_active ? "success" : "neutral"}>{b.is_active ? "Active" : "Paused"}</Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState compact icon={<Bot />} title="No chatbots yet" description="Spin up your first AI assistant in less than a minute."
              action={<Link to="/app/chatbots?new=1" className="btn btn--primary"><Plus />Create chatbot</Link>} />
          )}
        </Card>
      </div>
    </div>
  );
}

function UsageRow({ icon, label, used, max }: { icon: React.ReactNode; label: string; used?: number; max?: number }) {
  return (
    <div className="stack-sm">
      <div className="row text-sm" style={{ justifyContent: "space-between" }}>
        <span className="row" style={{ gap: 8, color: "var(--text-strong)", fontWeight: 700 }}><span className="text-brand" style={{ display: "inline-flex" }}>{icon}</span>{label}</span>
        <span className="muted">{used == null ? "—" : `${fmtNumber(used)} / ${fmtNumber(max)}`}</span>
      </div>
      <Meter value={used || 0} max={max || 0} />
    </div>
  );
}
