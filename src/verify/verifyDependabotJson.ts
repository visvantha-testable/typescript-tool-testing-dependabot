import { readFileSync, existsSync } from "node:fs";
import type { DependabotOutput } from "../types/dependabotTypes.js";

export function verifyDependabotJson(jsonPath: string): number {
  if (!existsSync(jsonPath)) {
    console.error(`FAIL: ${jsonPath} not found`);
    return 1;
  }

  const data = JSON.parse(readFileSync(jsonPath, "utf-8")) as DependabotOutput & {
    output_complete?: boolean;
    metric_coverage_complete?: boolean;
    totals?: Record<string, unknown>;
    platform_totals?: Record<string, unknown>;
    "Real-Time Alerting"?: number;
  };

  const errors: string[] = [];

  if (data.status !== "READY") {
    errors.push(`status=${data.status}, expected READY`);
  }
  if (data.tool !== "Dependabot") {
    errors.push(`tool=${data.tool}, expected Dependabot`);
  }
  if (!data.output_complete) {
    errors.push("output_complete is not true");
  }
  if (!data.metric_coverage_complete) {
    errors.push("metric_coverage_complete is not true");
  }

  const requiredFields = [
    "continuous_monitoring_score",
    "alert_signal",
    "alert_response_rate_percent",
    "Continuous Dependency Monitoring",
    "Real-Time Alerting",
    "totals",
    "metrics",
    "dependabot_config",
    "security_advisories",
    "supplemental_raw_data",
  ] as const;

  for (const field of requiredFields) {
    if (!(field in data)) {
      errors.push(`missing root field ${field}`);
    }
  }

  if ((data.metrics?.length ?? 0) !== 1) {
    errors.push(`expected 1 metric row, got ${data.metrics?.length ?? 0}`);
  }

  const metric = data.metrics?.[0] as Record<string, unknown> | undefined;
  if (metric) {
    if (metric.score !== 100 || metric.covered !== "yes") {
      errors.push(`metric score/covered not 100/yes`);
    }
    if (metric.result !== "PASS") {
      errors.push("metric result is not PASS");
    }
    if (Number(metric.coverage_percent) < 100) {
      errors.push("metric coverage_percent below 100");
    }
    if (Number(metric.platform_ratio) < 100) {
      errors.push("metric platform_ratio below 100");
    }
  }

  const totals = data.totals ?? data.platform_totals;
  if (!totals) {
    errors.push("missing totals block");
  } else if (Number(totals.continuous_monitoring_ratio) < 100) {
    errors.push("totals.continuous_monitoring_ratio below 100 (1/100 bug risk)");
  }

  if (Number(data["Continuous Dependency Monitoring"]) < 100) {
    errors.push("root Continuous Dependency Monitoring below 100");
  }
  if (Number(data["Real-Time Alerting"]) < 100) {
    errors.push("root Real-Time Alerting below 100");
  }

  if (!data.dependabot_config?.dependabot_yml_present) {
    errors.push(".github/dependabot.yml not detected");
  }
  if ((data.security_advisories?.length ?? 0) === 0) {
    errors.push("security_advisories array is empty");
  }

  if (errors.length > 0) {
    console.error("FAIL: dependabot.json incomplete:");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    return 1;
  }

  console.log("OK: dependabot.json verified — Continuous Dependency Monitoring 100/100");
  return 0;
}
