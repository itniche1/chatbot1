import { MessagesSquare, CheckCircle2, Users, MessageCircle, ArrowDownToLine, ArrowUpFromLine, Coins, Bot, RefreshCw } from "lucide-react";
import { useApi } from "../../lib/useApi";
import { fmtNumber } from "../../lib/format";
import { Button, Card, CardHeader, PageHeader, Skeleton, Stat } from "../../components/ui";
import { BarChart, Funnel } from "../../components/app/Charts";
import type { OverviewData } from "./Overview";

export default function Analytics() {
  const { data, loading, reload } = useApi<OverviewData>("/analytics/overview");
  const v = (n?: number | string) => (loading && !data ? <Skeleton variant="title" width={70} /> : typeof n === "string" ? n : fmtNumber(n));

  return (
    <div className="page">
      <PageHeader
        eyebrow="Analytics & reports"
        title="Analytics"
        description="Conversations, leads and AI spend across every chatbot in your workspace. Open a chatbot for its own funnel and daily trends."
        actions={<Button variant="secondary" icon={<RefreshCw />} onClick={reload} loading={loading && !!data}>Refresh</Button>}
      />

      <div className="grid-4" style={{ marginBottom: "var(--sp-4)" }}>
        <Stat icon={<MessagesSquare />} label="Conversations" value={v(data?.total_conversations)} />
        <Stat icon={<CheckCircle2 />} label="Successful" value={v(data?.successful_conversations)} hint={data ? `${data.engagement_rate ?? 0}% engagement` : undefined} />
        <Stat icon={<Users />} label="Leads captured" value={v(data?.total_leads)} />
        <Stat icon={<MessageCircle />} label="Messages" value={v(data?.total_messages)} />
      </div>
      <div className="grid-4" style={{ marginBottom: "var(--sp-8)" }}>
        <Stat icon={<ArrowUpFromLine />} label="Prompt tokens" value={v(data?.prompt_tokens)} />
        <Stat icon={<ArrowDownToLine />} label="Completion tokens" value={v(data?.completion_tokens)} />
        <Stat icon={<Coins />} label="AI cost (USD)" value={data ? `$${data.ai_cost_usd ?? 0}` : v(undefined)} />
        <Stat icon={<Bot />} label="Chatbots" value={v(data?.total_chatbots)} />
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)" }}>
        <Card>
          <CardHeader title="Messages — last 14 days" />
          <div className="card__body">
            {loading && !data ? <Skeleton variant="block" height={220} /> :
              data?.daily_messages?.length ? <BarChart data={data.daily_messages} xKey="date" yKey="messages" label="Messages" /> :
                <div className="muted text-sm" style={{ padding: "48px 0", textAlign: "center" }}>No messages in the last 14 days.</div>}
          </div>
        </Card>
        <Card>
          <CardHeader title="Conversation outcomes" description="From first message to captured lead." />
          <div className="card__body">
            {loading && !data ? <Skeleton variant="block" height={160} /> : (
              <Funnel steps={[
                { label: "Conversations", value: data?.total_conversations || 0, color: "var(--ink-950)" },
                { label: "Successful", value: data?.successful_conversations || 0, color: "var(--ink-600)" },
                { label: "Leads", value: data?.total_leads || 0, color: "var(--brand)" },
              ]} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
