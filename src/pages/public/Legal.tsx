import { useEffect } from "react";
import legal from "../../data/legal.json";
import { MarketingFooter, MarketingHeader } from "../../components/marketing/Chrome";

type Section = { id: string; title: string; paragraphs?: string[]; bullets?: string[]; links?: { label: string; href: string }[] };

/** Legal copy is carried over verbatim from the previous build (src/data/legal.json). */
export default function Legal({ type }: { type: "privacy" | "terms" }) {
  const isPrivacy = type === "privacy";
  const title = isPrivacy ? "Privacy Policy" : "Terms of Use";
  const sections = (isPrivacy ? legal.privacy : legal.terms) as Section[];

  useEffect(() => {
    const prev = document.title;
    document.title = `${title} | IT Niche ChatBOT`;
    window.scrollTo(0, 0);
    return () => { document.title = prev; };
  }, [title]);

  return (
    <div className="mk">
      <a href="#legal-main" className="skip-link">Skip to content</a>
      <MarketingHeader />
      <main id="legal-main" className="legal">
        <div className="mk-container legal__grid">
          <nav className="legal__toc" aria-label="On this page">
            <div className="eyebrow" style={{ padding: "0 12px 10px" }}>On this page</div>
            {sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
          </nav>
          <article className="legal__body">
            <div className="eyebrow">Legal</div>
            <h1 style={{ marginTop: 10 }}>{title}</h1>
            <p style={{ marginTop: 14, fontSize: "var(--fs-md)" }}>{isPrivacy ? "How information moves through Chatbase, and the choices available to you." : "The terms for using Chatbase responsibly and managing your account."}</p>
            <p className="text-sm subtle" style={{ marginTop: 8 }}>Last updated {legal.updated} · {legal.company}</p>
            {sections.map((s) => (
              <section key={s.id} id={s.id}>
                <h2>{s.title}</h2>
                {s.paragraphs?.map((p, i) => <p key={i}>{p}</p>)}
                {s.bullets && <ul>{s.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
                {s.links && <p>{s.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="link">{l.label}</a>)}</p>}
              </section>
            ))}
            <p style={{ marginTop: 48 }} className="text-sm muted">Questions? Email <a href={`mailto:${legal.email}`} className="link">{legal.email}</a>.</p>
          </article>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
