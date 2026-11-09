import { useState } from "react";
import { CloudUpload } from "lucide-react";
import { readDraft, useDraftAutosave } from "../../../lib/drafts";
import { Button, Field, Input, SwitchRow, Textarea } from "../../../components/ui";
import { FormSection, SaveBar } from "./FormSection";
import type { TabProps } from "./ChatbotDetail";

type GeneralDraft = { name?: string; welcome?: string; starters?: string; proactive?: string; requireLead?: boolean; tagline?: string };

export default function GeneralTab({ bot, save, saving }: TabProps) {
  const d = (readDraft(bot.id)?.general || {}) as GeneralDraft;
  const b = bot.behavior || {};
  const [name, setName] = useState(d.name ?? bot.name);
  const [welcome, setWelcome] = useState(d.welcome ?? b.welcome_message ?? "");
  const [starters, setStarters] = useState(d.starters ?? (b.starter_questions || []).join("\n"));
  const [proactive, setProactive] = useState(d.proactive ?? b.proactive_message ?? "");
  const [requireLead, setRequireLead] = useState(d.requireLead ?? b.require_lead ?? true);
  const [tagline, setTagline] = useState(d.tagline ?? b.tagline ?? "");

  useDraftAutosave(bot.id, "general", { name, welcome, starters, proactive, requireLead, tagline });
  const starterCount = starters.split("\n").map((s) => s.trim()).filter(Boolean).length;

  const submit = () => save({
    name,
    behavior: {
      ...bot.behavior,
      welcome_message: welcome,
      starter_questions: starters.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 6),
      proactive_message: proactive || null,
      require_lead: requireLead,
      tagline: tagline || null,
    },
  });

  return (
    <div>
      <FormSection title="Identity" description="How your assistant introduces itself to visitors.">
        <Field label="Bot name" htmlFor="g-name"><Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Header tagline" optional htmlFor="g-tagline" hint="Shown below the bot name in the chat header. Defaults to “Online · usually replies instantly”.">
          <Input id="g-tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="We typically reply within minutes" />
        </Field>
        <Field label="Welcome message" htmlFor="g-welcome" hint="The first message visitors see when they open the chat.">
          <Textarea id="g-welcome" rows={2} value={welcome} onChange={(e) => setWelcome(e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="Conversation starters" description="Quick replies that help visitors start the conversation.">
        <Field label={`Starter questions (${Math.min(starterCount, 6)}/6)`} htmlFor="g-starters" hint="One per line. Up to 6 are shown." error={starterCount > 6 ? "Only the first 6 questions will be shown." : undefined}>
          <Textarea id="g-starters" rows={5} value={starters} onChange={(e) => setStarters(e.target.value)} placeholder={"What services do you offer?\nHow much does a website cost?"} />
        </Field>
        <Field label="Proactive popup message" optional htmlFor="g-proactive" hint="Shown next to the launcher after a few seconds to invite interaction. Leave empty to disable.">
          <Input id="g-proactive" value={proactive} onChange={(e) => setProactive(e.target.value)} placeholder="👋 Have a question? I can help." />
        </Field>
      </FormSection>

      <FormSection title="Lead capture" description="Turn conversations into opportunities.">
        <SwitchRow title="Capture leads before chat" description="Ask for name and email (phone optional) before the conversation starts. Returning visitors can pick up past conversations. Recommended." checked={requireLead} onChange={setRequireLead} />
      </FormSection>

      <SaveBar>
        <span className="save-bar__note"><CloudUpload />Unsaved edits are kept as a draft automatically.</span>
        <Button onClick={submit} loading={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </SaveBar>
    </div>
  );
}
