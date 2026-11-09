import { Link } from "react-router-dom";
import { Mail, BookOpen, Code2, Brain, ShieldCheck, FileText, Scale, ArrowUpRight, Keyboard } from "lucide-react";
import { Card, PageHeader } from "../../components/ui";

const GUIDES = [
  { icon: Brain, title: "Shape your assistant's voice", desc: "Generate a system prompt, pick a tone and choose how long answers should be.", to: "/app/chatbots" },
  { icon: BookOpen, title: "Teach it your business", desc: "Upload documents or crawl your website so answers come from your content.", to: "/app/knowledge" },
  { icon: Code2, title: "Install on your website", desc: "Copy one script tag and paste it before </body>.", to: "/app/integrations" },
  { icon: ShieldCheck, title: "Lock it to your domains", desc: "Stop copied embed codes from using your quota.", to: "/app/integrations" },
];
const FAQ = [
  { q: "Where do the Assistant's answers come from?", a: "The Assistant talks to the chatbot you pick, using its AI profile and knowledge base. Test-mode chats don't use your message quota and don't create leads." },
  { q: "Why does my bot say it doesn't know something?", a: "If “Only answer from knowledge base” is on, the bot only uses your uploaded content. Add the missing information to the knowledge base, or adjust the fallback message." },
  { q: "How do I capture leads?", a: "Turn on “Capture leads before chat” in the chatbot's General settings. Visitors share their name and email before chatting, and appear under Leads." },
  { q: "Can I change my plan?", a: "Plan changes are currently handled by our team. Email support@itniche.com and we'll take care of it." },
];
const SHORTCUTS = [["Ctrl/⌘ + K", "Search conversations"], ["Ctrl/⌘ + Shift + O", "New conversation"], ["Ctrl/⌘ + B", "Collapse sidebar"], ["Enter", "Send message"], ["Shift + Enter", "New line"], ["Esc", "Stop generating"]];

export default function Help() {
  return (
    <div className="page">
      <PageHeader eyebrow="Help & support" title="How can we help?" description="Guides, answers and a direct line to the IT Niche team." />
      <div className="help-hero card">
        <div>
          <h2>Talk to a real person</h2>
          <p>Our team replies to every message. Include your account email and the chatbot name so we can help quickly.</p>
        </div>
        <a href="mailto:support@itniche.com?subject=ChatBOT%20support" className="btn btn--primary"><Mail />support@itniche.com</a>
      </div>

      <div className="section-title" style={{ marginTop: "var(--sp-8)" }}><div><h2>Getting started</h2></div></div>
      <div className="grid-2" style={{ marginBottom: "var(--sp-8)" }}>
        {GUIDES.map(({ icon: Icon, title, desc, to }) => (
          <Link key={title} to={to} className="card card--hover card--pad row" style={{ alignItems: "flex-start", gap: 14 }}>
            <span className="stat__icon" style={{ width: 40, height: 40 }}><Icon /></span>
            <div style={{ flex: 1 }}><h3>{title}</h3><p className="text-sm muted" style={{ marginTop: 4 }}>{desc}</p></div>
            <ArrowUpRight size={18} className="subtle" />
          </Link>
        ))}
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)", alignItems: "start" }}>
        <Card>
          <div className="card__header"><h3>Frequently asked questions</h3></div>
          <div className="faq">
            {FAQ.map((f) => <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}
          </div>
        </Card>
        <div className="stack">
          <Card>
            <div className="card__header"><h3 className="row" style={{ gap: 8 }}><Keyboard size={16} className="text-brand" />Keyboard shortcuts</h3></div>
            <div className="list">{SHORTCUTS.map(([k, d]) => <div key={k} className="list-item" style={{ justifyContent: "space-between", padding: "10px 20px" }}><span className="text-sm">{d}</span><kbd style={{ width: "auto" }}>{k}</kbd></div>)}</div>
          </Card>
          <Card>
            <div className="list">
              <Link to="/privacy-policy" className="list-item"><FileText size={16} className="text-brand" /><span className="list-item__body list-item__title">Privacy Policy</span><ArrowUpRight size={16} className="subtle" /></Link>
              <Link to="/terms-of-use" className="list-item"><Scale size={16} className="text-brand" /><span className="list-item__body list-item__title">Terms of Use</span><ArrowUpRight size={16} className="subtle" /></Link>
              <a href="https://www.itniche.com/" target="_blank" rel="noreferrer" className="list-item"><ArrowUpRight size={16} className="text-brand" /><span className="list-item__body list-item__title">itniche.com</span><ArrowUpRight size={16} className="subtle" /></a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
