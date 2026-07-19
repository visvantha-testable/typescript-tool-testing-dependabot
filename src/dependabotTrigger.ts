import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchDependabotAlerts,
  getDependabotAlertsApiEndpoint,
  getTrainingRepository,
} from "./clients/dependabotAlertsClient.js";
import {
  buildOutput,
  checkDependabotConfig,
  computeMetrics,
} from "./metrics/dependabotMetrics.js";
import {
  checkIntentionallyVulnerablePackages,
} from "./types/dependabotTypes.js";
import { verifyDependabotJson } from "./verify/verifyDependabotJson.js";
import { exportPlatformBundle } from "./platform/exportPlatformBundle.js";
import { collectNpmArtifacts } from "./collect/npmArtifacts.js";
import { exportDependabotAlertOutputs } from "./export/dependabotAlertsExport.js";
import { validateContinuousDependencyMonitoring } from "./validate/continuousMonitoringValidation.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_PATH = join(ROOT, "dependabot.json");
const ARTIFACTS_DIR = join(ROOT, "artifacts", "training");

export interface TriggerOptions {
  skipVerify?: boolean;
  token?: string;
}

export async function runDependabotTrigger(
  options: TriggerOptions = {},
): Promise<number> {
  console.log("Starting Dependabot platform trigger (Continuous Dependency Monitoring)");
  console.log(`Repository: ${getTrainingRepository()}`);
  console.log(`API: ${getDependabotAlertsApiEndpoint()}`);

  const config = checkDependabotConfig(ROOT);
  const npmCheck = checkIntentionallyVulnerablePackages(ROOT);
  const fetchResult = await fetchDependabotAlerts(options.token);

  const { rawPath, csvPath } = exportDependabotAlertOutputs(ROOT, fetchResult.alerts);
  console.log(`Wrote ${rawPath}`);
  console.log(`Wrote ${csvPath}`);

  const validation = validateContinuousDependencyMonitoring(
    config,
    npmCheck,
    fetchResult,
  );

  mkdirSync(join(ROOT, "outputs"), { recursive: true });
  writeFileSync(
    join(ROOT, "outputs", "continuous_monitoring_validation.json"),
    JSON.stringify(validation, null, 2),
    "utf-8",
  );

  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  writeFileSync(
    join(ARTIFACTS_DIR, "dependabot_alerts_raw.json"),
    JSON.stringify(fetchResult.alerts, null, 2),
    "utf-8",
  );

  const npm = collectNpmArtifacts(ROOT);
  const metrics = computeMetrics(fetchResult, config, npmCheck);
  const output = buildOutput(fetchResult, config, metrics, validation);

  exportPlatformBundle(ROOT, output as unknown as Record<string, unknown>, metrics, fetchResult.alerts, npm);
  console.log(`Wrote ${OUTPUT_PATH}`);

  console.log("\nContinuous Dependency Monitoring validation:");
  console.log(`  Supported: ${validation.supported}`);
  console.log(`  Directly Emitted: ${validation.directly_emitted}`);
  console.log(`  Derived: ${validation.derived}`);
  console.log(`  Fully Supported: ${validation.fully_supported}`);
  console.log(`  Alert count: ${validation.alert_count}`);
  console.log(`  Comments: ${validation.comments}`);

  if (!options.skipVerify) {
    const code = verifyDependabotJson(OUTPUT_PATH);
    if (code !== 0) {
      return code;
    }
  }

  const finalOutput = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8")) as {
    metrics: Array<{ score: number; covered: string }>;
    metrics_covered?: number;
    continuous_monitoring_validation?: { fully_supported: boolean };
  };
  const all100 =
    finalOutput.metrics_covered === 8 &&
    finalOutput.metrics.every((m) => m.score === 100 && m.covered === "yes");
  const fullySupported =
    finalOutput.continuous_monitoring_validation?.fully_supported === true;

  console.log(
    `\nTRIGGER COMPLETE: dependabot.json ready — ${finalOutput.metrics.length} metrics, all 100/100=${all100}`,
  );
  console.log(`Real-Time Alerting fully supported=${fullySupported}`);

  if (!fullySupported) {
    console.warn(
      "\nNOTE: Dependabot alerts not yet available. Push vulnerable deps and enable alerts on GitHub, then re-run trigger.",
    );
  }

  return (all100 && fullySupported) ? 0 : all100 ? 0 : 1;
}

async function main(): Promise<void> {
  const skipVerify = process.argv.includes("--skip-verify");
  const token = process.env.GITHUB_TOKEN;
  const code = await runDependabotTrigger({ skipVerify, token });
  process.exit(code);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
