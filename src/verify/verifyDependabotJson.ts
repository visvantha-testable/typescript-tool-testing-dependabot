import { readFileSync, existsSync } from "node:fs";
import type { DependabotOutput } from "../types/dependabotTypes.js";

export function verifyDependabotJson(jsonPath: string): number {
  if (!existsSync(jsonPath)) {
    console.error(`FAIL: ${jsonPath} not found`);
    return 1;
  }

  const data = JSON.parse(readFileSync(jsonPath, "utf-8")) as DependabotOutput;

  if (data.status !== "READY") {
    console.error(`FAIL: status=${data.status}, expected READY`);
    return 1;
  }

  if (data.tool !== "Dependabot") {
    console.error(`FAIL: tool=${data.tool}, expected Dependabot`);
    return 1;
  }

  const requiredFields = [
    "continuous_monitoring_score",
    "alert_signal",
    "alert_response_rate_percent",
    "Continuous Dependency Monitoring",
    "totals",
    "metrics",
    "dependabot_config",
    "security_advisories",
  ] as const;

  for (const field of requiredFields) {
    if (!(field in data)) {
      console.error(`FAIL: missing root field ${field}`);
      return 1;
    }
  }

  if (data.metrics.length !== 1) {
    console.error(`FAIL: expected 1 metric, got ${data.metrics.length}`);
    return 1;
  }

  const metric = data.metrics[0];
  if (metric.score !== 100 || metric.covered !== "yes") {
    console.error(
      `FAIL: Continuous Dependency Monitoring not 100/100 (score=${metric.score}, covered=${metric.covered})`,
    );
    return 1;
  }

  if (!data.dependabot_config.dependabot_yml_present) {
    console.error("FAIL: .github/dependabot.yml not detected in output");
    return 1;
  }

  if (data.security_advisories.length === 0) {
    console.error("FAIL: security_advisories array is empty");
    return 1;
  }

  console.log("OK: dependabot.json verified — Continuous Dependency Monitoring 100/100");
  return 0;
}
