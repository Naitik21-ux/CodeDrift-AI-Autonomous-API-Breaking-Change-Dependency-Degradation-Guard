// Frontend-only client for the existing CodeDrift AI FastAPI backend.
export const API_BASE_URL: string =
  (import.meta.env["VITE_API_BASE_URL"] as string | undefined) || "http://localhost:8000";

export type Risk = "HIGH" | "MEDIUM" | "LOW";

export interface Finding {
  file?: string;
  line?: number;
  method?: string;
  replacement?: string | null;
  change_type?: string;
  description?: string;
  risk?: Risk | string;
  source_type?: string;
  verified?: boolean;
}

export interface Dependency {
  group_id?: string;
  artifact_id?: string;
  name?: string;
  version?: string;
  version_source?: string;
  version_operator?: string;
}

export interface ScanResult {
  message?: string;
  repository?: string;
  project_type?: string;
  total_files?: number;
  total_dependencies?: number;
  total_breaking_changes?: number;
  risk_summary?: Partial<Record<Risk, number>>;
  verification_summary?: { mock_findings?: number; verified_findings?: number; message?: string };
  breaking_changes?: Finding[];
  dependencies?: Dependency[];
  [key: string]: unknown;
}

export interface ScanRequest {
  repo_url: string;
  library: string | null;
  old_version: string | null;
  new_version: string | null;
}

export class ApiError extends Error {}

async function request(path: string, init: RequestInit = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal });
  } catch (e) {
    if ((e as Error).name === "AbortError")
      throw new ApiError("The request timed out. The backend took too long to respond.");
    throw new ApiError(`Cannot reach the backend at ${API_BASE_URL}. Make sure the FastAPI server is running.`);
  } finally {
    clearTimeout(timer);
  }
}

export async function checkBackendHealth(): Promise<{ message?: string; version?: string } | null> {
  try {
    const res = await request("/", {}, 4000);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function scanRepository(scanRequest: ScanRequest): Promise<ScanResult> {
  const res = await request(
    "/scan",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(scanRequest) },
    120000,
  );
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new ApiError("The backend returned an invalid response.");
  }
  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail;
    const msg = typeof detail === "string" ? detail : `Scan failed (status ${res.status}).`;
    throw new ApiError(msg);
  }
  if (!data || typeof data !== "object") throw new ApiError("The backend returned an invalid response.");
  return normalizeScanResult(data as ScanResult);
}

// Fill summary fields from the arrays when the backend omits them.
export function normalizeScanResult(r: ScanResult): ScanResult {
  const findings = Array.isArray(r.breaking_changes) ? r.breaking_changes : [];
  const deps = Array.isArray(r.dependencies) ? r.dependencies : [];
  const counted: Partial<Record<Risk, number>> = {};
  for (const f of findings) {
    const k = String(f.risk || "").toUpperCase() as Risk;
    if (k === "HIGH" || k === "MEDIUM" || k === "LOW") counted[k] = (counted[k] ?? 0) + 1;
  }
  return {
    ...r,
    breaking_changes: findings,
    dependencies: deps,
    total_dependencies: r.total_dependencies ?? deps.length,
    total_breaking_changes: r.total_breaking_changes ?? findings.length,
    risk_summary: r.risk_summary ?? counted,
  };
}

export function isValidRepoUrl(url: string) {
  return /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i.test(url.trim());
}
