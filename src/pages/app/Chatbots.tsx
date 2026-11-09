import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Bot, Plus, ArrowRight, Hash, Globe } from "lucide-react";
import { api, errorMessage } from "../../lib/api";
import { useWorkspace } from "../../lib/workspace";
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, Skeleton, Textarea } from "../../components/ui";
import { useToast } from "../../components/ui/toast";

export default function Chatbots() {
  const { bots, reloadBots, features, refreshFeatures } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "1");

  useEffect(() => { if (params.get("new") === "1") setOpen(true); }, [params]);
  const close = () => { setOpen(false); if (params.get("new")) setParams({}, { replace: true }); };
  const atLimit = !!features && features.usage?.chatbots >= features.features?.max_chatbots;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Chatbot settings"
        title="Chatbots"
        description="Create, configure and deploy AI assistants that answer in your brand voice."
        actions={<Button icon={<Plus />} onClick={() => setOpen(true)}>New chatbot</Button>}
      />
      {atLimit && <div className="callout callout--brand" style={{ marginBottom: "var(--sp-6)" }}><Bot /><div>You've used all <strong>{features!.features.max_chatbots}</strong> chatbots on your plan. <Link to="/app/billing" className="link">See plans</Link></div></div>}

      {bots === null ? (
        <div className="grid-3">{[0, 1, 2].map((i) => <Skeleton key={i} variant="block" height={200} />)}</div>
      ) : bots.length === 0 ? (
        <div className="card"><EmptyState icon={<Bot />} title="No chatbots yet" description="Spin up your first AI assistant in less than a minute." action={<Button icon={<Plus />} onClick={() => setOpen(true)}>Create your first chatbot</Button>} /></div>
      ) : (
        <div className="grid-3">
          {bots.map((b, i) => (
            <Link key={b.id} to={`/app/chatbots/${b.id}`} className="card card--hover card--pad bot-tile anim-fade-up"
              style={{ animationDelay: `${i * 40}ms`, ["--bot-color" as string]: b.appearance?.primary_color || "var(--brand)" }}>
              <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="bot-tile__avatar" style={{ background: b.appearance?.primary_color || "var(--brand)" }}>
                  {b.appearance?.logo_url ? <img src={b.appearance.logo_url} alt="" /> : b.name.charAt(0).toUpperCase()}
                </span>
                <Badge tone={b.is_active ? "success" : "neutral"}>{b.is_active ? "Active" : "Paused"}</Badge>
              </div>
              <div style={{ minWidth: 0 }}>
                <h3 className="truncate">{b.name}</h3>
                <div className="row text-xs subtle" style={{ gap: 4, marginTop: 4 }}><Hash size={12} /><span className="mono truncate">{b.public_id}</span></div>
              </div>
              <p className="text-sm muted" style={{ flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{b.behavior?.welcome_message || "No welcome message yet."}</p>
              <div className="bot-tile__foot">
                <span className="text-xs subtle row" style={{ gap: 6 }}><Globe size={13} />{b.allowed_domains?.length ? `${b.allowed_domains.length} domain${b.allowed_domains.length > 1 ? "s" : ""}` : "Any domain"}</span>
                <span className="link text-sm row" style={{ gap: 6, textDecoration: "none" }}>Configure<ArrowRight size={14} /></span>
              </div>
            </Link>
          ))}
          {!atLimit && (
            <button type="button" className="card card--pad bot-tile bot-tile--new" onClick={() => setOpen(true)}>
              <span className="empty__icon"><Plus /></span>
              <span className="fw-700" style={{ color: "var(--text-strong)" }}>New chatbot</span>
              <span className="text-xs">{features ? `${features.usage?.chatbots ?? 0} of ${features.features?.max_chatbots ?? "—"} used on your plan` : "Create another assistant"}</span>
            </button>
          )}
        </div>
      )}

      <CreateChatbotModal open={open} onClose={close} onCreated={async () => { await Promise.all([reloadBots(), refreshFeatures()]); }} />
    </div>
  );
}

export function CreateChatbotModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => Promise<void> | void }) {
  const [name, setName] = useState("");
  const [welcome, setWelcome] = useState("Hi! How can I help you today?");
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => { if (open) { setName(""); setWelcome("Hi! How can I help you today?"); } }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.post("/chatbots", { name, welcome_message: welcome });
      toast.success("Chatbot created");
      await onCreated();
      onClose();
      if (data?.id) navigate(`/app/chatbots/${data.id}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New chatbot" description="You can fine-tune its AI profile, knowledge and appearance next."
      footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="create-bot" loading={saving}>{saving ? "Creating…" : "Create chatbot"}</Button></>}>
      <form id="create-bot" className="stack" onSubmit={submit}>
        <Field label="Name" htmlFor="bot-name" hint="Visitors see this in the chat header."><Input id="bot-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="IT Niche Support" /></Field>
        <Field label="Welcome message" htmlFor="bot-welcome" hint="The first message visitors see when they open the chat."><Textarea id="bot-welcome" rows={3} value={welcome} onChange={(e) => setWelcome(e.target.value)} /></Field>
      </form>
    </Modal>
  );
}
