import { TriangleAlert } from "lucide-react";
import type { ScanResult } from "@/services/api";

export const MOCK_WARNING = "These findings are based on mock rules and have not been independently verified.";

export function VerificationBanner({ result }: { result: ScanResult | null }) {
  if (!result) return null;
  const vs = result.verification_summary;
  const hasUnverified = (result.breaking_changes || []).some((f) => f.verified === false || f.source_type === "mock_rule");
  if (!vs && !hasUnverified) return null;
  return (
    <div className="animate-fade-up flex flex-col gap-3 rounded-xl border border-medium/40 bg-medium/10 p-4 sm:flex-row sm:items-center">
      <TriangleAlert className="h-5 w-5 shrink-0 text-medium" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-medium">Unverified findings</p>
        <p className="text-foreground/85">{vs?.message || MOCK_WARNING}</p>
        {hasUnverified && vs?.message && vs.message !== MOCK_WARNING && <p className="mt-1 text-foreground/85">{MOCK_WARNING}</p>}
      </div>
      {vs && (
        <div className="flex gap-4 font-mono text-xs">
          <span>Mock: <b className="text-medium">{vs.mock_findings ?? 0}</b></span>
          <span>Verified: <b className="text-low">{vs.verified_findings ?? 0}</b></span>
        </div>
      )}
    </div>
  );
}
