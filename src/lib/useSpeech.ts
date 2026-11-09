import { useEffect, useRef, useState } from "react";

/* Voice input via the browser's Web Speech API — same approach as the previous widget. */
type SR = {
  continuous: boolean; interimResults: boolean; lang: string;
  start: () => void; stop: () => void;
  onstart: (() => void) | null; onend: (() => void) | null;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

export function useSpeech(getText: () => string, setText: (v: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState("");
  const rec = useRef<SR | null>(null);
  const base = useRef("");
  const getRef = useRef(getText); getRef.current = getText;
  const setRef = useRef(setText); setRef.current = setText;

  useEffect(() => {
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: new () => SR }).webkitSpeechRecognition;
    setSupported(!!Ctor);
    if (!Ctor) return;
    const r = new Ctor();
    r.continuous = false;
    r.interimResults = true;
    r.lang = navigator.language || "en-US";
    r.onstart = () => { setListening(true); setError(""); base.current = getRef.current().trim(); };
    r.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) t += e.results[i][0]?.transcript || "";
      if (t.trim()) setRef.current(`${base.current ? `${base.current} ` : ""}${t.trim()}`);
    };
    r.onerror = (e) => {
      setError(
        e.error === "not-allowed" ? "Microphone is blocked for this site. Allow microphone access in your browser settings, then try again."
          : e.error === "audio-capture" ? "No microphone was found. Check your device input settings."
            : e.error === "network" ? "Voice input needs a working network connection. Try again."
              : "Could not hear clearly. Try again.",
      );
      setListening(false);
    };
    r.onend = () => setListening(false);
    rec.current = r;
    return () => { rec.current = null; try { r.stop(); } catch { /* ignore */ } };
  }, []);

  const toggle = () => {
    const r = rec.current;
    if (!r) return;
    setError("");
    if (listening) { try { r.stop(); } catch { /* ignore */ } setListening(false); }
    else { try { r.start(); } catch { setError("Voice input is already starting."); } }
  };
  const stop = () => { if (listening) { try { rec.current?.stop(); } catch { /* ignore */ } setListening(false); } };
  return { supported, listening, error, toggle, stop, clearError: () => setError("") };
}
