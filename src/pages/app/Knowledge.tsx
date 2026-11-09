import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Bot, Plus, ArrowRight } from "lucide-react";
import { useWorkspace } from "../../lib/workspace";
import { EmptyState, Field, PageHeader, Select, Skeleton } from "../../components/ui";
import { KnowledgePanel } from "./chatbot/KnowledgePanel";

/** Workspace-level entry to each chatbot's knowledge base (same endpoints as the chatbot's KB tab). */
export default function Knowledge() {
  const { bots } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [botId, setBotId] = useState(params.get("bot") || "");

  useEffect(() => { if (bots?.length && !bots.some((b) => b.id === botId)) setBotId(bots[0].id); }, [bots, botId]);
  const choose = (id: string) => { setBotId(id); setParams({ bot: id }, { replace: true }); };
  const bot = bots?.find((b) => b.id === botId);

  return (
    <div className="page">
      <PageHeader eyebrow="Knowledge management" title="Knowledge Base" description="Teach each assistant your business — documents and website pages it can answer from."
        actions={bot && <Link to={`/app/chatbots/${bot.id}?tab=ai-profile`} className="btn btn--secondary">Grounding settings<ArrowRight /></Link>} />
      {bots === null ? <Skeleton variant="block" height={300} /> : bots.length === 0 ? (
        <div className="card"><EmptyState icon={<BookOpen />} title="Create a chatbot first" description="Each chatbot has its own knowledge base." action={<Link to="/app/chatbots?new=1" className="btn btn--primary"><Plus />Create chatbot</Link>} /></div>
      ) : (
        <>
          <div className="card card--pad row-wrap" style={{ marginBottom: "var(--sp-6)", justifyContent: "space-between" }}>
            <div className="row"><span className="stat__icon" style={{ width: 40, height: 40 }}><Bot /></span><div><div className="fw-700">Knowledge for</div><div className="text-xs muted">Sources are managed per chatbot.</div></div></div>
            <div style={{ flex: "0 1 320px", minWidth: 220 }}>
              <Field label={<span className="sr-only">Chatbot</span>}>
                <Select value={botId} onChange={(e) => choose(e.target.value)} aria-label="Chatbot">{bots.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select>
              </Field>
            </div>
          </div>
          {botId && <KnowledgePanel key={botId} chatbotId={botId} />}
        </>
      )}
    </div>
  );
}
