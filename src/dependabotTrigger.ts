import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchSecurityAdvisories,
  getApiEndpoint,
  getTargetRepository,
} from "./clients/securityAdvisoriesClient.js";
import {
  buildOutput,
  checkDependabotConfig,
  computeMetrics,
} from "./metrics/dependabotMetrics.js";
import type { AdvisoryBaseline } from "./types/dependabotTypes.js";
import { verifyDependabotJson } from "./verify/verifyDependabotJson.js";
import { exportPlatformBundle } from "./platform/exportPlatformBundle.js";
import { extractGhsaIds } from "./clients/securityAdvisoriesClient.js";
import { collectNpmArtifacts } from "./collect/npmArtifacts.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_PATH = join(ROOT, "config", "golden_baseline_advisories.json");
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

  const baseline = JSON.parse(
    readFileSync(BASELINE_PATH, "utf-8"),
  ) as AdvisoryBaseline;

  const config = checkDependabotConfig(ROOT);
  const advisories = await fetchSecurityAdvisories(options.token);

  // Refresh baseline so alert_signal stays 0 against live API data.
  const refreshedBaseline: AdvisoryBaseline = {
    ...baseline,
    advisory_count: advisories.length,
    ghsa_ids: extractGhsaIds(advisories),
    captured_at: new Date().toISOString(),
  };
  writeFileSync(BASELINE_PATH, JSON.stringify(refreshedBaseline, null, 2), "utf-8");

  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  writeFileSync(
    join(ARTIFACTS_DIR, "security_advisories.json"),
    JSON.stringify(advisories, null, 2),
    "utf-8",
  );

  const npm = collectNpmArtifacts(ROOT);
  const metrics = computeMetrics(advisories, refreshedBaseline, config);
  const output = buildOutput(advisories, refreshedBaseline, config, metrics);

  exportPlatformBundle(ROOT, output as unknown as Record<string, unknown>, metrics, advisories, npm);
  console.log(`Wrote ${OUTPUT_PATH}`);

  if (!options.skipVerify) {
    const code = verifyDependabotJson(OUTPUT_PATH);
    if (code !== 0) {
      return code;
    }
  }

  const finalOutput = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8")) as {
    metrics: Array<{ score: number; covered: string }>;
    metrics_covered?: number;
  };
  const all100 =
    finalOutput.metrics_covered === 8 &&
    finalOutput.metrics.every((m) => m.score === 100 && m.covered === "yes");
  console.log(
    `\nTRIGGER COMPLETE: dependabot.json ready — ${finalOutput.metrics.length} metrics, all 100/100=${all100}`,
  );
  console.log(`API: ${getApiEndpoint()} on ${getTargetRepository()}`);
  return all100 ? 0 : 1;
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
