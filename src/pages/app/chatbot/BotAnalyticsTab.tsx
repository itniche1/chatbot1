import { useState } from "react";
import { Eye, MessagesSquare, Users, MessageCircle, Activity, RefreshCw } from "lucide-react";
import { useApi } from "../../../lib/useApi";
import { fmtNumber } from "../../../lib/format";
import { Button, Card, CardHeader, Segmented, Skeleton, Stat } from "../../../components/ui";
import { Funnel, LineChart } from "../../../components/app/Charts";

type BotAnalytics = {
  views: number; unique_visitors: number; conversations: number; leads: number; messages: number;
  view_to_conv_rate: number; conv_to_lead_rate: number;
  timeseries?: { date: string; views: number; conversations: number; leads: number }[];
};
const RANGES = [{ value: "24h", label: "24h" }, { value: "7d", label: "7 days" }, { value: "30d", label: "30 days" }, { value: "90d", label: "90 days" }];

export default function BotAnalyticsTab({ chatbotId }: { chatbotId: string }) {
  const [range, setRange] = useState("7d");
  const { data, loading, reload } = useApi<BotAnalytics>(`/chatbots/${chatbotId}/analytics`, { range });
  const v = (n?: number) => (loading && !data ? <Skeleton variant="title" width={60} /> : fmtNumber(n));

  return (
    <div className="stack-lg">
      <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <Segmented label="Date range" value={range} onChange={setRange} options={RANGES} />
        <Button variant="secondary" size="sm" icon={<RefreshCw />} onClick={reload} loading={loading && !!data}>Refresh</Button>
      </div>
      {!loading && !data ? (
        <Card pad><p className="muted text-sm" style={{ textAlign: "center", padding: 32 }}>No analytics yet for this range.</p></Card>
      ) : (
        <>
          <div className="grid-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
            <Stat icon={<Eye />} label="Views" value={v(data?.views)} hint={data ? `${fmtNumber(data.unique_visitors)} unique visitors` : undefined} />
            <Stat icon={<MessagesSquare />} label="Conversations" value={v(data?.conversations)} hint={data ? `${data.view_to_conv_rate}% of views` : undefined} />
            <Stat icon={<Users />} label="Leads" value={v(data?.leads)} hint={data ? `${data.conv_to_lead_rate}% of conversations` : undefined} />
            <Stat icon={<MessageCircle />} label="Messages" value={v(data?.messages)} />
            <Stat icon={<Activity />} label="Engagement" value={data ? `${data.view_to_conv_rate}%` : v(undefined)} hint="View → conversation" />
          </div>
          <Card>
            <CardHeader title="Funnel" description="How visitors move from seeing the widget to becoming leads." />
            <div className="card__body">
              {data ? <Funnel steps={[
                { label: "Views", value: data.views || 0, color: "var(--ink-950)" },
                { label: "Conversations", value: data.conversations || 0, color: "var(--ink-600)" },
                { label: "Leads", value: data.leads || 0, color: "var(--brand)" },
              ]} /> : <Skeleton variant="block" height={140} />}
            </div>
          </Card>
          <Card>
            <CardHeader title="Daily activity" />
            <div className="card__body">
              {data?.timeseries?.length ? (
                <LineChart data={data.timeseries} xKey="date" series={[
                  { key: "views", label: "Views", color: "var(--ink-300)" },
                  { key: "conversations", label: "Conversations", color: "var(--ink-950)" },
                  { key: "leads", label: "Leads", color: "var(--brand)" },
                ]} />
              ) : loading ? <Skeleton variant="block" height={220} /> : <p className="muted text-sm" style={{ textAlign: "center", padding: 32 }}>No activity in this range yet.</p>}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
