import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ title, icon, children, className, action }: { title?: string; icon?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("animate-fade-up rounded-xl border border-border bg-card shadow-card", className)}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <h2 className="flex items-center gap-2 text-sm font-semibold tracking-wide">
            {icon}
            {title}
          </h2>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const riskStyles: Record<string, string> = {
  HIGH: "bg-high/15 text-high border-high/40",
  MEDIUM: "bg-medium/15 text-medium border-medium/40",
  LOW: "bg-low/15 text-low border-low/40",
};

export function RiskBadge({ risk }: { risk?: string | undefined }) {
  const r = (risk || "").toUpperCase();
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold", riskStyles[r] || "border-border text-muted-foreground")}>
      {r || "—"}
    </span>
  );
}

export function VerifyBadge({ verified, source }: { verified?: boolean | undefined; source?: string | undefined }) {
  const ok = verified === true && source !== "mock_rule";
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-[11px] font-medium", ok ? "border-low/40 bg-low/10 text-low" : "border-medium/40 bg-medium/10 text-medium")}>
      {ok ? "Verified" : source === "mock_rule" ? "Mock rule · unverified" : "Unverified"}
    </span>
  );
}

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

export const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-ring/30";
