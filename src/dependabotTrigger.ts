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

  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  writeFileSync(
    join(ARTIFACTS_DIR, "security_advisories.json"),
    JSON.stringify(advisories, null, 2),
    "utf-8",
  );

  const metrics = computeMetrics(advisories, baseline, config);
  const output = buildOutput(advisories, baseline, config, metrics);

  writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`Wrote ${OUTPUT_PATH}`);

  if (!options.skipVerify) {
    const code = verifyDependabotJson(OUTPUT_PATH);
    if (code !== 0) {
      return code;
    }
  }

  const all100 = output.metrics.every((m) => m.score === 100 && m.covered === "yes");
  console.log(
    `\nTRIGGER COMPLETE: dependabot.json ready — 1 metric, 100/100=${all100}`,
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
