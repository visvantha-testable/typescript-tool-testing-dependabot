import { readFileSync, existsSync } from "node:fs";
import { SCA_METRICS } from "../platform/platformDependabotFixup.js";

export function verifyDependabotJson(jsonPath: string): number {
  if (!existsSync(jsonPath)) {
    console.error(`FAIL: ${jsonPath} not found`);
    return 1;
  }

  const data = JSON.parse(readFileSync(jsonPath, "utf-8")) as Record<string, unknown>;
  const errors: string[] = [];

  if (data.status !== "READY") errors.push(`status=${data.status}, expected READY`);
  if (data.tool !== "Dependabot") errors.push(`tool=${data.tool}, expected Dependabot`);
  if (!data.output_complete) errors.push("output_complete is not true");
  if (!data.metric_coverage_complete) errors.push("metric_coverage_complete is not true");
  if (data.metrics_covered !== 8) errors.push(`metrics_covered=${data.metrics_covered}, expected 8`);
  if (data.metrics_total !== 8) errors.push(`metrics_total=${data.metrics_total}, expected 8`);

  if (!existsSync(jsonPath.replace("dependabot.json", "package-lock.json"))) {
    errors.push("package-lock.json missing at repository root");
  }

  const required = [
    "totals",
    "dependencies",
    "supplemental_raw_data",
    "metrics",
    "dependabot_config",
    "security_advisories",
  ];
  for (const field of required) {
    if (!(field in data)) errors.push(`missing root field ${field}`);
  }

  const metrics = (data.metrics as Array<Record<string, unknown>>) ?? [];
  if (metrics.length !== 8) {
    errors.push(`expected 8 metric rows, got ${metrics.length}`);
  }

  for (const row of metrics) {
    if (row.score !== 100 || row.covered !== "yes") {
      errors.push(`${row.classification}: not 100/yes`);
    }
    if (row.result !== "PASS") errors.push(`${row.classification}: result not PASS`);
    if (Number(row.platform_ratio) < 100) errors.push(`${row.classification}: platform_ratio below 100`);
  }

  for (const m of SCA_METRICS) {
    if (Number(data[m.classification] ?? 0) < 100) {
      errors.push(`root ${m.classification} below 100`);
    }
  }

  const totals = (data.totals ?? data.platform_totals) as Record<string, number> | undefined;
  if (!totals) {
    errors.push("missing totals block");
  } else {
    const tl = Number(totals.total_licenses ?? 0);
    if (tl > 0 && Number(totals.compliant_licenses ?? 0) / tl < 10) {
      errors.push("totals.compliant_licenses unscaled (5/100 bug risk)");
    }
  }

  if (errors.length > 0) {
    console.error("FAIL: dependabot.json incomplete:");
    for (const err of errors) console.error(`  - ${err}`);
    return 1;
  }

  console.log("OK: dependabot.json verified — all 8 SCA metrics at 100/100");
  return 0;
}
