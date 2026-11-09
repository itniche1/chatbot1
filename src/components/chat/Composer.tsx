import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ArrowUp, Square, Mic, MicOff } from "lucide-react";
import { useSpeech } from "../../lib/useSpeech";

export type ComposerHandle = { focus: () => void; setValue: (v: string) => void };

type Props = {
  onSend: (text: string) => void;
  onStop?: () => void;
  busy?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  status?: string;
};

/**
 * Message composer: auto-growing textarea, Enter to send, Shift+Enter for a new line,
 * Esc to stop a streaming reply, optional voice input (Web Speech API).
 */
export const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { onSend, onStop, busy, disabled, placeholder = "Ask anything...", autoFocus, status }, ref,
) {
  const [value, setValue] = useState("");
  const ta = useRef<HTMLTextAreaElement>(null);
  const valueRef = useRef(value); valueRef.current = value;
  const speech = useSpeech(() => valueRef.current, setValue);

  useImperativeHandle(ref, () => ({ focus: () => ta.current?.focus(), setValue: (v) => { setValue(v); setTimeout(() => ta.current?.focus(), 0); } }), []);

  useEffect(() => {
    const el = ta.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  useEffect(() => { if (autoFocus && !disabled) ta.current?.focus(); }, [autoFocus, disabled]);

  const submit = () => {
    const text = value.trim();
    if (!text || busy || disabled) return;
    speech.stop();
    onSend(text);
    setValue("");
  };

  const statusText = speech.error || (speech.listening ? "Listening… speak now" : status);

  return (
    <div className={`composer ${disabled ? "is-disabled" : ""}`}>
      <label htmlFor="composer-input" className="sr-only">Message</label>
      <textarea
        id="composer-input"
        ref={ta}
        rows={1}
        value={value}
        disabled={disabled}
        placeholder={speech.listening ? "Listening…" : placeholder}
        onChange={(e) => { setValue(e.target.value); if (speech.error) speech.clearError(); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
          else if (e.key === "Escape" && busy) { e.preventDefault(); onStop?.(); }
        }}
      />
      {statusText && <div className={`composer__status ${speech.error ? "is-error" : ""}`} role="status">{statusText}</div>}
      <div className="composer__bar">
        {speech.supported && (
          <button
            type="button" className={`composer__tool ${speech.listening ? "is-active" : ""}`} onClick={speech.toggle} disabled={disabled || busy}
            aria-label={speech.listening ? "Stop voice input" : "Start voice input"} title={speech.listening ? "Stop voice input" : "Speak your message"}
          >
            {speech.listening ? <MicOff /> : <Mic />}
          </button>
        )}
        <span className="spacer" style={{ flex: 1 }} />
        <span className="composer__hint" aria-hidden><kbd>↵</kbd> send · <kbd>⇧</kbd><kbd>↵</kbd> new line</span>
        {busy ? (
          <button type="button" className="composer__send is-stop" onClick={onStop} aria-label="Stop generating" title="Stop generating (Esc)"><Square fill="currentColor" size={14} /></button>
        ) : (
          <button type="button" className="composer__send" onClick={submit} disabled={!value.trim() || disabled} aria-label="Send message" title="Send (Enter)"><ArrowUp /></button>
        )}
      </div>
    </div>
  );
});
