import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Database, FileText, Send, ShieldCheck } from "lucide-react";
import { RobotMascot } from "./RobotMascot";

/**
 * Interactive hero demo: pick an example and watch the assistant answer it.
 * Plays a scripted conversation (question → typing → streamed answer → source tag),
 * auto-cycles through the examples while on screen until the visitor interacts.
 * Purely illustrative: no API calls.
 */
type Scenario = { chip: string; question: string; answer: string; source: string };

const SCENARIOS: Scenario[] = [
  {
    chip: "Training your bot",
    question: "What can I train my chatbot on?",
    answer: "Give your chatbot the knowledge you already have. Upload PDF, DOCX, TXT, or CSV files — or crawl your website — and it uses that content to answer your visitors’ questions.",
    source: "Knowledge base · Supported files",
  },
  {
    chip: "Capturing leads",
    question: "How does it capture leads?",
    answer: "Turn on the pre-chat form to collect name, email and phone before the conversation starts. Every lead lands in your Leads inbox with the full transcript, a status and notes.",
    source: "Leads · Pre-chat form",
  },
  {
    chip: "Website setup",
    question: "How do I add it to my website?",
    answer: "Copy one script tag from Integrations and paste it before </body>. Add your domain to the allow-list and the chat launcher appears — on WordPress, Shopify, Webflow or custom HTML.",
    source: "Integrations · Embed script",
  },
];

type Phase = "asking" | "typing" | "streaming" | "done";
const AUTOPLAY_MS = 7000;

const reducedMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function HeroDemo() {
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<Phase>("done");
  const [chars, setChars] = useState(SCENARIOS[0].answer.length);
  const [autoplay, setAutoplay] = useState(true);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => { timers.current.forEach((t) => clearTimeout(t)); timers.current = []; };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  const play = useCallback((i: number) => {
    clearTimers();
    setActive(i);
    const full = SCENARIOS[i].answer.length;
    if (reducedMotion()) { setPhase("done"); setChars(full); return; }
    setChars(0);
    setPhase("asking");
    later(() => setPhase("typing"), 450);
    later(() => {
      setPhase("streaming");
      let n = 0;
      const step = () => {
        n = Math.min(full, n + 3);
        setChars(n);
        if (n < full) later(step, 22);
        else setPhase("done");
      };
      step();
    }, 1350);
  }, []);

  useEffect(() => clearTimers, []);

  // Only autoplay while the demo is visible.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!autoplay || !inView || phase !== "done" || reducedMotion()) return;
    const t = window.setTimeout(() => play((active + 1) % SCENARIOS.length), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [autoplay, inView, phase, active, play]);

  const choose = (i: number) => { setAutoplay(false); play(i); };
  const s = SCENARIOS[active];
  const showAnswer = phase === "streaming" || phase === "done";

  return (
    <div className="hd" ref={rootRef}>
      <svg className="hd__orbits" viewBox="0 0 600 600" aria-hidden>
        <ellipse cx="300" cy="300" rx="270" ry="210" />
        <ellipse cx="300" cy="300" rx="230" ry="260" className="hd__orbit--b" />
      </svg>

      <div className="hd__float hd__float--top" aria-hidden>
        <span className="hd__float-icon"><Database /></span>
        <span><strong>Your knowledge, connected</strong><small>Docs become helpful answers</small></span>
      </div>

      <div className="hd__card">
        <div className="hd__head">
          <span className="hd__avatar"><RobotMascot size={40} className="bot--still" /></span>
          <span className="hd__title"><strong>Your business assistant</strong><small><i />Here to help</small></span>
          <span className="hd__pill">Demo</span>
        </div>

        <div className="hd__thread" aria-live="polite">
          <div className="hd__msg hd__msg--bot">Hi there! I’m your AI assistant. What would you like to know?</div>
          <div key={`q-${active}`} className="hd__msg hd__msg--user">{s.question}</div>
          {phase === "typing" && <div className="hd__msg hd__msg--bot hd__msg--typing" aria-label="Assistant is typing"><span className="typing"><span /><span /><span /></span></div>}
          {showAnswer && (
            <div key={`a-${active}`} className="hd__msg hd__msg--bot hd__msg--answer">
              <p>{s.answer.slice(0, chars)}{phase === "streaming" && <span className="hd__caret" aria-hidden />}</p>
              {phase === "done" && <div className="hd__source"><FileText />{s.source}</div>}
            </div>
          )}
        </div>

        <div className="hd__explore">
          <div className="hd__label">Explore an example</div>
          <div className="hd__chips" role="group" aria-label="Example questions">
            {SCENARIOS.map((sc, i) => (
              <button key={sc.chip} type="button" className="hd__chip" aria-pressed={i === active} onClick={() => choose(i)}>
                {sc.chip}<ArrowRight />
              </button>
            ))}
          </div>
        </div>

        <div className="hd__input">
          <span>Choose a question above</span>
          <button type="button" aria-label="Next example" onClick={() => choose((active + 1) % SCENARIOS.length)}><Send /></button>
        </div>
        <div className="hd__foot">Illustrative preview · Powered by your knowledge</div>
      </div>

      <div className="hd__float hd__float--bottom" aria-hidden>
        <span className="hd__float-icon hd__float-icon--ink"><ShieldCheck /></span>
        <span><strong>Grounded in your content</strong><small>A smarter place to start</small></span>
      </div>

      <div className="hd__mascot" aria-hidden>
        <RobotMascot size={104} />
        <span>Meet your next team member.</span>
      </div>
    </div>
  );
}
