import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, ShieldCheck, Mic, Check, CheckCircle2, Clock, Lock, Download,
} from "lucide-react";
import { useApi } from "../../lib/useApi";
import { fmtNumber } from "../../lib/format";
import type { Plan } from "../../lib/types";
import { MarketingFooter, MarketingHeader } from "../../components/marketing/Chrome";
import { RobotMascot } from "../../components/marketing/RobotMascot";
import { HeroDemo } from "../../components/marketing/HeroDemo";
import { CreateScene, EngageScene, TeachScene } from "../../components/marketing/JourneyArt";
import { AnalyticsArt, BrandArt, HandoffArt, KnowledgeArt, LeadArt, VoiceArt } from "../../components/marketing/FeatureArt";

const FEATURES = [
  { art: KnowledgeArt, wide: true, kicker: "Knowledge", title: "Answers from your knowledge", desc: "Upload PDF, DOCX, TXT or CSV files — or crawl your website and sitemap. Replies are grounded in your own content." },
  { art: LeadArt, kicker: "Leads", title: "Lead capture, built in", desc: "Collect name, email and phone before the chat starts. Triage every lead with statuses, notes and full conversation history." },
  { art: BrandArt, kicker: "Branding", title: "Unmistakably on-brand", desc: "Your colours, logo, launcher, light or dark theme, position and size — so the assistant feels like part of your site." },
  { art: VoiceArt, kicker: "Control", title: "Your voice, your rules", desc: "Generate a system prompt, pick a tone and answer length, and keep answers strictly to your knowledge base." },
  { art: HandoffArt, kicker: "Hand-off", title: "Human hand-off", desc: "Email your team the moment a visitor asks for a person, and let visitors email themselves the transcript." },
  { art: AnalyticsArt, wide: true, kicker: "Analytics", title: "Analytics that matter", desc: "Follow the funnel from widget views to conversations to leads, with daily trends and AI cost tracking." },
];
const STEPS = [
  { n: "01", Art: CreateScene, title: "Create your assistant", desc: "Name it, set the tone and write a welcome message. Generate a system prompt from your company details — the decisions that shape every answer, made in minutes." },
  { n: "02", Art: TeachScene, title: "Teach it your business", desc: "Upload documents or crawl your website. Indexing starts immediately and runs in the background, so your assistant answers from your own content — not guesses." },
  { n: "03", Art: EngageScene, title: "Embed and engage", desc: "Copy one script tag, add your domain, and start turning visitors into conversations and qualified leads your team can follow up." },
];
const EXTRAS: [typeof ShieldCheck, string, string][] = [
  [ShieldCheck, "Allowed-domain protection", "Only your sites can load the widget"],
  [Mic, "Voice input", "Visitors can speak their questions"],
  [Download, "CSV & PDF exports", "Take conversations anywhere"],
  [CheckCircle2, "Proactive welcome prompts", "Start the conversation first"],
];
const FAQ = [
  { q: "Do I need to know how to code?", a: "No. You create and configure your chatbot in the workspace. Installing it means adding one embed script to your website; the steps depend on your website platform." },
  { q: "Can it match my brand?", a: "Yes. Customise your bot’s colours, welcome message, logo and tone. Light and dark widget themes are available; branding removal depends on your plan." },
  { q: "Where do the answers come from?", a: "From the documents and web pages you add to the knowledge base. You can require the bot to answer only from that knowledge, with a fallback message when it doesn’t know." },
  { q: "What happens to the leads?", a: "They land in your Lead inbox with their conversations, so your team can mark them contacted or qualified, add notes and follow up." },
];

export default function Landing() {
  const { data: plans } = useApi<Plan[]>("/plans");
  useEffect(() => { document.title = "IT Niche ChatBOT — AI-Powered Customer Engagement"; }, []);

  return (
    <div className="mk">
      <a href="#main" className="skip-link">Skip to content</a>
      <MarketingHeader>
        <a href="#features" className="mk-nav__link">Features</a>
        <a href="#how" className="mk-nav__link">How it works</a>
        <a href="#pricing" className="mk-nav__link">Pricing</a>
      </MarketingHeader>

      <main id="main">
        <section className="mk-hero">
          <HeroBackground />
          <div className="mk-container mk-hero__grid">
            <div className="anim-fade-up">
              <span className="mk-pill"><b>New</b>AI-Powered Customer Engagement</span>
              <h1>Your Business.<br /><em>Smarter</em> Conversations.</h1>
              <p className="mk-hero__lead">Meet IT Niche ChatBOT — an intelligent AI assistant designed to help businesses engage customers, answer questions, and turn conversations into opportunities.</p>
              <div className="mk-hero__cta">
                <Link to="/register" className="btn btn--primary btn--lg">Start your free trial<ArrowRight /></Link>
                <a href="#how" className="btn btn--secondary btn--lg">See how it works</a>
              </div>
              <div className="mk-hero__trust">
                <span><Clock />Live in minutes</span>
                <span><Lock />Domain-restricted embeds</span>
                <span><Mic />Voice input</span>
              </div>
            </div>
            <HeroDemo />
          </div>
        </section>

        <section id="features" className="mk-section mk-section--tint mk-features-section">
          <div className="mk-container">
            <div className="mk-head mk-head--center">
              <div className="eyebrow">Everything you need</div>
              <h2 style={{ marginTop: 12 }}>Every conversation creates an <em>opportunity.</em></h2>
              <p>From the first “hello” to a qualified lead, ChatBOT gives your website a knowledgeable, always-on assistant — and gives your team the tools to follow up.</p>
            </div>
            <InView className="mk-bento">
              {FEATURES.map(({ art: Art, wide, kicker, title, desc }, i) => (
                <article key={title} className={`mk-bento__card ${wide ? "is-wide" : ""}`} style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="mk-bento__art"><Art /></div>
                  <div className="mk-bento__text">
                    <span className="mk-bento__kicker">{kicker}</span>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </article>
              ))}
              <article className="mk-bento__card mk-bento__card--extras">
                <div className="mk-bento__text">
                  <span className="mk-bento__kicker">And more</span>
                  <h3>Built for real websites</h3>
                </div>
                <ul className="mk-extras">
                  {EXTRAS.map(([Icon, t, d]) => (
                    <li key={t}><span className="mk-extras__icon"><Icon /></span><span><strong>{t}</strong><small>{d}</small></span></li>
                  ))}
                </ul>
              </article>
            </InView>
          </div>
        </section>

        <section id="how" className="mk-section mk-section--dark">
          <div className="mk-container">
            <div className="mk-head">
              <div className="eyebrow">How it works</div>
              <h2 style={{ marginTop: 10 }}>From sign-up to live in three steps.</h2>
              <p>No developers required. If you can paste a line of code into your site, you can launch.</p>
            </div>
            <InView className="mk-journey" item=".mk-journey__row">
              {STEPS.map(({ n, title, desc, Art }, i) => (
                <div key={n} className={`mk-journey__row ${i % 2 ? "is-flipped" : ""}`} style={{ ["--step" as string]: `var(--step-${i + 1})` }}>
                  <div className="mk-journey__art"><Art /></div>
                  <div className="mk-journey__text">
                    <span className="mk-journey__num">{n}</span>
                    <h3>{title}.</h3>
                    <p>{desc}</p>
                  </div>
                </div>
              ))}
            </InView>
            <div className="mk-journey__code">
              <pre className="mk-code"><code><span className="t">&lt;script</span> src=<span className="s">"…/widget.js"</span> data-chatbot-id=<span className="s">"your-bot"</span> defer<span className="t">&gt;&lt;/script&gt;</span></code></pre>
            </div>
          </div>
        </section>

        <section id="pricing" className="mk-section">
          <div className="mk-container">
            <div className="mk-head">
              <div className="eyebrow">Pricing</div>
              <h2 style={{ marginTop: 10 }}>Start free. Grow when you’re ready.</h2>
              <p>Every plan includes the AI assistant, knowledge base, lead capture and analytics.</p>
            </div>
            <div className="plans">
              {(plans || []).filter((p) => p.is_public !== false).map((p) => (
                <div key={p.id} className={`card plan ${p.slug === "pro" ? "is-current" : ""}`}>
                  <div className="row" style={{ justifyContent: "space-between" }}><h3>{p.name}</h3>{p.slug === "pro" && <span className="badge badge--brand badge--plain">Popular</span>}</div>
                  <div className="plan__price">${p.price_monthly}{p.price_monthly > 0 && <span>/mo</span>}</div>
                  <div className="text-xs muted">{p.is_trial ? `${p.trial_days}-day free trial` : "Billed monthly"}</div>
                  <ul className="plan__features">
                    <li><Check />{fmtNumber(p.features.max_chatbots)} chatbot{p.features.max_chatbots === 1 ? "" : "s"}</li>
                    <li><Check />{fmtNumber(p.features.max_messages)} messages</li>
                    <li><Check />{p.features.max_kb_files} knowledge files</li>
                    <li><Check />{p.features.max_domains} domain{p.features.max_domains === 1 ? "" : "s"}</li>
                    {p.features.can_use_crawler && <li><Check />Website crawler</li>}
                    {p.features.can_export_chats && <li><Check />Export chats</li>}
                    {p.features.can_remove_branding && <li><Check />Remove branding</li>}
                  </ul>
                  <Link to="/register" className={`btn btn--block ${p.slug === "pro" ? "btn--primary" : "btn--secondary"}`}>{p.is_trial ? "Start free trial" : "Get started"}</Link>
                </div>
              ))}
              {!plans && [0, 1, 2, 3].map((i) => <span key={i} className="skeleton skeleton--block" style={{ height: 380 }} />)}
            </div>
          </div>
        </section>

        <section className="mk-section mk-section--tint">
          <div className="mk-container">
            <div className="mk-head"><div className="eyebrow">Questions</div><h2 style={{ marginTop: 10 }}>Frequently asked</h2></div>
            <FaqList items={FAQ} />
          </div>
        </section>

        <section className="mk-section">
          <div className="mk-container">
            <div className="mk-cta">
              <div className="mk-cta__bot" aria-hidden><RobotMascot size={168} /></div>
              <div className="mk-cta__copy"><h2>Every Conversation Creates an Opportunity.</h2><p>Launch your IT Niche ChatBOT today — your free trial starts the moment you sign up.</p></div>
              <Link to="/register" className="btn btn--primary btn--lg">Create your assistant<ArrowRight /></Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

/** Layered hero background: warm brand glow, masked grid, drifting orbs and itniche-style markers. */
function HeroBackground() {
  return (
    <div className="mk-hero__bg" aria-hidden>
      <span className="mk-orb mk-orb--1" />
      <span className="mk-orb mk-orb--2" />
      <svg className="mk-hero__deco" viewBox="0 0 1200 640" preserveAspectRatio="xMidYMid slice">
        <circle cx="90" cy="520" r="46" className="mk-deco-ring" />
        <circle cx="1120" cy="110" r="70" className="mk-deco-ring mk-deco-ring--spin" />
        <path d="M560 600 C 640 520, 700 560, 760 470 S 900 380, 1010 420" className="mk-deco-path" />
        {[[620, 96], [1060, 560], [180, 120], [520, 470]].map(([x, y], i) => (
          <path key={i} d={`M${x - 7} ${y} h14 M${x} ${y - 7} v14`} className="mk-deco-plus" style={{ animationDelay: `${i * 0.8}s` }} />
        ))}
        {[[1010, 420], [760, 470]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" className="mk-deco-node" />)}
      </svg>
    </div>
  );
}

/** Adds `is-inview` once the element scrolls into view (starts the feature animations). */
function InView({ className, children, item = ".mk-bento__card" }: { className: string; children: React.ReactNode; item?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") { el.querySelectorAll(item).forEach((c) => c.classList.add("is-inview", "is-revealed")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        e.target.classList.toggle("is-inview", e.isIntersecting); // runs the scene animations
        if (e.isIntersecting) e.target.classList.add("is-revealed"); // one-time entrance
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.15 });
    el.querySelectorAll(item).forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [item]);
  return <div ref={ref} className={className}>{children}</div>;
}

/** Animated FAQ accordion: one answer open at a time; answers slide open/closed (native <details> can't animate). */
function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const base = useId();
  const toggle = (i: number) => setOpen((prev) => (prev === i ? null : i)); // opening one closes the other
  return (
    <div className="mk-faq">
      {items.map((f, i) => {
        const isOpen = open === i;
        const btn = `${base}-q${i}`, panel = `${base}-a${i}`;
        return (
          <div key={f.q} className={`mk-faq__item ${isOpen ? "is-open" : ""}`}>
            <h3 className="mk-faq__q">
              <button type="button" id={btn} aria-expanded={isOpen} aria-controls={panel} onClick={() => toggle(i)}>
                <span>{f.q}</span>
                <span className="mk-faq__icon" aria-hidden />
              </button>
            </h3>
            <div id={panel} role="region" aria-labelledby={btn} className="mk-faq__panel" inert={!isOpen}>
              <div className="mk-faq__inner"><p>{f.a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
