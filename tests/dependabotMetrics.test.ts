import { describe, expect, it } from "vitest";
import {
  buildMetricRows,
  computeMetrics,
} from "../src/metrics/dependabotMetrics.js";
import type {
  AdvisoryBaseline,
  DependabotConfigCheck,
  SecurityAdvisory,
} from "../src/types/dependabotTypes.js";

const baseline: AdvisoryBaseline = {
  repository: "nestjs/nest",
  api_endpoint: "GET /repos/nestjs/nest/security-advisories",
  advisory_count: 2,
  ghsa_ids: ["GHSA-AAAA-AAAA-AAAA", "GHSA-BBBB-BBBB-BBBB"],
  captured_at: "2026-01-01T00:00:00Z",
};

const config: DependabotConfigCheck = {
  dependabot_yml_present: true,
  npm_ecosystem_configured: true,
  sample_subject_monitored: true,
  schedule_interval: "daily",
};

const advisories: SecurityAdvisory[] = [
  {
    ghsa_id: "GHSA-AAAA-AAAA-AAAA",
    summary: "Test advisory A",
    severity: "high",
    state: "published",
  },
  {
    ghsa_id: "GHSA-BBBB-BBBB-BBBB",
    summary: "Test advisory B",
    severity: "medium",
    state: "published",
  },
];

describe("dependabotMetrics", () => {
  it("scores 100 when no new advisories and dependabot configured", () => {
    const metrics = computeMetrics(advisories, baseline, config);
    expect(metrics.continuous_monitoring_score).toBe(100);
    expect(metrics.alert_signal).toBe(0);
    expect(metrics.dependabot_enabled).toBe(true);
    expect(metrics.monitoring_active).toBe(true);
  });

  it("penalizes new advisories via alert_signal", () => {
    const withNew: SecurityAdvisory[] = [
      ...advisories,
      {
        ghsa_id: "GHSA-NEW1-NEW1-NEW1",
        summary: "New advisory",
        severity: "critical",
        state: "published",
      },
    ];
    const metrics = computeMetrics(withNew, baseline, config);
    expect(metrics.alert_signal).toBe(1);
    expect(metrics.continuous_monitoring_score).toBe(80);
  });

  it("builds metric row at 100/100", () => {
    const metrics = computeMetrics(advisories, baseline, config);
    const rows = buildMetricRows(metrics);
    expect(rows).toHaveLength(1);
    expect(rows[0].l4_classification).toBe("Continuous Dependency Monitoring");
    expect(rows[0].score).toBe(100);
    expect(rows[0].covered).toBe("yes");
  });
});
