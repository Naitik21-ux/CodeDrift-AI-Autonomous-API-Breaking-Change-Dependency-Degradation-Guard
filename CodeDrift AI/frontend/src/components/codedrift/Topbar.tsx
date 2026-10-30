import { Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

export function Topbar({ title, status, onMenu }: { title: string; status: "checking" | "connected" | "disconnected"; onMenu: () => void }) {
  const label = status === "connected" ? "Connected" : status === "disconnected" ? "Disconnected" : "Checking…";
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-6">
      <button className="text-muted-foreground lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-3">
        <span
          className={cn(
            "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
            status === "connected" && "border-low/40 bg-low/10 text-low",
            status === "disconnected" && "border-high/40 bg-high/10 text-high",
            status === "checking" && "border-border text-muted-foreground",
          )}
          title="Backend status"
        >
          <span className={cn("h-2 w-2 rounded-full bg-current", status === "connected" && "animate-pulse")} />
          <span className="hidden sm:inline">Backend:</span> {label}
        </span>
        <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </button>
        <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-xs font-semibold text-primary ring-1 ring-border">CD</div>
      </div>
    </header>
  );
}
