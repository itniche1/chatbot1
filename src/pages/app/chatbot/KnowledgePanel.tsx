import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, Globe, FileText, Trash2, CheckCircle2, AlertTriangle, Loader2, SlidersHorizontal, Lock } from "lucide-react";
import { api, errorMessage } from "../../../lib/api";
import { fmtBytes } from "../../../lib/format";
import { useWorkspace } from "../../../lib/workspace";
import type { Chatbot, KbSettings } from "../../../lib/types";
import { Button, Card, CardHeader, EmptyState, Field, Input, IconButton } from "../../../components/ui";
import { useToast } from "../../../components/ui/toast";
import { FormSection } from "./FormSection";

type KbFile = { id: string; filename: string; size_bytes: number; chunk_count?: number; status: string; error?: string };
type CrawlJob = { id: string; url: string; status: string; error?: string; indexed_pages?: number; page_count?: number; page_limit?: number; chunk_count?: number };

const ACCEPT = ".pdf,.docx,.txt,.csv";

export function KnowledgePanel({ chatbotId }: { chatbotId: string }) {
  const toast = useToast();
  const { features } = useWorkspace();
  const [files, setFiles] = useState<KbFile[] | null>(null);
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [bot, setBot] = useState<Chatbot | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [url, setUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const [f, j] = await Promise.all([api.get(`/chatbots/${chatbotId}/kb/files`), api.get(`/chatbots/${chatbotId}/kb/crawl-jobs`)]);
      setFiles(f.data); setJobs(j.data);
    } catch { setFiles((prev) => prev ?? []); }
  }, [chatbotId]);

  // Same 3s polling as before so indexing progress updates live.
  useEffect(() => { refresh(); const t = setInterval(refresh, 3000); return () => clearInterval(t); }, [refresh]);
  useEffect(() => { api.get(`/chatbots/${chatbotId}`).then((r) => setBot(r.data)).catch(() => {}); }, [chatbotId]);

  const upload = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    try {
      await api.post(`/chatbots/${chatbotId}/kb/files`, form, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Uploaded — indexing started");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const crawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setCrawling(true);
    try {
      await api.post(`/chatbots/${chatbotId}/kb/crawl`, { url: url.trim() });
      setUrl("");
      toast.success("Crawl queued");
      refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCrawling(false);
    }
  };

  const removeFile = async (f: KbFile) => {
    if (!window.confirm(`Remove “${f.filename}” from the knowledge base?`)) return;
    try { await api.delete(`/chatbots/${chatbotId}/kb/files/${f.id}`); toast.success("Removed"); refresh(); }
    catch (err) { toast.error(errorMessage(err)); }
  };

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); };
  const maxSize = features?.features?.max_kb_size_bytes;
  const maxFiles = features?.features?.max_kb_files;
  const canCrawl = features ? features.features?.can_use_crawler !== false : true;

  return (
    <div className="stack-lg">
      <div className="grid-2">
        <Card>
          <div
            className={`dropzone ${dragging ? "is-dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span className="empty__icon" style={{ marginBottom: 0 }}>{uploading ? <Loader2 className="spin" /> : <UploadCloud />}</span>
            <h3>Upload documents</h3>
            <p className="text-sm muted">Drag a file here or browse. PDF, DOCX, TXT or CSV{maxSize ? ` · up to ${fmtBytes(maxSize)} total` : ""}{maxFiles ? ` · ${maxFiles} files` : ""} on your plan.</p>
            <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => upload(e.target.files?.[0])} />
            <Button variant="dark" onClick={() => inputRef.current?.click()} loading={uploading}>{uploading ? "Uploading…" : "Choose file"}</Button>
          </div>
        </Card>
        <Card>
          <form className="card__body stack" onSubmit={crawl} style={{ height: "100%" }}>
            <div className="row" style={{ alignItems: "flex-start" }}>
              <span className="stat__icon" style={{ width: 40, height: 40 }}><Globe /></span>
              <div><h3>Crawl a website</h3><p className="text-sm muted" style={{ marginTop: 2 }}>Paste a website or sitemap URL. We try the sitemap first, then crawl same-domain pages up to your plan limit.</p></div>
            </div>
            {!canCrawl && <div className="callout callout--brand"><Lock /><div>Website crawling isn't included in your plan. <Link to="/app/billing" className="link">Compare plans</Link></div></div>}
            <Field label="Website or sitemap URL" htmlFor="crawl-url"><Input id="crawl-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com or https://example.com/sitemap.xml" /></Field>
            <div><Button type="submit" variant="secondary" loading={crawling} disabled={!url.trim()}>{crawling ? "Queuing…" : "Start crawl"}</Button></div>
          </form>
        </Card>
      </div>

      <Card>
        <CardHeader title="Sources" description="Everything this chatbot can draw answers from. Status refreshes automatically." />
        {files === null ? (
          <div className="card__body muted text-sm row"><span className="spinner" />Loading sources…</div>
        ) : files.length === 0 && jobs.length === 0 ? (
          <EmptyState compact icon={<FileText />} title="No knowledge yet" description="Upload a document or crawl your website so the assistant can answer with your information." />
        ) : (
          <div className="list">
            {jobs.slice(0, 5).map((j) => (
              <div key={j.id} className="list-item">
                <span className="stat__icon"><Globe /></span>
                <div className="list-item__body">
                  <div className="list-item__title truncate">{j.url}</div>
                  <div className="list-item__meta">{j.indexed_pages || 0}/{j.page_count || j.page_limit || 0} pages · {j.chunk_count || 0} chunks{j.error ? ` · ${j.error}` : ""}</div>
                </div>
                <KbStatus status={j.status} error={j.error} />
              </div>
            ))}
            {files.map((f) => (
              <div key={f.id} className="list-item">
                <span className="stat__icon"><FileText /></span>
                <div className="list-item__body">
                  <div className="list-item__title truncate">{f.filename}</div>
                  <div className="list-item__meta">{(f.size_bytes / 1024).toFixed(1)} KB · {f.chunk_count || 0} chunks</div>
                </div>
                <KbStatus status={f.status} error={f.error} />
                <IconButton label={`Remove ${f.filename}`} onClick={() => removeFile(f)}><Trash2 /></IconButton>
              </div>
            ))}
          </div>
        )}
      </Card>

      {bot && <RetrievalSettings bot={bot} onSaved={setBot} />}
    </div>
  );
}

function KbStatus({ status, error }: { status: string; error?: string }) {
  if (status === "indexed") return <span className="badge badge--success badge--plain"><CheckCircle2 size={12} />Indexed</span>;
  if (status === "failed") return <span className="badge badge--danger badge--plain" title={error}><AlertTriangle size={12} />Failed</span>;
  return <span className="badge badge--brand badge--plain"><Loader2 size={12} className="spin" />{status || "Processing"}</span>;
}

function RetrievalSettings({ bot, onSaved }: { bot: Chatbot; onSaved: (b: Chatbot) => void }) {
  const toast = useToast();
  const c: KbSettings = bot.kb_settings || {};
  const [topK, setTopK] = useState(c.retrieval_top_k ?? 5);
  const [threshold, setThreshold] = useState(c.retrieval_threshold ?? 0.2);
  const [chunkSize, setChunkSize] = useState(c.chunk_size ?? 800);
  const [overlap, setOverlap] = useState(c.chunk_overlap ?? 100);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/chatbots/${bot.id}`, { kb_settings: { retrieval_top_k: topK, retrieval_threshold: threshold, chunk_size: chunkSize, chunk_overlap: overlap } });
      onSaved(data);
      toast.success("Retrieval settings saved");
    } catch (err) { toast.error(errorMessage(err)); }
    finally { setSaving(false); }
  };

  return (
    <FormSection
      title={<span className="row" style={{ gap: 8 }}><SlidersHorizontal size={16} className="text-brand" />Retrieval tuning</span>}
      description="Advanced controls for how the bot pulls context. The defaults work well for most use cases."
      footer={<Button onClick={submit} loading={saving}>{saving ? "Saving…" : "Save retrieval settings"}</Button>}
    >
      <div className="grid-2">
        <Field label="Top K results" htmlFor="kb-k" hint="Chunks retrieved per question (1–20)."><Input id="kb-k" type="number" min={1} max={20} value={topK} onChange={(e) => setTopK(Number(e.target.value))} /></Field>
        <Field label="Similarity threshold" htmlFor="kb-t" hint="Lower = more matches but noisier (0.0–1.0)."><Input id="kb-t" type="number" step="0.05" min={0} max={1} value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} /></Field>
        <Field label="Chunk size (characters)" htmlFor="kb-c" hint="Size of each knowledge chunk (200–4000). Applies to new uploads."><Input id="kb-c" type="number" min={200} max={4000} value={chunkSize} onChange={(e) => setChunkSize(Number(e.target.value))} /></Field>
        <Field label="Chunk overlap" htmlFor="kb-o" hint="Characters shared between adjacent chunks (0–500)."><Input id="kb-o" type="number" min={0} max={500} value={overlap} onChange={(e) => setOverlap(Number(e.target.value))} /></Field>
      </div>
    </FormSection>
  );
}
