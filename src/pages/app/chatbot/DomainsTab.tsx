import { useState } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import { useWorkspace } from "../../../lib/workspace";
import { Button, Field, Textarea } from "../../../components/ui";
import { FormSection } from "./FormSection";
import type { TabProps } from "./ChatbotDetail";

export default function DomainsTab({ bot, save, saving }: TabProps) {
  const { features } = useWorkspace();
  const [value, setValue] = useState((bot.allowed_domains || []).join("\n"));
  const domains = value.split("\n").map((s) => s.trim()).filter(Boolean);
  const max = features?.features?.max_domains;

  return (
    <FormSection
      title={<span className="row" style={{ gap: 8 }}><ShieldCheck size={16} className="text-brand" />Allowed domains</span>}
      description="Only these websites can load your chatbot. This protects your quota from being used by copied embed codes."
      footer={<Button onClick={() => save({ allowed_domains: domains })} loading={saving}>{saving ? "Saving…" : "Save domains"}</Button>}
    >
      <Field label={`Domains${max ? ` (${domains.length}/${max} on your plan)` : ""}`} htmlFor="domains" hint="One per line. Use *.example.com for subdomains.">
        <Textarea id="domains" className="mono" rows={7} value={value} onChange={(e) => setValue(e.target.value)} placeholder={"example.com\n*.app.example.com"} />
      </Field>
      {domains.length === 0 && <div className="callout callout--brand"><AlertTriangle /><div><strong>Any website can currently load this chatbot.</strong> Add your domain(s) to restrict it — recommended.</div></div>}
    </FormSection>
  );
}
