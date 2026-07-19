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
    const alerts = JSON.parse(readFileSync(rawPath, "utf-8")) as unknown[];
    if (!Array.isArray(alerts) || alerts.length === 0) {
      errors.push("dependabot_alerts_raw.json is empty — GitHub has not generated alerts yet");
    }
  }

  if (existsSync(validationPath)) {
    const validation = JSON.parse(readFileSync(validationPath, "utf-8")) as {
      fully_supported?: boolean;
      api_http_status?: number;
    };
    if (validation.api_http_status !== 200) {
      errors.push(`API status ${validation.api_http_status}, expected 200`);
    }
    if (!validation.fully_supported) {
      errors.push("Continuous Dependency Monitoring not fully supported (no real alerts)");
    }
  }

  if (errors.length > 0) {
    console.error("FAIL: Dependabot alerts validation:");
    for (const err of errors) console.error(`  - ${err}`);
    return 1;
  }

  console.log("OK: Dependabot Alerts API returned real security alerts");
  return 0;
}

async function main(): Promise<void> {
  process.exit(verifyDependabotAlerts());
}

main();
