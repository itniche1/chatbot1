import { ExternalLink, KeyRound, Code2, MonitorSmartphone } from "lucide-react";
import { API_BASE, api, errorMessage } from "../../../lib/api";
import type { Chatbot } from "../../../lib/types";
import { Button, CodeBlock } from "../../../components/ui";
import { useToast } from "../../../components/ui/toast";
import { FormSection } from "./FormSection";

/** Absolute API origin for snippets: same-origin builds use the current host. */
export function apiOrigin() {
  return API_BASE.startsWith("http") ? API_BASE : `${window.location.origin}${API_BASE}`;
}
export function embedSnippet(bot: Chatbot) {
  return `<script src="${apiOrigin()}/widget.js" data-chatbot-id="${bot.public_id}" defer></script>`;
}

export function EmbedPanel({ bot, compact = false }: { bot: Chatbot; compact?: boolean }) {
  const toast = useToast();
  const testUrl = `${apiOrigin().replace(/\/api$/, "")}/widget/${bot.public_id}`;

  const rotate = async () => {
    if (!window.confirm("Rotate the public widget key? Existing embeds stop working until you update the snippet on your site.")) return;
    try {
      await api.post(`/chatbots/${bot.id}/regenerate-key`);
      toast.success("Key rotated — copy the new snippet");
      window.location.reload();
    } catch (err) { toast.error(errorMessage(err)); }
  };

  return (
    <div>
      <FormSection title={<span className="row" style={{ gap: 8 }}><Code2 size={16} className="text-brand" />Website embed</span>} description="Paste this into your site's HTML, ideally just before </body>. Works with any website builder that lets you add custom code.">
        <CodeBlock label="embed.html" code={embedSnippet(bot)} />
        <ol className="steps">
          <li>Copy the snippet above.</li>
          <li>Paste it before the closing <code>&lt;/body&gt;</code> tag on every page where the chat should appear.</li>
          <li>Add your domain under <strong>Domains</strong> so only your site can load the chatbot.</li>
        </ol>
      </FormSection>
      {!compact && (
        <>
          <FormSection title={<span className="row" style={{ gap: 8 }}><MonitorSmartphone size={16} className="text-brand" />Test page</span>} description="Open your chatbot in a standalone window to try it exactly as visitors will.">
            <div><a href={testUrl} target="_blank" rel="noreferrer" className="btn btn--secondary"><ExternalLink />Open test page</a></div>
          </FormSection>
          <FormSection title={<span className="row" style={{ gap: 8 }}><KeyRound size={16} className="text-danger" />Rotate widget key</span>} description="If your embed snippet has leaked or is being abused, generate a new public ID. Old embeds stop working.">
            <div><Button variant="danger" onClick={rotate}>Rotate public key</Button></div>
          </FormSection>
        </>
      )}
    </div>
  );
}
