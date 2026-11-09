import { useState } from "react";
import { Sparkles, Plus, X, CloudUpload } from "lucide-react";
import { api, errorMessage } from "../../../lib/api";
import { readDraft, useDraftAutosave } from "../../../lib/drafts";
import { Button, Field, Input, Select, SwitchRow, Textarea } from "../../../components/ui";
import { useToast } from "../../../components/ui/toast";
import { FormSection, SaveBar } from "./FormSection";
import type { TabProps } from "./ChatbotDetail";

const TONES = [
  { id: "friendly", label: "Friendly", desc: "Warm, casual, uses emoji sparingly" },
  { id: "professional", label: "Professional", desc: "Polished, business-grade, no slang" },
  { id: "playful", label: "Playful", desc: "Light-hearted, witty, energetic" },
  { id: "concise", label: "Concise", desc: "Direct, minimal, gets to the point" },
  { id: "formal", label: "Formal", desc: "Reserved, courteous, complete sentences" },
];
const LENGTHS = [
  { id: "short", label: "Short", desc: "≤ 2 sentences" },
  { id: "medium", label: "Medium", desc: "2–4 sentences" },
  { id: "long", label: "Long", desc: "Paragraph / bullets" },
];
const ROLES = [
  "Customer support and sales assistant", "Customer support assistant", "Sales assistant", "Lead qualification assistant",
  "Product advisor", "Booking and scheduling assistant", "General business assistant",
];

type AiDraft = {
  prompt?: string; tone?: string; responseLength?: string; onlyKB?: boolean; companyName?: string; agentRole?: string; companyProfile?: string;
  fallbackMessage?: string; escEnabled?: boolean; escEmail?: string; triggerPhrases?: string[]; transcript?: boolean;
};

export default function AiProfileTab({ bot, save, saving }: TabProps) {
  const toast = useToast();
  const d = (readDraft(bot.id)?.aiProfile || {}) as AiDraft;
  const b = bot.behavior || {};
  const [prompt, setPrompt] = useState(d.prompt ?? b.system_prompt ?? "");
  const [tone, setTone] = useState(d.tone ?? b.tone ?? "");
  const [responseLength, setResponseLength] = useState(d.responseLength ?? b.response_length ?? "");
  const [onlyKB, setOnlyKB] = useState(d.onlyKB ?? b.only_answer_from_kb ?? true);
  const [companyName, setCompanyName] = useState(d.companyName ?? b.company_name ?? "");
  const [agentRole, setAgentRole] = useState(d.agentRole ?? b.agent_role ?? "");
  const [companyProfile, setCompanyProfile] = useState(d.companyProfile ?? b.company_profile ?? "");
  const [fallbackMessage, setFallbackMessage] = useState(d.fallbackMessage ?? b.fallback_message ?? "");
  const [escEnabled, setEscEnabled] = useState(d.escEnabled ?? b.escalation_enabled ?? false);
  const [escEmail, setEscEmail] = useState(d.escEmail ?? b.escalation_email ?? "");
  const [triggerPhrases, setTriggerPhrases] = useState<string[]>(d.triggerPhrases ?? b.escalation_trigger_phrases ?? []);
  const [phrase, setPhrase] = useState("");
  const [transcript, setTranscript] = useState(d.transcript ?? b.send_transcript_to_visitor ?? false);
  const [generating, setGenerating] = useState(false);

  useDraftAutosave(bot.id, "aiProfile", { prompt, tone, responseLength, onlyKB, companyName, agentRole, companyProfile, fallbackMessage, escEnabled, escEmail, triggerPhrases, transcript });

  const addPhrase = () => {
    const p = phrase.trim().toLowerCase();
    if (p && !triggerPhrases.includes(p)) setTriggerPhrases([...triggerPhrases, p]);
    setPhrase("");
  };

  const generate = async () => {
    if (!companyName.trim()) { toast.error("Company name is required"); return; }
    setGenerating(true);
    try {
      const { data } = await api.post(`/builder/chatbots/${bot.id}/generate-prompt`, {
        agent_name: bot.name, company_name: companyName.trim(), role: agentRole, company_description: companyProfile || "",
      });
      setPrompt(data.prompt || "");
      toast.success("Prompt generated — review and save");
    } catch (err) {
      toast.error(errorMessage(err, "Failed to generate prompt"));
    } finally {
      setGenerating(false);
    }
  };

  const submit = () => save({
    behavior: {
      ...bot.behavior,
      system_prompt: prompt,
      company_name: companyName.trim() || null,
      agent_role: agentRole,
      tone,
      response_length: responseLength,
      only_answer_from_kb: onlyKB,
      company_profile: companyProfile || null,
      fallback_message: fallbackMessage,
      escalation_enabled: escEnabled,
      escalation_email: escEmail || null,
      escalation_trigger_phrases: triggerPhrases,
      send_transcript_to_visitor: transcript,
    },
  });

  return (
    <div>
      <FormSection title="Business context" description="Tell the assistant who it works for. This powers prompt generation.">
        <div className="grid-2">
          <Field label="Company name" htmlFor="ai-company" hint="Required for prompt generation. Separate from the bot name."><Input id="ai-company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="IT Niche" /></Field>
          <Field label="Agent role" htmlFor="ai-role" hint="The primary job of this chatbot.">
            <Select id="ai-role" value={agentRole} onChange={(e) => setAgentRole(e.target.value)}>
              <option value="">Choose a role…</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              {agentRole && !ROLES.includes(agentRole) && <option value={agentRole}>{agentRole}</option>}
            </Select>
          </Field>
        </div>
        <Field label="Company details" optional htmlFor="ai-profile" hint="A short description of the business, products or services.">
          <Textarea id="ai-profile" rows={3} value={companyProfile} onChange={(e) => setCompanyProfile(e.target.value)} placeholder="We design websites, run digital marketing and build custom business software for growing companies." />
        </Field>
      </FormSection>

      <FormSection title="System prompt" description="Defines the bot's role, behaviour rules and conversation flow. Generate a starting point, then edit as needed.">
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
          <span className="text-xs muted">{prompt.length.toLocaleString()} characters</span>
          <Button variant="secondary" size="sm" icon={<Sparkles />} onClick={generate} loading={generating} disabled={!companyName.trim() || !agentRole}>{generating ? "Generating…" : "Generate prompt"}</Button>
        </div>
        <Textarea aria-label="System prompt" rows={10} className="mono" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </FormSection>

      <FormSection title="Voice & style" description="Layered on top of your system prompt.">
        <Field label="Tone">
          <div className="option-grid" role="group" aria-label="Tone">
            {TONES.map((t) => (
              <button key={t.id} type="button" className="option-card" aria-pressed={tone === t.id} onClick={() => setTone(t.id)}>
                <div className="option-card__title">{t.label}</div><div className="option-card__desc">{t.desc}</div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Response length">
          <div className="option-grid" role="group" aria-label="Response length" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {LENGTHS.map((t) => (
              <button key={t.id} type="button" className="option-card" aria-pressed={responseLength === t.id} onClick={() => setResponseLength(t.id)}>
                <div className="option-card__title">{t.label}</div><div className="option-card__desc">{t.desc}</div>
              </button>
            ))}
          </div>
        </Field>
      </FormSection>

      <FormSection title="Knowledge grounding" description="Control where answers come from.">
        <SwitchRow title="Only answer from knowledge base" description="The bot won't use general knowledge. Recommended for support and product bots; turn off for open-ended assistants." checked={onlyKB} onChange={setOnlyKB} />
        <Field label="Fallback message" htmlFor="ai-fallback" hint="Shown when the answer isn't in the knowledge base. Route visitors to a human or a help-centre URL.">
          <Textarea id="ai-fallback" rows={2} value={fallbackMessage} onChange={(e) => setFallbackMessage(e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="Hand-off to a human" description="Email your team whenever a visitor uses one of the trigger phrases.">
        <SwitchRow title="Enable escalation" checked={escEnabled} onChange={setEscEnabled} />
        {escEnabled && (
          <div className="stack anim-fade-up">
            <Field label="Escalation email" htmlFor="ai-esc" hint="Where to send the alert."><Input id="ai-esc" type="email" value={escEmail} onChange={(e) => setEscEmail(e.target.value)} placeholder="support@yourcompany.com" /></Field>
            <Field label="Trigger phrases" hint="Lowercase, partial match. Add common ways visitors ask for a human.">
              {triggerPhrases.length > 0 && (
                <div className="row-wrap" style={{ gap: 6, marginBottom: 4 }}>
                  {triggerPhrases.map((p) => <span key={p} className="chip">{p}<button type="button" aria-label={`Remove ${p}`} onClick={() => setTriggerPhrases(triggerPhrases.filter((x) => x !== p))}><X /></button></span>)}
                </div>
              )}
              <div className="row">
                <Input aria-label="New trigger phrase" value={phrase} onChange={(e) => setPhrase(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPhrase(); } }} placeholder="e.g. speak to support" />
                <Button variant="secondary" icon={<Plus />} onClick={addPhrase} disabled={!phrase.trim()}>Add</Button>
              </div>
            </Field>
          </div>
        )}
        <SwitchRow title="Email transcript to visitor" description="Adds an envelope button in the chat header so visitors can have the full conversation emailed to them." checked={transcript} onChange={setTranscript} />
      </FormSection>

      <SaveBar>
        <span className="save-bar__note"><CloudUpload />Unsaved edits are kept as a draft automatically.</span>
        <Button onClick={submit} loading={saving}>{saving ? "Saving…" : "Save AI profile"}</Button>
      </SaveBar>
    </div>
  );
}
