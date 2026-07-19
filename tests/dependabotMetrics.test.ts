import { describe, expect, it } from "vitest";
import {
  buildMetricRows,
  computeMetrics,
} from "../src/metrics/dependabotMetrics.js";
import type {
  DependabotAlertsFetchResult,
  DependabotConfigCheck,
  NpmVulnerabilityCheck,
} from "../src/types/dependabotTypes.js";

const config: DependabotConfigCheck = {
  dependabot_yml_present: true,
  npm_ecosystem_configured: true,
  sample_subject_monitored: true,
  schedule_interval: "daily",
  daily_schedule: true,
};

const npmCheck: NpmVulnerabilityCheck = {
  intentionally_vulnerable_count: 4,
  packages: [
    { name: "lodash", version: "4.17.20", manifest: "package.json" },
  ],
};

function makeFetchResult(alertCount: number): DependabotAlertsFetchResult {
  const alerts = Array.from({ length: alertCount }, (_, i) => ({
    number: i + 1,
    state: "open",
    dependency: {
      package: { ecosystem: "npm", name: "lodash" },
      manifest_path: "package-lock.json",
    },
    security_advisory: {
      ghsa_id: `GHSA-TEST-0000-000${i}`,
      summary: "Test alert",
      severity: "high",
    },
  }));
  return {
    http_status: 200,
    api_endpoint:
      "GET /repos/visvantha-testable/typescript-tool-testing-dependabot/dependabot/alerts",
    repository: "visvantha-testable/typescript-tool-testing-dependabot",
    alerts,
    alert_count: alertCount,
    fetched_at: "2026-01-01T00:00:00Z",
  };
}

describe("dependabotMetrics", () => {
  it("scores 100 when Dependabot alerts are present", () => {
    const metrics = computeMetrics(makeFetchResult(3), config, npmCheck);
    expect(metrics.continuous_monitoring_score).toBe(100);
    expect(metrics.open_alerts_count).toBe(3);
    expect(metrics.metric_fully_supported).toBe(true);
  });

  it("scores 0 when API returns no alerts yet", () => {
    const metrics = computeMetrics(makeFetchResult(0), config, npmCheck);
    expect(metrics.continuous_monitoring_score).toBe(0);
    expect(metrics.metric_fully_supported).toBe(false);
  });

  it("builds metric row at 100/100 when alerts exist", () => {
    const metrics = computeMetrics(makeFetchResult(2), config, npmCheck);
    const rows = buildMetricRows(metrics);
    expect(rows).toHaveLength(1);
    expect(rows[0].l4_classification).toBe("Continuous Dependency Monitoring");
    expect(rows[0].score).toBe(100);
    expect(rows[0].covered).toBe("yes");
  });
});
