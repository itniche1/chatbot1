import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, Search, X, MessagesSquare, FileSpreadsheet, FileText, ArrowLeft, RefreshCw, Globe, Mail, Phone } from "lucide-react";
import { API_BASE, api, errorMessage } from "../../lib/api";
import { fmtDate, fmtDay, fmtTime, relativeTime, startsNewDay } from "../../lib/format";
import { useWorkspace } from "../../lib/workspace";
import type { ChatMessage, Conversation, Lead } from "../../lib/types";
import { Avatar, Badge, Button, Card, EmptyState, Field, IconButton, Input, Modal, PageHeader, Select, SkeletonRows, Spinner } from "../../components/ui";
import { useToast } from "../../components/ui/toast";
import { Markdown } from "../../components/chat/Markdown";
import { LEAD_STATUS } from "./Leads";

type Detail = { conversation: Conversation; lead?: Lead | null; messages: (ChatMessage & { id: string })[] };
type Hit = { message_id: string; conversation_id: string; role: string; snippet: string; created_at?: string; conversation: { title?: string }; lead?: { name?: string } };
type ExportJob = { id: string; format: "csv" | "pdf"; scope: string; status: string };

export default function Conversations() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [list, setList] = useState<Conversation[] | null>(null);
  const [selected, setSelected] = useState<string | null>(params.get("c"));
  const [detail, setDetail] = useState<Detail | null>(null);
  const [q, setQ] = useState(params.get("q") || "");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [exportOpen, setExportOpen] = useState(false);

  const loadList = useCallback(async () => {
    try { setList((await api.get("/conversations")).data); } catch { setList([]); }
  }, []);
  const loadExports = useCallback(async () => {
    try { setExports((await api.get("/exports")).data || []); } catch { /* optional */ }
  }, []);
  useEffect(() => { loadList(); loadExports(); }, [loadList, loadExports]);

  const open = useCallback(async (id: string, highlight?: string | null) => {
    setSelected(id);
    setDetail(null);
    try {
      const { data } = await api.get(`/conversations/${id}`);
      setDetail(data);
      if (highlight) setTimeout(() => {
        const el = document.getElementById(`msg-${highlight}`);
        if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); el.classList.add("is-highlight"); setTimeout(() => el.classList.remove("is-highlight"), 2400); }
      }, 250);
    } catch (err) { toast.error(errorMessage(err, "Couldn't open this conversation")); }
  }, [toast]);

  // Deep links: ?c=<conversation>&m=<message>
  useEffect(() => { const c = params.get("c"); if (c) open(c, params.get("m")); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setHits(null); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      try { setHits((await api.get("/messages/search", { params: { q: term, limit: 50 } })).data); }
      catch { setHits([]); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const exportOne = async (id: string, format: "csv" | "pdf") => {
    try {
      await api.post("/exports", null, { params: { format, scope: "conversation", conversation_id: id } });
      toast.success(`${format.toUpperCase()} export queued — it will appear under Recent exports`);
      loadExports();
    } catch (err) { toast.error(errorMessage(err)); }
  };

  const back = () => { setSelected(null); setDetail(null); setParams({}, { replace: true }); };

  return (
    <div className="page page--wide">
      <PageHeader
        eyebrow="Conversation management"
        title="Conversations"
        description="Every chat your bots have handled. Search across messages, review transcripts and export records."
        actions={<>
          <Button variant="secondary" icon={<RefreshCw />} onClick={() => { loadList(); loadExports(); }}>Refresh</Button>
          <Button variant="dark" icon={<Download />} onClick={() => setExportOpen(true)}>Export</Button>
        </>}
      />

      {exports.length > 0 && <RecentExports exports={exports} onRefresh={loadExports} />}

      <Card style={{ overflow: "hidden" }}>
        <div className={`split ${selected ? "has-selection" : ""}`}>
          <div className="split__list">
            <div style={{ padding: 12, borderBottom: "1px solid var(--border)", position: "sticky", top: 0, background: "var(--surface)", zIndex: 1 }}>
              <div className="input-group">
                <Search />
                <Input className="input--sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all messages…" aria-label="Search messages" style={{ paddingLeft: 38, paddingRight: 36 }} />
                {q && <span className="input-group__end"><IconButton size="sm" label="Clear search" onClick={() => setQ("")}><X /></IconButton></span>}
              </div>
              {hits !== null && <div className="text-xs muted" style={{ marginTop: 8 }}>{searching ? "Searching…" : `${hits.length} message match${hits.length === 1 ? "" : "es"}`}</div>}
            </div>

            {hits !== null ? (
              hits.length === 0 && !searching ? <EmptyState compact icon={<Search />} title="No matches" description="Try a different word or phrase." /> : (
                <div className="list">
                  {hits.map((h) => (
                    <button key={h.message_id} type="button" className={`list-item ${selected === h.conversation_id ? "is-active" : ""}`} onClick={() => open(h.conversation_id, h.message_id)}>
                      <div className="list-item__body">
                        <div className="row" style={{ justifyContent: "space-between" }}><span className="list-item__title truncate">{h.conversation?.title || "Conversation"}</span><span className="text-xs subtle nowrap">{fmtDate(h.created_at)}</span></div>
                        <div className="text-xs subtle">{h.lead?.name || h.role}</div>
                        <div className="list-item__meta" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginTop: 2 }}>{h.snippet}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )
            ) : list === null ? <SkeletonRows /> : list.length === 0 ? (
              <EmptyState compact icon={<MessagesSquare />} title="No conversations yet" description="When visitors chat with your bots, they'll appear here." />
            ) : (
              <div className="list">
                {list.map((c) => (
                  <button key={c.id} type="button" className={`list-item ${selected === c.id ? "is-active" : ""}`} onClick={() => open(c.id)}>
                    <Avatar name={c.lead?.name || c.lead?.email || c.title || "A"} size="sm" />
                    <div className="list-item__body">
                      <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                        <span className="list-item__title truncate">{c.title || c.lead?.name || "Anonymous"}</span>
                        <span className="text-xs subtle nowrap">{relativeTime(c.last_message_at || c.started_at || c.created_at)}</span>
                      </div>
                      <div className="list-item__meta truncate">{c.lead?.name ? `${c.lead.name} · ${c.lead.email}` : c.lead?.email || "No lead details"}</div>
                      <div className="text-xs subtle" style={{ marginTop: 2 }}>{c.message_count ?? 0} messages</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="split__detail">
            {!selected ? (
              <EmptyState icon={<MessagesSquare />} title={hits !== null ? "Pick a result" : "Select a conversation"} description="Choose a conversation to read the full transcript." />
            ) : !detail ? (
              <div style={{ display: "grid", placeItems: "center", height: "100%", minHeight: 300 }}><Spinner /></div>
            ) : (
              <Transcript detail={detail} onBack={back} onExport={(f) => exportOne(detail.conversation.id, f)} />
            )}
          </div>
        </div>
      </Card>

      <ExportModal open={exportOpen} onClose={() => { setExportOpen(false); loadExports(); }} />
    </div>
  );
}

function Transcript({ detail, onBack, onExport }: { detail: Detail; onBack: () => void; onExport: (f: "csv" | "pdf") => void }) {
  const { conversation: c, lead, messages } = detail;
  const status = lead?.status ? LEAD_STATUS[lead.status] : null;
  return (
    <div>
      <div className="transcript__head">
        <div className="row" style={{ alignItems: "flex-start", minWidth: 0 }}>
          <IconButton label="Back to list" onClick={onBack} className="show-below-md"><ArrowLeft /></IconButton>
          <Avatar name={lead?.name || lead?.email || c.title || "A"} />
          <div style={{ minWidth: 0 }}>
            <h3 className="truncate">{c.title || lead?.name || "Anonymous"}</h3>
            <div className="row-wrap text-xs muted" style={{ gap: 12, marginTop: 4 }}>
              {lead?.name && <span>{lead.name}</span>}
              {lead?.email && <span className="row" style={{ gap: 4 }}><Mail size={12} /><a href={`mailto:${lead.email}`} className="link" style={{ fontWeight: 400 }}>{lead.email}</a></span>}
              {lead?.phone && <span className="row" style={{ gap: 4 }}><Phone size={12} />{lead.phone}</span>}
              {status && <Badge tone={status.tone}>{status.label}</Badge>}
            </div>
            {c.page_url && <div className="row text-xs subtle truncate" style={{ gap: 4, marginTop: 6 }}><Globe size={12} /><span className="truncate mono">{c.page_url}</span></div>}
          </div>
        </div>
        <div className="row" style={{ gap: 6, flex: "none" }}>
          <Button size="sm" variant="secondary" icon={<FileSpreadsheet />} onClick={() => onExport("csv")}>CSV</Button>
          <Button size="sm" variant="secondary" icon={<FileText />} onClick={() => onExport("pdf")}>PDF</Button>
        </div>
      </div>
      <div className="transcript">
        {messages.map((m, i) => (
          <div key={m.id || i}>
            {startsNewDay(messages, i) && <div className="transcript__day"><span>{fmtDay(m.created_at)}</span></div>}
            <div id={`msg-${m.id}`} className={`tmsg tmsg--${m.role}`}>
              <div className="tmsg__who">{m.role === "user" ? lead?.name || "Visitor" : "Assistant"} · {fmtTime(m.created_at)}</div>
              <div className="tmsg__bubble"><Markdown content={m.content} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentExports({ exports, onRefresh }: { exports: ExportJob[]; onRefresh: () => void }) {
  return (
    <div className="card" style={{ padding: "12px 16px", marginBottom: "var(--sp-5)" }}>
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
        <span className="eyebrow" style={{ color: "var(--text-muted)" }}>Recent exports</span>
        <IconButton size="sm" label="Refresh exports" onClick={onRefresh}><RefreshCw /></IconButton>
      </div>
      <div className="row-wrap" style={{ gap: 8 }}>
        {exports.slice(0, 6).map((e) => (
          <div key={e.id} className="chip" style={{ paddingRight: e.status === "ready" ? 4 : 12, height: 34 }}>
            {e.format === "csv" ? <FileSpreadsheet size={14} /> : <FileText size={14} />}
            <span style={{ textTransform: "capitalize" }}>{e.scope}</span>
            <Badge tone={e.status === "ready" ? "success" : e.status === "failed" ? "danger" : "brand"}>{e.status}</Badge>
            {e.status === "ready" && <button type="button" className="btn btn--sm btn--ghost" style={{ height: 26, width: "auto", borderRadius: 999, padding: "0 10px" }} onClick={() => window.open(`${API_BASE}/exports/${e.id}/download`, "_blank")}><Download size={13} />Download</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast();
  const { bots } = useWorkspace();
  const [format, setFormat] = useState("csv");
  const [scope, setScope] = useState("all");
  const [botId, setBotId] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const p: Record<string, string> = { format, scope };
      if (scope === "chatbot") p.chatbot_id = botId;
      await api.post("/exports", null, { params: p });
      toast.success("Export queued — check back in a few seconds");
      onClose();
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Export conversations" description="Exports run in the background and appear under Recent exports."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="export-form" loading={busy} disabled={scope === "chatbot" && !botId}>{busy ? "Queuing…" : "Start export"}</Button></>}>
      <form id="export-form" className="stack" onSubmit={submit}>
        <Field label="Format" htmlFor="ex-format"><Select id="ex-format" value={format} onChange={(e) => setFormat(e.target.value)}><option value="csv">CSV — spreadsheet ready</option><option value="pdf">PDF — print friendly</option></Select></Field>
        <Field label="Scope" htmlFor="ex-scope"><Select id="ex-scope" value={scope} onChange={(e) => setScope(e.target.value)}><option value="all">All conversations</option><option value="chatbot">One chatbot</option></Select></Field>
        {scope === "chatbot" && (
          <Field label="Chatbot" htmlFor="ex-bot"><Select id="ex-bot" value={botId} onChange={(e) => setBotId(e.target.value)}><option value="">Choose a chatbot…</option>{(bots || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</Select></Field>
        )}
      </form>
    </Modal>
  );
}
