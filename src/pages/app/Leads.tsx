import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, RefreshCw, MoreHorizontal, Trash2, Users, StickyNote, MessagesSquare, Activity, Mail, Phone } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { fmtDate, fmtDateTime, relativeTime } from "../../lib/format";
import { useWorkspace } from "../../lib/workspace";
import type { Conversation, Lead } from "../../lib/types";
import { Avatar, Badge, Button, Card, Drawer, EmptyState, IconButton, Input, Menu, MenuItem, PageHeader, Select, SkeletonRows, Tabs, Textarea, type Tone } from "../../components/ui";
import { useToast } from "../../components/ui/toast";

export const LEAD_STATUS: Record<string, { label: string; tone: Tone }> = {
  new: { label: "New", tone: "info" },
  contacted: { label: "Contacted", tone: "warning" },
  qualified: { label: "Qualified", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};
const ORDER = ["new", "contacted", "qualified", "closed"] as const;
type Status = (typeof ORDER)[number];
type LeadDetail = {
  lead: Lead;
  notes?: { id: string; body: string; author_name?: string; created_at?: string }[];
  conversations?: Conversation[];
  events?: { id: string; event: string; details?: Record<string, unknown>; created_at?: string }[];
};

export default function Leads() {
  const toast = useToast();
  const { bots } = useWorkspace();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [status, setStatus] = useState<"all" | Status>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [botId, setBotId] = useState("");
  const [active, setActive] = useState<Lead | null>(null);
  const [detail, setDetail] = useState<LeadDetail | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebouncedQ(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  const load = useCallback(async () => {
    const params: Record<string, string> = {};
    if (status !== "all") params.status = status;
    if (debouncedQ) params.q = debouncedQ;
    if (botId) params.chatbot_id = botId;
    try { setLeads((await api.get("/leads", { params })).data); } catch { setLeads([]); }
  }, [status, debouncedQ, botId]);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads?.length || 0, new: 0, contacted: 0, qualified: 0, closed: 0 };
    (leads || []).forEach((l) => { const s = l.status || "new"; c[s] = (c[s] || 0) + 1; });
    return c;
  }, [leads]);

  const openLead = async (lead: Lead) => {
    setActive(lead); setDetail(null);
    try { setDetail((await api.get(`/leads/${lead.id}`)).data); }
    catch (err) { toast.error(errorMessage(err, "Couldn't load lead details")); setDetail({ lead, notes: [], conversations: [], events: [] }); }
  };

  const setLeadStatus = async (id: string, s: Status) => {
    try {
      await api.post(`/leads/${id}/status`, { status: s });
      toast.success(`Marked ${LEAD_STATUS[s].label.toLowerCase()}`);
      setLeads((l) => (l || []).map((x) => (x.id === id ? { ...x, status: s } : x)));
      if (active?.id === id) {
        setActive((a) => (a ? { ...a, status: s } : a));
        setDetail((d) => (d ? { ...d, lead: { ...d.lead, status: s } } : d));
      }
    } catch (err) { toast.error(errorMessage(err)); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this lead? This cannot be undone.")) return;
    try {
      await api.delete(`/leads/${id}`);
      toast.success("Lead deleted");
      setLeads((l) => (l || []).filter((x) => x.id !== id));
      if (active?.id === id) setActive(null);
    } catch (err) { toast.error(errorMessage(err)); }
  };

  const filtered = q || status !== "all" || botId;

  return (
    <div className="page page--wide">
      <PageHeader eyebrow="Lead capture" title="Leads" description="Every visitor who shared their details. Triage, add notes and follow up — all in one place."
        actions={<Button variant="secondary" icon={<RefreshCw />} onClick={load}>Refresh</Button>} />

      <Card style={{ overflow: "hidden" }}>
        <div style={{ padding: "0 var(--sp-5)" }}>
          <Tabs label="Lead status" value={status} onChange={setStatus} tabs={[
            { value: "all", label: "All", count: counts.all },
            ...ORDER.map((s) => ({ value: s, label: LEAD_STATUS[s].label, count: counts[s] || 0 })),
          ]} />
        </div>
        <div className="row-wrap" style={{ padding: "var(--sp-4) var(--sp-5)", borderBottom: "1px solid var(--border)" }}>
          <div className="input-group" style={{ flex: "1 1 260px" }}><Search /><Input className="input--sm" style={{ paddingLeft: 38 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or phone" aria-label="Search leads" /></div>
          <Select className="input--sm" style={{ flex: "0 1 220px", minHeight: 36 }} value={botId} onChange={(e) => setBotId(e.target.value)} aria-label="Filter by chatbot">
            <option value="">All chatbots</option>
            {(bots || []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </div>

        {leads === null ? <SkeletonRows /> : leads.length === 0 ? (
          <EmptyState icon={<Users />} title={filtered ? "No leads match these filters" : "No leads yet"}
            description={filtered ? "Try clearing the search or choosing another status." : "Turn on “Capture leads before chat” in a chatbot's General settings to start collecting them."}
            action={!filtered ? <Link to="/app/chatbots" className="btn btn--secondary">Go to chatbots</Link> : undefined} />
        ) : (
          <div className="table-wrap">
            <table className="table table--responsive">
              <thead><tr><th>Lead</th><th>Phone</th><th>Status</th><th>Contacts</th><th>Captured</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {leads.map((l) => {
                  const st = LEAD_STATUS[l.status || "new"] || LEAD_STATUS.new;
                  return (
                    <tr key={l.id} className="is-clickable" onClick={() => openLead(l)}>
                      <td data-label="Lead">
                        <div className="row" style={{ gap: 10 }}>
                          <Avatar name={l.name || l.email} size="sm" />
                          <div style={{ minWidth: 0 }}><div className="cell-primary truncate">{l.name || "—"}</div><div className="text-xs muted truncate">{l.email}</div></div>
                        </div>
                      </td>
                      <td data-label="Phone" className="mono text-xs muted">{l.phone || "—"}</td>
                      <td data-label="Status"><Badge tone={st.tone}>{st.label}</Badge></td>
                      <td data-label="Contacts" className="muted">{l.contact_count || 1}×</td>
                      <td data-label="Captured" className="muted nowrap">{fmtDate(l.created_at)}</td>
                      <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                        <Menu trigger={({ open, toggle }) => <IconButton label="Lead actions" aria-expanded={open} onClick={toggle}><MoreHorizontal /></IconButton>}>
                          {(close) => (<>
                            <div className="menu__label">Mark as</div>
                            {ORDER.filter((s) => s !== (l.status || "new")).map((s) => <MenuItem key={s} onClick={() => { close(); setLeadStatus(l.id, s); }}>{LEAD_STATUS[s].label}</MenuItem>)}
                            <div className="menu__sep" />
                            <MenuItem danger icon={<Trash2 />} onClick={() => { close(); remove(l.id); }}>Delete lead</MenuItem>
                          </>)}
                        </Menu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <LeadDrawer lead={active} detail={detail} onClose={() => { setActive(null); setDetail(null); }} onStatus={(s) => active && setLeadStatus(active.id, s)}
        onDelete={() => active && remove(active.id)} onChanged={() => active && openLead(active)} />
    </div>
  );
}

function LeadDrawer({ lead, detail, onClose, onStatus, onDelete, onChanged }: { lead: Lead | null; detail: LeadDetail | null; onClose: () => void; onStatus: (s: Status) => void; onDelete: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => setNote(""), [lead?.id]);
  if (!lead) return null;
  const st = (lead.status || "new") as Status;

  const addNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    try { await api.post(`/leads/${lead.id}/notes`, { body: note.trim() }); setNote(""); toast.success("Note added"); onChanged(); }
    catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };
  const deleteNote = async (id: string) => {
    try { await api.delete(`/leads/${lead.id}/notes/${id}`); toast.success("Note removed"); onChanged(); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <Drawer open={!!lead} onClose={onClose} header={
      <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
        <Avatar name={lead.name || lead.email} size="lg" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 className="truncate" style={{ fontSize: "var(--fs-xl)" }}>{lead.name || "Anonymous lead"}</h2>
          <a href={`mailto:${lead.email}`} className="link text-sm" style={{ fontWeight: 400 }}>{lead.email}</a>
          <div className="row-wrap" style={{ marginTop: 12, gap: 8 }}>
            <select className="select input--sm" style={{ width: "auto", minHeight: 34 }} value={st} onChange={(e) => onStatus(e.target.value as Status)} aria-label="Lead status">
              {ORDER.map((s) => <option key={s} value={s}>{LEAD_STATUS[s].label}</option>)}
            </select>
            <a href={`mailto:${lead.email}`} className="btn btn--secondary btn--sm"><Mail />Email</a>
            {lead.phone && <a href={`tel:${lead.phone}`} className="btn btn--secondary btn--sm"><Phone />Call</a>}
            <Button variant="ghost" size="sm" icon={<Trash2 />} onClick={onDelete}>Delete</Button>
          </div>
        </div>
      </div>
    }>
      <div className="grid-3" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))", marginBottom: "var(--sp-6)" }}>
        <Fact label="Phone" value={lead.phone || "—"} />
        <Fact label="Contacts" value={`${lead.contact_count || 1}×`} />
        <Fact label="Last seen" value={relativeTime(lead.last_seen_at || lead.created_at)} />
      </div>

      <DrawerSection icon={<StickyNote />} title={`Notes (${detail?.notes?.length || 0})`}>
        <form onSubmit={addNote} className="stack-sm">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note (only your team can see this)…" aria-label="New note" />
          <div><Button type="submit" size="sm" loading={saving} disabled={!note.trim()}>Add note</Button></div>
        </form>
        {(detail?.notes || []).map((n) => (
          <div key={n.id} className="note">
            <div className="row text-xs muted" style={{ justifyContent: "space-between" }}>
              <span><strong style={{ color: "var(--text-strong)" }}>{n.author_name}</strong> · {fmtDateTime(n.created_at)}</span>
              <IconButton size="sm" label="Delete note" onClick={() => deleteNote(n.id)}><Trash2 /></IconButton>
            </div>
            <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{n.body}</p>
          </div>
        ))}
      </DrawerSection>

      <DrawerSection icon={<MessagesSquare />} title={`Conversations (${detail?.conversations?.length || 0})`}>
        {!detail ? <SkeletonRows rows={2} /> : detail.conversations?.length ? detail.conversations.map((c) => (
          <Link key={c.id} to={`/app/conversations?c=${c.id}`} className="note note--link">
            <div className="fw-700 text-sm truncate">{c.title || "Conversation"}</div>
            <div className="text-xs muted">{c.message_count ?? 0} messages · {c.status || "—"} · {relativeTime(c.last_message_at || c.created_at)}</div>
          </Link>
        )) : <p className="text-sm muted">No conversations yet.</p>}
      </DrawerSection>

      <DrawerSection icon={<Activity />} title={`Activity (${detail?.events?.length || 0})`}>
        {detail?.events?.length ? (
          <ol className="timeline">
            {detail.events.map((e) => (
              <li key={e.id}>
                <div className="text-xs subtle">{fmtDateTime(e.created_at)}</div>
                <div className="text-sm"><strong style={{ textTransform: "capitalize" }}>{e.event.replace(/_/g, " ")}</strong>{e.details && Object.keys(e.details).length > 0 && <span className="muted"> · {JSON.stringify(e.details).slice(0, 100)}</span>}</div>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm muted">{detail ? "No activity yet." : "Loading…"}</p>}
      </DrawerSection>
    </Drawer>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="card" style={{ padding: 12 }}><div className="eyebrow" style={{ color: "var(--text-subtle)" }}>{label}</div><div className="fw-700 text-sm truncate" style={{ marginTop: 4 }}>{value}</div></div>;
}
function DrawerSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "var(--sp-8)" }}>
      <h4 className="row" style={{ gap: 8, marginBottom: 12 }}><span className="text-brand" style={{ display: "inline-flex" }}>{icon}</span>{title}</h4>
      <div className="stack-sm">{children}</div>
    </section>
  );
}
