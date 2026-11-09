import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Settings2, Brain, Palette, BookOpen, BarChart3, ShieldCheck, Code2, Eye, EyeOff, Pause, Play, Trash2, RotateCw, MoreHorizontal } from "lucide-react";
import { api, errorMessage } from "../../../lib/api";
import { clearDraft, draftKey } from "../../../lib/drafts";
import { useWorkspace } from "../../../lib/workspace";
import type { Chatbot } from "../../../lib/types";
import { Badge, Button, Menu, MenuItem, Skeleton, Tabs } from "../../../components/ui";
import { useToast } from "../../../components/ui/toast";
import GeneralTab from "./GeneralTab";
import AiProfileTab from "./AiProfileTab";
import AppearanceTab from "./AppearanceTab";
import { KnowledgePanel } from "./KnowledgePanel";
import BotAnalyticsTab from "./BotAnalyticsTab";
import DomainsTab from "./DomainsTab";
import { EmbedPanel } from "./EmbedPanel";

export type TabProps = { bot: Chatbot; save: (patch: Partial<Chatbot>) => Promise<void>; saving: boolean };

const TABS = [
  { value: "general", label: "General", icon: <Settings2 /> },
  { value: "ai-profile", label: "AI profile", icon: <Brain /> },
  { value: "appearance", label: "Appearance", icon: <Palette /> },
  { value: "knowledge-base", label: "Knowledge base", icon: <BookOpen /> },
  { value: "analytics", label: "Analytics", icon: <BarChart3 /> },
  { value: "domains", label: "Domains", icon: <ShieldCheck /> },
  { value: "embed", label: "Embed", icon: <Code2 /> },
] as const;
type TabValue = (typeof TABS)[number]["value"];
const PREVIEW_KEY = "itniche_builder_preview";

export default function ChatbotDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { reloadBots, refreshFeatures } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.value === params.get("tab")) ? params.get("tab") : "general") as TabValue;
  const [bot, setBot] = useState<Chatbot | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(() => { try { return localStorage.getItem(PREVIEW_KEY) !== "0"; } catch { return true; } });
  const [previewKey, setPreviewKey] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/chatbots/${id}`);
      // Pull the server-side draft (if any) into localStorage so the forms can restore it — same as before.
      try {
        const d = await api.get(`/builder/chatbots/${id}/draft`);
        if (d.data?.draft) localStorage.setItem(draftKey(id), JSON.stringify(d.data.draft));
      } catch { /* no draft */ }
      setBot(data);
    } catch {
      toast.error("Could not load chatbot");
      navigate("/app/chatbots");
    }
  }, [id, navigate, toast]);

  useEffect(() => { setBot(null); load(); }, [load]);
  useEffect(() => { try { localStorage.setItem(PREVIEW_KEY, preview ? "1" : "0"); } catch { /* ignore */ } }, [preview]);

  const save = useCallback(async (patch: Partial<Chatbot>) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/chatbots/${id}`, patch);
      setBot(data);
      toast.success("Changes saved");
      clearDraft(id);
      setPreviewKey((k) => k + 1);
      reloadBots();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [id, toast, reloadBots]);

  const remove = async () => {
    if (!bot || !window.confirm(`Delete “${bot.name}”? This removes the chatbot and stops any embeds.`)) return;
    try {
      await api.delete(`/chatbots/${id}`);
      toast.success("Chatbot deleted");
      await Promise.all([reloadBots(), refreshFeatures()]);
      navigate("/app/chatbots");
    } catch (err) { toast.error(errorMessage(err)); }
  };

  if (!bot) {
    return <div className="page page--wide"><Skeleton width={120} /><Skeleton variant="title" style={{ marginTop: 16 }} /><Skeleton variant="block" height={360} style={{ marginTop: 32 }} /></div>;
  }

  const widgetUrl = `${window.location.origin}/widget/${bot.public_id}?sandbox=1`;
  const showPreview = preview && tab !== "analytics";
  const tabProps: TabProps = { bot, save, saving };

  return (
    <div className="page page--wide">
      <header className="page-header" style={{ marginBottom: "var(--sp-5)" }}>
        <div className="page-header__text">
          <Link to="/app/chatbots" className="breadcrumb"><ArrowLeft />Chatbots</Link>
          <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
            <h1 className="truncate">{bot.name}</h1>
            <Badge tone={bot.is_active ? "success" : "neutral"}>{bot.is_active ? "Active" : "Paused"}</Badge>
          </div>
          <p className="mono text-xs subtle" style={{ marginTop: 6 }}>ID {bot.public_id}</p>
        </div>
        <div className="page-header__actions">
          <Button variant="secondary" icon={preview ? <EyeOff /> : <Eye />} onClick={() => setPreview((p) => !p)} className="hide-below-xl">{preview ? "Hide preview" : "Show preview"}</Button>
          <Button variant={bot.is_active ? "secondary" : "primary"} icon={bot.is_active ? <Pause /> : <Play />} onClick={() => save({ is_active: !bot.is_active })} disabled={saving}>{bot.is_active ? "Pause" : "Activate"}</Button>
          <Menu trigger={({ open, toggle }) => <Button variant="secondary" iconOnly aria-label="More actions" aria-expanded={open} onClick={toggle}><MoreHorizontal /></Button>}>
            {(close) => (<>
              <MenuItem icon={<Code2 />} onClick={() => { close(); setParams({ tab: "embed" }); }}>Get embed code</MenuItem>
              <MenuItem icon={<RotateCw />} onClick={() => { close(); setPreviewKey((k) => k + 1); }}>Reload preview</MenuItem>
              <div className="menu__sep" />
              <MenuItem danger icon={<Trash2 />} onClick={() => { close(); remove(); }}>Delete chatbot</MenuItem>
            </>)}
          </Menu>
        </div>
      </header>

      <div style={{ marginBottom: "var(--sp-6)" }}>
        <Tabs label="Chatbot sections" value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} tabs={TABS.map((t) => ({ ...t }))} />
      </div>

      <div className={`builder ${showPreview ? "" : "no-preview"}`}>
        <div key={tab} className="anim-fade-up" style={{ minWidth: 0 }}>
          {tab === "general" && <GeneralTab {...tabProps} />}
          {tab === "ai-profile" && <AiProfileTab {...tabProps} />}
          {tab === "appearance" && <AppearanceTab {...tabProps} />}
          {tab === "knowledge-base" && <KnowledgePanel chatbotId={bot.id} />}
          {tab === "analytics" && <BotAnalyticsTab chatbotId={bot.id} />}
          {tab === "domains" && <DomainsTab {...tabProps} />}
          {tab === "embed" && <EmbedPanel bot={bot} />}
        </div>
        {showPreview && (
          <aside className="builder__preview hide-below-xl" aria-label="Live preview">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div><div className="fw-700 text-sm">Live preview</div><div className="text-xs muted">Sandbox — no quota used, no leads captured</div></div>
              <Button variant="ghost" size="sm" icon={<RotateCw />} onClick={() => setPreviewKey((k) => k + 1)}>Reload</Button>
            </div>
            <div className="preview-frame">
              <iframe key={previewKey} src={widgetUrl} title="Widget preview" sandbox="allow-scripts allow-same-origin allow-forms" allow="microphone; clipboard-write" />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
