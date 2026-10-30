import { LayoutDashboard, ScanSearch, Package, AlertTriangle, History, Settings, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Page = "dashboard" | "scan" | "dependencies" | "changes" | "history" | "settings";

export const NAV: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "scan", label: "Repository Scan", icon: ScanSearch },
  { id: "dependencies", label: "Dependencies", icon: Package },
  { id: "changes", label: "Breaking Changes", icon: AlertTriangle },
  { id: "history", label: "Scan History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ page, onNavigate, open, onClose }: { page: Page; onNavigate: (p: Page) => void; open: boolean; onClose: () => void }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary ring-1 ring-primary/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="font-semibold">CodeDrift AI</p>
            <p className="text-[11px] text-muted-foreground">Breaking-change guard</p>
          </div>
          <button className="ml-auto text-muted-foreground lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { onNavigate(id); onClose(); }}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition",
                page === id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-primary/25"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", page === id && "text-primary")} />
              {label}
            </button>
          ))}
        </nav>
        <p className="border-t border-sidebar-border p-4 text-[11px] text-muted-foreground">v0.1.0 · University SE Project</p>
      </aside>
    </>
  );
}
