import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Bot, MessagesSquare, UserCheck, MessageCircle, ArrowUpFromLine, ArrowDownToLine, Coins, MoreHorizontal, Trash2, Megaphone, Send, ClipboardList, Cpu } from "lucide-react";
import { api, errorMessage, setTokens } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useApi } from "../../lib/useApi";
import { fmtDate, fmtDateTime, fmtNumber } from "../../lib/format";
import type { Plan } from "../../lib/types";
import { Avatar, Badge, Button, Card, CardHeader, EmptyState, Field, Input, Menu, MenuItem, Modal, PageHeader, Skeleton, SkeletonRows, Stat, Switch, Textarea, IconButton } from "../../components/ui";
import { useToast } from "../../components/ui/toast";

const short = (id?: string | null) => (id ? id.slice(0, 8) : "—");

/* ---------- Overview ---------- */
type AdminStats = { total_users?: number; suspended_users?: number; total_chatbots?: number; total_conversations?: number; total_leads?: number; total_messages?: number; prompt_tokens?: number; completion_tokens?: number; ai_cost_usd?: number | string };

export function AdminOverview() {
  const { data } = useApi<AdminStats>("/admin/stats");
  const v = (n?: number) => (data ? fmtNumber(n) : <Skeleton variant="title" width={70} />);
  return (
    <div className="page">
      <PageHeader eyebrow="Admin console" title="Platform overview" description="Platform-wide telemetry across all workspaces." />
      <div className="grid-4" style={{ marginBottom: "var(--sp-4)" }}>
        <Stat icon={<Users />} label="Total users" value={v(data?.total_users)} hint={data ? `${data.suspended_users ?? 0} suspended` : undefined} />
        <Stat icon={<Bot />} label="Chatbots" value={v(data?.total_chatbots)} />
        <Stat icon={<MessagesSquare />} label="Conversations" value={v(data?.total_conversations)} />
        <Stat icon={<UserCheck />} label="Leads" value={v(data?.total_leads)} />
      </div>
      <div className="grid-4">
        <Stat icon={<MessageCircle />} label="Messages" value={v(data?.total_messages)} />
        <Stat icon={<ArrowUpFromLine />} label="Prompt tokens" value={v(data?.prompt_tokens)} />
        <Stat icon={<ArrowDownToLine />} label="Completion tokens" value={v(data?.completion_tokens)} />
        <Stat icon={<Coins />} label="AI cost (USD)" value={data ? `$${data.ai_cost_usd ?? 0}` : v(undefined)} />
      </div>
    </div>
  );
}

/* ---------- Users ---------- */
type AdminUser = { id: string; name?: string; email: string; role?: string; plan_id?: string | null; is_suspended?: boolean; deleted_at?: string | null; message_count?: number; chatbot_count?: number; trial_ends_at?: string | null };

export function AdminUsers() {
  const toast = useToast();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [trialUser, setTrialUser] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    try {
      const [u, p] = await Promise.all([api.get(`/admin/users?include_deleted=${showDeleted}`), api.get("/admin/plans")]);
      setUsers(u.data); setPlans(p.data);
    } catch (err) { toast.error(errorMessage(err)); setUsers((x) => x ?? []); }
  }, [showDeleted, toast]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); load(); } catch (err) { toast.error(errorMessage(err)); }
  };
  const impersonate = async (u: AdminUser) => {
    if (!window.confirm(`Sign in as ${u.email}? Your admin session will be replaced. Sign out and back in as admin to return.`)) return;
    try {
      const { data } = await api.post(`/admin/users/${u.id}/impersonate`);
      if (data?.access_token) setTokens(data.access_token, data.refresh_token);
      toast.success(`Now impersonating ${u.email}`);
      await refresh();
      navigate("/app");
    } catch (err) { toast.error(errorMessage(err, "Failed to impersonate")); }
  };

  return (
    <div className="page page--wide">
      <PageHeader eyebrow="User management" title="Users" description={users ? `${users.length} account${users.length === 1 ? "" : "s"}` : "Loading…"}
        actions={<label className="row text-sm fw-700" style={{ gap: 10 }}>Show deleted<Switch checked={showDeleted} onChange={setShowDeleted} label="Show deleted users" /></label>} />
      <Card style={{ overflow: "hidden" }}>
        {users === null ? <SkeletonRows /> : users.length === 0 ? <EmptyState icon={<Users />} title="No users" /> : (
          <div className="table-wrap">
            <table className="table table--responsive">
              <thead><tr><th>User</th><th>Plan</th><th>Role</th><th>Usage</th><th>Status</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {users.map((u) => {
                  const deleted = !!u.deleted_at;
                  return (
                    <tr key={u.id} className={deleted ? "is-muted" : ""}>
                      <td data-label="User"><div className="row" style={{ gap: 10 }}><Avatar name={u.name || u.email} size="sm" /><div style={{ minWidth: 0 }}><div className="cell-primary truncate">{u.name || "—"}</div><div className="text-xs muted truncate">{u.email}</div></div></div></td>
                      <td data-label="Plan">
                        <select className="select input--sm" style={{ minWidth: 140, minHeight: 34 }} value={u.plan_id || "none"} disabled={deleted} aria-label={`Plan for ${u.email}`}
                          onChange={(e) => act(() => api.patch(`/admin/users/${u.id}`, { plan_id: e.target.value === "none" ? null : e.target.value }), "Plan updated")}>
                          <option value="none">No plan</option>
                          {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td data-label="Role"><Badge tone={u.role === "admin" ? "dark" : "neutral"} plain>{u.role}</Badge></td>
                      <td data-label="Usage" className="text-xs muted nowrap">{fmtNumber(u.message_count)} msgs · {fmtNumber(u.chatbot_count)} bots</td>
                      <td data-label="Status">{deleted ? <Badge tone="danger">Deleted</Badge> : u.is_suspended ? <Badge tone="warning">Suspended</Badge> : <Badge tone="success">Active</Badge>}</td>
                      <td className="cell-actions">
                        {deleted ? <Button size="sm" onClick={() => act(() => api.post(`/admin/users/${u.id}/restore`), "Restored")}>Restore</Button> : (
                          <Menu trigger={({ open, toggle }) => <IconButton label={`Actions for ${u.email}`} aria-expanded={open} onClick={toggle}><MoreHorizontal /></IconButton>}>
                            {(close) => (<>
                              <MenuItem onClick={() => { close(); setTrialUser(u); }}>Extend trial…</MenuItem>
                              <MenuItem onClick={() => { close(); impersonate(u); }}>Impersonate</MenuItem>
                              <MenuItem onClick={() => { close(); if (window.confirm(`Reset usage for ${u.email}?`)) act(() => api.post(`/admin/users/${u.id}/reset-usage`), "Usage reset"); }}>Reset usage</MenuItem>
                              <MenuItem onClick={() => { close(); act(() => api.patch(`/admin/users/${u.id}`, { is_suspended: !u.is_suspended }), u.is_suspended ? "Unsuspended" : "Suspended"); }}>{u.is_suspended ? "Unsuspend" : "Suspend"}</MenuItem>
                              <div className="menu__sep" />
                              <MenuItem danger icon={<Trash2 />} onClick={() => { close(); if (window.confirm(`Soft-delete ${u.email}? They can be restored later.`)) act(() => api.delete(`/admin/users/${u.id}`), "Deleted"); }}>Delete</MenuItem>
                            </>)}
                          </Menu>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <ExtendTrialModal user={trialUser} onClose={() => { setTrialUser(null); load(); }} />
    </div>
  );
}

function ExtendTrialModal({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const toast = useToast();
  const [days, setDays] = useState("7");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/users/${user.id}/extend-trial`, { days: Number(days) });
      toast.success(`Trial extended until ${fmtDate(data.trial_ends_at)}`);
      onClose();
    } catch (err) { toast.error(errorMessage(err, "Failed")); }
    finally { setBusy(false); }
  };
  return (
    <Modal open={!!user} onClose={onClose} title="Extend trial" description={user ? `${user.email} · currently ends ${user.trial_ends_at ? fmtDate(user.trial_ends_at) : "—"}` : undefined}
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="trial-form" loading={busy}>{busy ? "Extending…" : "Extend"}</Button></>}>
      <form id="trial-form" onSubmit={submit}><Field label="Add days" htmlFor="trial-days"><Input id="trial-days" type="number" min={1} max={365} value={days} onChange={(e) => setDays(e.target.value)} /></Field></form>
    </Modal>
  );
}

/* ---------- Chatbots ---------- */
type AdminBot = { id: string; name: string; public_id: string; is_active: boolean; deleted_at?: string | null; owner?: { name?: string; email?: string } };

export function AdminChatbots() {
  const toast = useToast();
  const [showDeleted, setShowDeleted] = useState(false);
  const { data, loading, reload } = useApi<AdminBot[]>(`/admin/chatbots?include_deleted=${showDeleted}`);
  const act = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); toast.success(ok); reload(); } catch (err) { toast.error(errorMessage(err)); } };
  return (
    <div className="page page--wide">
      <PageHeader eyebrow="Admin console" title="Chatbots" description={data ? `${data.length} bots` : "Loading…"}
        actions={<label className="row text-sm fw-700" style={{ gap: 10 }}>Show deleted<Switch checked={showDeleted} onChange={setShowDeleted} label="Show deleted chatbots" /></label>} />
      <Card style={{ overflow: "hidden" }}>
        {loading && !data ? <SkeletonRows /> : !data?.length ? <EmptyState icon={<Bot />} title="No chatbots" /> : (
          <div className="table-wrap">
            <table className="table table--responsive">
              <thead><tr><th>Bot</th><th>Owner</th><th>Status</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {data.map((b) => {
                  const deleted = !!b.deleted_at;
                  return (
                    <tr key={b.id} className={deleted ? "is-muted" : ""}>
                      <td data-label="Bot"><div className="cell-primary">{b.name}</div><div className="mono text-xs subtle">{b.public_id}</div></td>
                      <td data-label="Owner"><div>{b.owner?.name || "—"}</div><div className="text-xs muted">{b.owner?.email}</div></td>
                      <td data-label="Status">{deleted ? <Badge tone="danger">Deleted</Badge> : <Badge tone={b.is_active ? "success" : "neutral"}>{b.is_active ? "Active" : "Paused"}</Badge>}</td>
                      <td className="cell-actions">
                        {deleted ? <Button size="sm" onClick={() => act(() => api.post(`/admin/chatbots/${b.id}/restore`), "Restored")}>Restore</Button>
                          : <Button size="sm" variant="secondary" onClick={() => act(() => api.patch(`/admin/chatbots/${b.id}/toggle`), "Toggled")}>{b.is_active ? "Pause" : "Activate"}</Button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- Conversations / Usage / Audit (read-only tables) ---------- */
type AdminConv = { id: string; started_at?: string; owner_id?: string; chatbot_id?: string; message_count?: number };
export function AdminConversations() {
  const { data } = useApi<AdminConv[]>("/admin/conversations");
  return (
    <ReadOnlyTable title="Conversations" eyebrow="Admin console" icon={<MessagesSquare />} data={data} subtitle={(n) => `${n} latest sessions`} empty="No conversations yet"
      columns={["Started", "Owner", "Chatbot", "Messages"]}
      row={(c) => [fmtDateTime(c.started_at), <span className="mono text-xs">{short(c.owner_id)}</span>, <span className="mono text-xs">{short(c.chatbot_id)}</span>, fmtNumber(c.message_count)]} />
  );
}

type UsageRow = { id: string; created_at?: string; user_id?: string; chatbot_id?: string; prompt_tokens?: number; completion_tokens?: number; cost_usd?: number };
export function AdminUsage() {
  const { data } = useApi<UsageRow[]>("/admin/usage");
  return (
    <ReadOnlyTable title="AI Usage" eyebrow="Admin console" icon={<Cpu />} data={data} subtitle={() => "Recent message logs"} empty="No usage yet"
      columns={["Time", "User", "Chatbot", "Tokens (in / out)", "Cost (USD)"]}
      row={(u) => [fmtDateTime(u.created_at), <span className="mono text-xs">{short(u.user_id)}</span>, <span className="mono text-xs">{short(u.chatbot_id)}</span>, `${fmtNumber(u.prompt_tokens || 0)} / ${fmtNumber(u.completion_tokens || 0)}`, `$${(u.cost_usd || 0).toFixed(5)}`]} />
  );
}

type AuditRow = { id: string; created_at?: string; actor_id?: string; action?: string; target_id?: string; details?: Record<string, unknown> };
export function AdminAudit() {
  const { data } = useApi<AuditRow[]>("/admin/audit-logs");
  return (
    <ReadOnlyTable title="Audit Logs" eyebrow="Admin console" icon={<ClipboardList />} data={data} subtitle={() => "All admin actions"} empty="No audit logs yet"
      columns={["Time", "Actor", "Action", "Target", "Details"]}
      row={(a) => [fmtDateTime(a.created_at), <span className="mono text-xs">{short(a.actor_id)}</span>, <Badge tone="neutral" plain>{a.action}</Badge>, <span className="mono text-xs">{short(a.target_id)}</span>, <span className="mono text-xs muted truncate" style={{ display: "block", maxWidth: 320 }}>{JSON.stringify(a.details || {})}</span>]} />
  );
}

function ReadOnlyTable<T extends { id: string }>({ title, eyebrow, icon, data, subtitle, columns, row, empty }: { title: string; eyebrow: string; icon: React.ReactNode; data: T[] | null; subtitle: (n: number) => string; columns: string[]; row: (r: T) => React.ReactNode[]; empty: string }) {
  return (
    <div className="page page--wide">
      <PageHeader eyebrow={eyebrow} title={title} description={data ? subtitle(data.length) : "Loading…"} />
      <Card style={{ overflow: "hidden" }}>
        {data === null ? <SkeletonRows /> : data.length === 0 ? <EmptyState icon={icon} title={empty} /> : (
          <div className="table-wrap">
            <table className="table table--responsive">
              <thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>{data.map((r) => <tr key={r.id}>{row(r).map((cell, i) => <td key={i} data-label={columns[i]} className={i === 0 ? "nowrap" : undefined}>{cell}</td>)}</tr>)}</tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- Announcements ---------- */
type AdminAnnouncement = { id: string; title: string; body: string; created_at?: string };
export function AdminAnnouncements() {
  const toast = useToast();
  const { data, reload } = useApi<AdminAnnouncement[]>("/admin/announcements");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const post = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try { await api.post("/admin/announcements", { title, body, severity: "info" }); setTitle(""); setBody(""); toast.success("Posted"); reload(); }
    catch (err) { toast.error(errorMessage(err)); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    if (!window.confirm("Delete this announcement?")) return;
    try { await api.delete(`/admin/announcements/${id}`); reload(); } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div className="page">
      <PageHeader eyebrow="Admin console" title="Announcements" description="Broadcast messages to every user's workspace." />
      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)", alignItems: "start" }}>
        <Card>
          <CardHeader title="New announcement" />
          <form className="card__body stack" onSubmit={post}>
            <Field label="Title" htmlFor="an-title"><Input id="an-title" required value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="Body" htmlFor="an-body"><Textarea id="an-body" required rows={5} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
            <div><Button type="submit" icon={<Send />} loading={busy}>Post announcement</Button></div>
          </form>
        </Card>
        <Card>
          <CardHeader title="Published" description={data ? `${data.length} total` : undefined} />
          {data === null ? <SkeletonRows rows={3} /> : data.length === 0 ? <EmptyState compact icon={<Megaphone />} title="No announcements yet" /> : (
            <div className="list">
              {data.map((a) => (
                <div key={a.id} className="list-item" style={{ alignItems: "flex-start" }}>
                  <span className="stat__icon"><Megaphone /></span>
                  <div className="list-item__body">
                    <div className="list-item__title">{a.title}</div>
                    <p className="text-sm muted" style={{ whiteSpace: "pre-wrap", marginTop: 2 }}>{a.body}</p>
                    <div className="text-xs subtle" style={{ marginTop: 6 }}>{fmtDateTime(a.created_at)}</div>
                  </div>
                  <Button size="sm" variant="ghost" icon={<Trash2 />} onClick={() => remove(a.id)}>Delete</Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

