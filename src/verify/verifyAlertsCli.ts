import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");

export function verifyDependabotAlerts(): number {
  const errors: string[] = [];

  const rawPath = join(ROOT, "outputs", "dependabot_alerts_raw.json");
  const csvPath = join(ROOT, "outputs", "dependabot_alerts.csv");
  const validationPath = join(ROOT, "outputs", "continuous_monitoring_validation.json");

  if (!existsSync(rawPath)) errors.push("outputs/dependabot_alerts_raw.json missing");
  if (!existsSync(csvPath)) errors.push("outputs/dependabot_alerts.csv missing");
  if (!existsSync(validationPath)) {
    errors.push("outputs/continuous_monitoring_validation.json missing");
  }

  if (existsSync(rawPath)) {
    const raw = readFileSync(rawPath, "utf-8").trim();
    if (!raw) {
      errors.push("dependabot_alerts_raw.json is empty");
    } else {
      const alerts = JSON.parse(raw) as unknown[];
      if (!Array.isArray(alerts) || alerts.length === 0) {
        errors.push("dependabot_alerts_raw.json has no alerts — GitHub scan may be pending");
      }
    }
  }

  if (existsSync(validationPath)) {
    const validation = JSON.parse(readFileSync(validationPath, "utf-8")) as {
      fully_supported?: boolean;
      api_http_status?: number;
      supported?: string;
      directly_emitted?: string;
      derived?: string;
      real_time_alerting?: string;
      evidence?: string;
    };
    if (validation.api_http_status !== 200) {
      errors.push(`API status ${validation.api_http_status}, expected 200`);
    }
    if (validation.supported !== "Yes") {
      errors.push(`supported=${validation.supported}, expected Yes`);
    }
    if (validation.directly_emitted !== "No") {
      errors.push(`directly_emitted=${validation.directly_emitted}, expected No`);
    }
    if (validation.derived !== "Yes") {
      errors.push(`derived=${validation.derived}, expected Yes`);
    }
    if (validation.real_time_alerting !== "PASS") {
      errors.push(`real_time_alerting=${validation.real_time_alerting}, expected PASS`);
    }
    if (!validation.fully_supported) {
      errors.push("Continuous Dependency Monitoring not fully supported");
    }
  }

  if (errors.length > 0) {
    console.error("FAIL: Dependabot alerts validation:");
    for (const err of errors) console.error(`  - ${err}`);
    return 1;
  }

  console.log("OK: Real-Time Alerting KPI PASS — live Dependabot alerts validated");
  return 0;
}

async function main(): Promise<void> {
  process.exit(verifyDependabotAlerts());
}

main();
