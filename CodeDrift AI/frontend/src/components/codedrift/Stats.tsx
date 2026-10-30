import type { ReactNode } from "react";
import { Package, AlertTriangle, ShieldAlert, BadgeCheck } from "lucide-react";
import type { ScanResult } from "@/services/api";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: string }) {
  return (
    <div className="animate-fade-up rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", tone)}>{icon}</span>
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold">{value}</p>
    </div>
  );
}

export function StatsGrid({ result }: { result: ScanResult | null }) {
  const r = result;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Total Dependencies" value={r?.total_dependencies ?? 0} icon={<Package className="h-4 w-4" />} tone="bg-primary/15 text-primary" />
      <StatCard label="Total Breaking Changes" value={r?.total_breaking_changes ?? 0} icon={<AlertTriangle className="h-4 w-4" />} tone="bg-medium/15 text-medium" />
      <StatCard label="High Risk Findings" value={r?.risk_summary?.HIGH ?? 0} icon={<ShieldAlert className="h-4 w-4" />} tone="bg-high/15 text-high" />
      <StatCard label="Verified Findings" value={r?.verification_summary?.verified_findings ?? 0} icon={<BadgeCheck className="h-4 w-4" />} tone="bg-low/15 text-low" />
    </div>
  );
}

export function RiskSummary({ summary }: { summary?: ScanResult["risk_summary"] }) {
  const items = [
    { k: "HIGH", c: "border-high/40 text-high", bar: "bg-high" },
    { k: "MEDIUM", c: "border-medium/40 text-medium", bar: "bg-medium" },
    { k: "LOW", c: "border-low/40 text-low", bar: "bg-low" },
  ] as const;
  const total = items.reduce((s, i) => s + (summary?.[i.k] ?? 0), 0);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((i) => {
        const v = summary?.[i.k] ?? 0;
        return (
          <div key={i.k} className={cn("animate-fade-up rounded-xl border bg-card p-4 shadow-card", i.c)}>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-xs font-semibold tracking-widest">{i.k}</span>
              <span className="font-mono text-2xl font-semibold text-foreground">{v}</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full transition-all", i.bar)} style={{ width: total ? `${(v / total) * 100}%` : "0%" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
