import { useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import type { Dependency } from "@/services/api";
import { Panel, Empty, inputCls } from "./ui";

const depName = (d: Dependency) => d.artifact_id || d.name || "—";

export function DependencyTable({ deps }: { deps: Dependency[] }) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return deps.filter((d) => !s || `${d.group_id || ""} ${depName(d)}`.toLowerCase().includes(s));
  }, [deps, q]);

  return (
    <Panel title={`Dependencies (${deps.length})`} icon={<Package className="h-4 w-4 text-primary" />}>
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input className={`${inputCls} pl-9`} placeholder="Search dependencies" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {rows.length === 0 ? (
        <Empty icon={<Package className="h-8 w-8" />} title="No dependencies" text={deps.length ? "No dependency matches your search." : "Dependencies extracted from a scan will appear here."} />
      ) : (
        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {["Name", "Group", "Version", "Source / Operator", "Ecosystem"].map((h) => <th key={h} className="px-5 py-2.5 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((d, i) => {
                const maven = !!d.artifact_id;
                return (
                  <tr key={i} className="border-b border-border/60">
                    <td className="px-5 py-3 font-mono text-xs text-primary">{depName(d)}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{d.group_id || "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs">{d.version || "—"}</td>
                    <td className="px-5 py-3 font-mono text-xs">{maven ? d.version_source || "—" : d.version_operator || "—"}</td>
                    <td className="px-5 py-3"><span className="rounded-md border border-border px-2 py-0.5 text-[11px]">{maven ? "Maven" : "Python"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
