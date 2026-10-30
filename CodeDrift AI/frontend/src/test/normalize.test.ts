import { describe, it, expect } from "vitest";
import { normalizeScanResult } from "@/services/api";

describe("normalizeScanResult", () => {
  it("derives totals and risk counts when the backend omits them", () => {
    const r = normalizeScanResult({ dependencies: [{ name: "a" }, { name: "b" }], breaking_changes: [{ risk: "HIGH" }, { risk: "HIGH" }] });
    expect(r.total_dependencies).toBe(2);
    expect(r.total_breaking_changes).toBe(2);
    expect(r.risk_summary).toEqual({ HIGH: 2 });
  });
  it("keeps backend-provided summaries", () => {
    const r = normalizeScanResult({ total_dependencies: 9, risk_summary: { LOW: 1 }, dependencies: [] });
    expect(r.total_dependencies).toBe(9);
    expect(r.risk_summary).toEqual({ LOW: 1 });
  });
});
