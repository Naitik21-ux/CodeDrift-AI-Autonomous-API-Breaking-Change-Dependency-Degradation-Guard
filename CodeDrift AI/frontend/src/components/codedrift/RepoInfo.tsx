import { FolderGit2 } from "lucide-react";
import type { ScanResult } from "@/services/api";
import { Panel } from "./ui";

export function RepoInfo({ result }: { result: ScanResult | null }) {
  if (!result) return null;
  const rows: [string, string][] = [
    ["Repository", result.repository || "—"],
    ["Project type", result.project_type || "Unknown"],
    ["Total files", String(result.total_files ?? "—")],
  ];
  return (
    <Panel title="Scanned repository" icon={<FolderGit2 className="h-4 w-4 text-primary" />}>
      <dl className="grid gap-4 sm:grid-cols-3">
        {rows.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="mt-1 truncate font-mono text-sm" title={v}>{v}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
