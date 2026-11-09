/**
 * Reads the backend's Server-Sent Events stream used by /widget/chat and /builder/preview-chat.
 * Format (unchanged): events separated by a blank line, each with a `data: {"content": "..."}` line.
 */
export async function streamChat(
  url: string,
  body: unknown,
  opts: { headers?: Record<string, string>; signal?: AbortSignal; onToken: (text: string) => void },
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: JSON.stringify(body),
    signal: opts.signal,
  });
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json())?.detail; } catch { /* not json */ }
    throw new Error(typeof detail === "string" && detail ? detail : `Request failed (${res.status})`);
  }
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";
    for (const evt of events) {
      const line = evt.split("\n").find((l) => l.startsWith("data:"));
      if (!line) continue;
      try {
        const payload = JSON.parse(line.slice(5).trim());
        if (payload?.content) opts.onToken(payload.content);
      } catch { /* ignore keep-alives / malformed chunks */ }
    }
  }
}
