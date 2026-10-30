import { useState } from "react";
import { Loader2, ScanSearch, AlertCircle, Github } from "lucide-react";
import { Panel, inputCls } from "./ui";
import { isValidRepoUrl, type ScanRequest } from "@/services/api";
import { GithubPicker } from "./GithubPicker";

export function RepositoryScan({ loading, error, onScan }: { loading: boolean; error: string | null; onScan: (r: ScanRequest) => void }) {
  const [repo, setRepo] = useState("");
  const [picker, setPicker] = useState(false);
  const [library, setLibrary] = useState("");
  const [oldV, setOldV] = useState("");
  const [newV, setNewV] = useState("");
  const [localErr, setLocalErr] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repo.trim()) return setLocalErr("Please enter a GitHub repository URL.");
    if (!isValidRepoUrl(repo)) return setLocalErr("That doesn't look like a valid GitHub repository URL (https://github.com/owner/repo).");
    setLocalErr(null);
    const n = (v: string) => (v.trim() ? v.trim() : null);
    onScan({ repo_url: repo.trim(), library: n(library), old_version: n(oldV), new_version: n(newV) });
  };

  const err = localErr || error;
  return (
    <Panel title="Scan a repository" icon={<ScanSearch className="h-4 w-4 text-primary" />}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">GitHub repository URL *</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className={`${inputCls} pl-9 font-mono`} placeholder="https://github.com/spring-projects/spring-petclinic" value={repo} onChange={(e) => setRepo(e.target.value)} />
            </div>
            <button type="button" onClick={() => setPicker(true)} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-secondary px-3 text-sm font-medium transition hover:bg-accent">
              <Github className="h-4 w-4" /> <span className="hidden sm:inline">Select from GitHub</span>
            </button>
          </div>
          <GithubPicker open={picker} onClose={() => setPicker(false)} onSelect={(u) => { setRepo(u); setLocalErr(null); }} />
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Library / artifact (optional)", library, setLibrary, "spring-core"],
            ["Old version (optional)", oldV, setOldV, "5.3.0"],
            ["New version (optional)", newV, setNewV, "6.1.5"],
          ].map(([label, val, set, ph]) => (
            <label key={label as string} className="block space-y-1.5">
              <span className="text-xs font-medium text-muted-foreground">{label as string}</span>
              <input className={inputCls} placeholder={ph as string} value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} />
            </label>
          ))}
        </div>
        {err && (
          <div className="flex items-start gap-2 rounded-lg border border-high/40 bg-high/10 px-3 py-2.5 text-sm text-high">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
          </div>
        )}
        <button type="submit" disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
          {loading ? "Scanning repository…" : "Scan Repository"}
        </button>
      </form>
    </Panel>
  );
}
