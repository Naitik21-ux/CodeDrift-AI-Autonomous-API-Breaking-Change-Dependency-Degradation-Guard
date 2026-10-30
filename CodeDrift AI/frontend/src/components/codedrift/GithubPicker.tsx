import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Search, X, Lock, Globe, AlertCircle } from "lucide-react";
import { listGithubRepos, type GithubRepo } from "@/lib/github.functions";
import { inputCls } from "./ui";

export function GithubPicker({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (url: string) => void }) {
  const [repos, setRepos] = useState<GithubRepo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open || repos) return;
    setError(null);
    listGithubRepos()
      .then(setRepos)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load repositories."));
  }, [open, repos]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!repos) return [];
    return s ? repos.filter((r) => `${r.owner}/${r.name} ${r.description ?? ""}`.toLowerCase().includes(s)) : repos;
  }, [repos, q]);

  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[80vh] w-full max-w-xl flex-col rounded-xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Select a GitHub repository</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-4 w-4" /></button>
        </div>
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input autoFocus className={`${inputCls} pl-9`} placeholder="Search repositories…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {error ? (
            <div className="m-2 flex items-start gap-2 rounded-lg border border-high/40 bg-high/10 px-3 py-2.5 text-sm text-high">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error} You can still paste a URL manually.
            </div>
          ) : !repos ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading repositories…</div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No repositories found.</p>
          ) : (
            filtered.map((r) => (
              <button key={r.id} type="button" onClick={() => { onSelect(r.clone_url); onClose(); }}
                className="block w-full rounded-lg px-3 py-2.5 text-left transition hover:bg-accent">
                <div className="flex items-center gap-2">
                  <span className="truncate font-mono text-sm"><span className="text-muted-foreground">{r.owner}/</span>{r.name}</span>
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground">
                    {r.private ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}{r.private ? "Private" : "Public"}
                  </span>
                </div>
                {r.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
