import { describe, expect, it } from "vitest";
import { applyPlatformMetricScale } from "../src/platform/platformDependabotFixup.js";
import type { DependabotMetrics } from "../src/types/dependabotTypes.js";

const metrics: DependabotMetrics = {
  dependabot_enabled: true,
  monitoring_active: true,
  security_advisories_total: 7,
  alert_signal: 0,
  alert_response_rate_percent: 100,
  new_advisories_count: 0,
  baseline_advisory_count: 7,
  continuous_monitoring_score: 100,
  continuous_monitoring_percent: 100,
  api_status: "OK",
  target_repository: "nestjs/nest",
  api_endpoint: "GET /repos/nestjs/nest/security-advisories",
};

describe("platformDependabotFixup", () => {
  it("applies 0-100 scale totals for Testable platform", () => {
    const unified = applyPlatformMetricScale(
      { metrics: [], tool: "Dependabot" },
      metrics,
    );
    expect(unified["Continuous Dependency Monitoring"]).toBe(100);
    expect(unified["Real-Time Alerting"]).toBe(100);
    expect((unified.totals as Record<string, number>).continuous_monitoring_ratio).toBe(100);
    expect((unified.totals as Record<string, number>).alert_response_rate).toBe(100);
    expect(unified.output_complete).toBe(true);
    const row = (unified.metrics as Array<Record<string, unknown>>)[0];
    expect(row.value).toBe("100/100");
    expect(row.result).toBe("PASS");
    expect(row.platform_ratio).toBe(100);
  });
});
