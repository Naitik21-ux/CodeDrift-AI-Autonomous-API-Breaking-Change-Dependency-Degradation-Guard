import { History, Trash2 } from "lucide-react";
import type { ScanResult } from "@/services/api";
import { Panel, Empty } from "./ui";
import { cn } from "@/lib/utils";

export interface HistoryItem {
  id: string;
  repo_url: string;
  date: string;
  total_dependencies: number;
  total_findings: number;
  risk_summary: ScanResult["risk_summary"];
}

export const HISTORY_KEY = "codedrift-scan-history";

export function ScanHistory({ items, selectedId, onSelect, onClear }: { items: HistoryItem[]; selectedId?: string | undefined; onSelect: (h: HistoryItem) => void; onClear: () => void }) {
  return (
    <Panel
      title="Scan history"
      icon={<History className="h-4 w-4 text-primary" />}
      action={items.length > 0 && (
        <button onClick={onClear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-high"><Trash2 className="h-3.5 w-3.5" /> Clear</button>
      )}
    >
      <p className="mb-4 text-xs text-muted-foreground">Stored only in this browser (localStorage) — not saved on the backend.</p>
      {items.length === 0 ? (
        <Empty icon={<History className="h-8 w-8" />} title="No scans yet" text="Completed scans will be listed here." />
      ) : (
        <ul className="space-y-2">
          {items.map((h) => (
            <li key={h.id}>
              <button onClick={() => onSelect(h)} className={cn("w-full rounded-lg border p-3 text-left transition hover:bg-accent/40", selectedId === h.id ? "border-primary/60 bg-accent/40" : "border-border")}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="break-all font-mono text-xs text-primary">{h.repo_url}</span>
                  <span className="text-[11px] text-muted-foreground">{new Date(h.date).toLocaleString()}</span>
                </div>
                {selectedId === h.id && (
                  <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs sm:grid-cols-5">
                    <span>Deps: <b>{h.total_dependencies}</b></span>
                    <span>Findings: <b>{h.total_findings}</b></span>
                    <span className="text-high">HIGH: {h.risk_summary?.HIGH ?? 0}</span>
                    <span className="text-medium">MEDIUM: {h.risk_summary?.MEDIUM ?? 0}</span>
                    <span className="text-low">LOW: {h.risk_summary?.LOW ?? 0}</span>
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
