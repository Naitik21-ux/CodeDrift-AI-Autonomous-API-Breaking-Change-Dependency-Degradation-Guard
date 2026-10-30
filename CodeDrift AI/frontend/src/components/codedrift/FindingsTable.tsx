import { useMemo, useState } from "react";
import { AlertTriangle, Search, X, FileCode } from "lucide-react";
import type { Finding } from "@/services/api";
import { Panel, RiskBadge, VerifyBadge, Empty, inputCls } from "./ui";
import { MOCK_WARNING } from "./VerificationBanner";

export function FindingsTable({ findings }: { findings: Finding[] }) {
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("ALL");
  const [sel, setSel] = useState<Finding | null>(null);

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return findings.filter(
      (f) =>
        (risk === "ALL" || (f.risk || "").toUpperCase() === risk) &&
        (!s || (f.file || "").toLowerCase().includes(s) || (f.method || "").toLowerCase().includes(s)),
    );
  }, [findings, q, risk]);

  return (
    <Panel
      title={`Potential breaking changes (${findings.length})`}
      icon={<AlertTriangle className="h-4 w-4 text-medium" />}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inputCls} pl-9`} placeholder="Search by file or method" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className={`${inputCls} sm:w-44`} value={risk} onChange={(e) => setRisk(e.target.value)}>
          <option value="ALL">All risk levels</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {rows.length === 0 ? (
        <Empty icon={<FileCode className="h-8 w-8" />} title={findings.length ? "No matching findings" : "No findings yet"} text={findings.length ? "Try a different search or risk filter." : "Run a repository scan to see potential breaking changes here."} />
      ) : (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {["File", "Line", "Method", "Change Type", "Risk", "Replacement", "Verification"].map((h) => (
                  <th key={h} className="px-5 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((f, i) => (
                <tr key={i} onClick={() => setSel(f)} className="cursor-pointer border-b border-border/60 transition hover:bg-accent/40">
                  <td className="max-w-[260px] truncate px-5 py-3 font-mono text-xs" title={f.file}>{f.file || "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs">{f.line ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-primary">{f.method || "—"}</td>
                  <td className="px-5 py-3 capitalize">{f.change_type || "—"}</td>
                  <td className="px-5 py-3"><RiskBadge risk={f.risk} /></td>
                  <td className="px-5 py-3 font-mono text-xs">{f.replacement || "—"}</td>
                  <td className="px-5 py-3"><VerifyBadge verified={f.verified} source={f.source_type} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sel && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm" onClick={() => setSel(null)}>
          <div className="animate-fade-up w-full max-w-lg rounded-xl border border-border bg-popover p-6 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-sm text-primary">{sel.method}</p>
                <p className="break-all font-mono text-xs text-muted-foreground">{sel.file}{sel.line != null && `:${sel.line}`}</p>
              </div>
              <button onClick={() => setSel(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="mb-4 flex flex-wrap gap-2"><RiskBadge risk={sel.risk} /><VerifyBadge verified={sel.verified} source={sel.source_type} /></div>
            <p className="text-sm leading-relaxed">{sel.description || "No description provided."}</p>
            <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <dt className="text-muted-foreground">Change type</dt><dd className="capitalize">{sel.change_type || "—"}</dd>
              <dt className="text-muted-foreground">Suggested replacement</dt><dd className="font-mono">{sel.replacement || "—"}</dd>
              <dt className="text-muted-foreground">Source</dt><dd className="font-mono">{sel.source_type || "—"}</dd>
            </dl>
            {(sel.verified === false || sel.source_type === "mock_rule") && (
              <p className="mt-4 rounded-lg border border-medium/40 bg-medium/10 p-3 text-xs text-medium">{MOCK_WARNING}</p>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
