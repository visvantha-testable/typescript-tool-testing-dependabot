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

const npm = {
  dependencies: [{ name: "typescript", version: "5.5.0", license: "MIT", vulns: [] }],
  direct_dependencies: 4,
  transitive_dependencies: 46,
  total_dependencies: 50,
  licenses: [{ name: "typescript", license: "MIT" }],
  dependency_tree: [{ key: "typescript", package_name: "typescript", dependencies: [] }],
  outdated_packages: [],
};

describe("platformDependabotFixup", () => {
  it("applies 8-metric 0-100 scale totals for Testable platform", () => {
    const unified = applyPlatformMetricScale({ metrics: [], tool: "Dependabot" }, metrics, npm);
    expect(unified.metrics_total).toBe(8);
    expect(unified["License Compliance Testing"]).toBe(100);
    expect(unified["Continuous Dependency Monitoring"]).toBe(100);
    expect((unified.totals as Record<string, number>).compliant_licenses).toBeGreaterThan(10);
    expect((unified.metrics as unknown[]).length).toBe(8);
    const row = (unified.metrics as Array<Record<string, unknown>>)[0];
    expect(row.value).toBe("100/100");
    expect(row.result).toBe("PASS");
  });
});
