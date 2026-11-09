import { memo, useMemo, type MouseEvent } from "react";
import { Marked, type Tokens } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import php from "highlight.js/lib/languages/php";
import sql from "highlight.js/lib/languages/sql";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("php", php);
hljs.registerLanguage("sql", sql);
const ALIASES: Record<string, string> = { js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", py: "python", sh: "bash", shell: "bash", zsh: "bash", html: "xml", svg: "xml" };

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const marked = new Marked({
  gfm: true,
  breaks: true,
  renderer: {
    code({ text, lang }: Tokens.Code) {
      const requested = (lang || "").trim().split(/\s+/)[0].toLowerCase();
      const language = ALIASES[requested] || requested;
      let html: string;
      try {
        html = language && hljs.getLanguage(language)
          ? hljs.highlight(text, { language }).value
          : hljs.highlightAuto(text).value;
      } catch {
        html = escapeHtml(text);
      }
      const label = escapeHtml(requested || "code");
      return `<div class="md-code"><div class="md-code__bar"><span>${label}</span><button type="button" class="md-code__copy" data-copy-code>Copy</button></div><pre><code class="hljs">${html}</code></pre></div>`;
    },
    link({ href, title, text }: Tokens.Link) {
      const t = title ? ` title="${escapeHtml(title)}"` : "";
      return `<a href="${escapeHtml(href || "")}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
  },
});

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") { node.setAttribute("target", "_blank"); node.setAttribute("rel", "noopener noreferrer"); }
});

export function renderMarkdown(src: string): string {
  const raw = marked.parse(String(src || ""), { async: false }) as string;
  return DOMPurify.sanitize(raw, { ADD_ATTR: ["target", "data-copy-code"] });
}

function onClick(e: MouseEvent<HTMLDivElement>) {
  const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-copy-code]");
  if (!btn) return;
  const code = btn.closest(".md-code")?.querySelector("code")?.textContent || "";
  navigator.clipboard?.writeText(code).then(() => {
    btn.textContent = "Copied";
    setTimeout(() => { btn.textContent = "Copy"; }, 1500);
  }).catch(() => {});
}

export const Markdown = memo(function Markdown({ content, className = "" }: { content: string; className?: string }) {
  const html = useMemo(() => renderMarkdown(content), [content]);
  if (!content) return null;
  return <div className={`md ${className}`} onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
});
