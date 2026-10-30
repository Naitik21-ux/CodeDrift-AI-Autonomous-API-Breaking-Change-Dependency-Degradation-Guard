import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
import { Sidebar, NAV, type Page } from "@/components/codedrift/Sidebar";
import { Topbar } from "@/components/codedrift/Topbar";
import { RepositoryScan } from "@/components/codedrift/RepositoryScan";
import { StatsGrid, RiskSummary } from "@/components/codedrift/Stats";
import { FindingsTable } from "@/components/codedrift/FindingsTable";
import { DependencyTable } from "@/components/codedrift/DependencyTable";
import { VerificationBanner } from "@/components/codedrift/VerificationBanner";
import { ScanHistory, HISTORY_KEY, type HistoryItem } from "@/components/codedrift/ScanHistory";
import { Panel } from "@/components/codedrift/ui";
import { RepoInfo } from "@/components/codedrift/RepoInfo";
import { API_BASE_URL, ApiError, checkBackendHealth, scanRepository, type ScanRequest, type ScanResult } from "@/services/api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CodeDrift AI — API Breaking-Change Guard" },
      { name: "description", content: "Scan GitHub repositories for dependency drift and potential API breaking changes with risk levels." },
      { property: "og:title", content: "CodeDrift AI — API Breaking-Change Guard" },
      { property: "og:description", content: "Scan GitHub repositories for dependency drift and potential API breaking changes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking");
  const [backendInfo, setBackendInfo] = useState<{ message?: string; version?: string } | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<string>();

  const ping = useCallback(async () => {
    const info = await checkBackendHealth();
    setBackendInfo(info);
    setStatus(info ? "connected" : "disconnected");
  }, []);

  useEffect(() => {
    ping();
    const t = setInterval(ping, 15000);
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* ignore corrupt history */ }
    return () => clearInterval(t);
  }, [ping]);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  };

  const runScan = async (req: ScanRequest) => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const data = await scanRepository(req);
      setResult(data);
      setStatus("connected");
      const findings = data.breaking_changes?.length ?? data.total_breaking_changes ?? 0;
      if (!data.dependencies?.length && !findings) setNotice("Scan completed, but no dependencies or findings were returned for this repository.");
      saveHistory([
        {
          id: crypto.randomUUID(),
          repo_url: req.repo_url,
          date: new Date().toISOString(),
          total_dependencies: data.total_dependencies ?? data.dependencies?.length ?? 0,
          total_findings: data.total_breaking_changes ?? findings,
          risk_summary: data.risk_summary ?? {},
        },
        ...history,
      ].slice(0, 30));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "The scan failed unexpectedly. Please try again.");
      if (e instanceof ApiError && e.message.startsWith("Cannot reach")) setStatus("disconnected");
    } finally {
      setLoading(false);
    }
  };

  const findings = result?.breaking_changes ?? [];
  const deps = result?.dependencies ?? [];
  const title = NAV.find((n) => n.id === page)?.label ?? "";

  const scanCard = <RepositoryScan loading={loading} error={error} onScan={runScan} />;
  const noticeEl = notice && <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">{notice}</div>;

  return (
    <div className="min-h-screen">
      <Sidebar page={page} onNavigate={setPage} open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="lg:pl-64">
        <Topbar title={title} status={status} onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
          {page === "dashboard" && (
            <>
              <StatsGrid result={result} />
              <div className="grid gap-6 xl:grid-cols-5">
                <div className="xl:col-span-3">{scanCard}</div>
                <div className="space-y-4 xl:col-span-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Risk summary</h3>
                  <RiskSummary summary={result?.risk_summary} />
                  <VerificationBanner result={result} />
                </div>
              </div>
              <RepoInfo result={result} />
              {noticeEl}
              <FindingsTable findings={findings} />
            </>
          )}
          {page === "scan" && (<>{scanCard}<RepoInfo result={result} />{noticeEl}<VerificationBanner result={result} />{result && <RiskSummary summary={result.risk_summary} />}</>)}
          {page === "dependencies" && (<><RepoInfo result={result} /><DependencyTable deps={deps} /></>)}
          {page === "changes" && (<><VerificationBanner result={result} /><RiskSummary summary={result?.risk_summary} /><FindingsTable findings={findings} /></>)}
          {page === "history" && (
            <ScanHistory items={history} selectedId={selectedHistory} onSelect={(h) => setSelectedHistory(selectedHistory === h.id ? undefined : h.id)} onClear={() => saveHistory([])} />
          )}
          {page === "settings" && (
            <Panel title="Settings" icon={<SettingsIcon className="h-4 w-4 text-primary" />}>
              <dl className="grid gap-3 text-sm sm:grid-cols-[200px_1fr]">
                <dt className="text-muted-foreground">Backend URL</dt><dd className="font-mono">{API_BASE_URL}</dd>
                <dt className="text-muted-foreground">Status</dt><dd className="capitalize">{status}</dd>
                <dt className="text-muted-foreground">Backend message</dt><dd>{backendInfo?.message ?? "—"}</dd>
                <dt className="text-muted-foreground">Backend version</dt><dd className="font-mono">{backendInfo?.version ?? "—"}</dd>
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">Change the backend URL with the VITE_API_BASE_URL environment variable.</p>
              <button onClick={ping} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent">Re-check connection</button>
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
}
