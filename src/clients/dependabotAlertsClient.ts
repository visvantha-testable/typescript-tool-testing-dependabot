import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DependabotAlert, DependabotAlertsFetchResult } from "../types/dependabotTypes.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const TARGET_CONFIG = join(ROOT, "config", "target_repo.json");

interface TargetConfig {
  training_repository: {
    owner: string;
    name: string;
    full_name: string;
    dependabot_alerts_api: string;
  };
}

export function getTrainingRepository(): string {
  const config = JSON.parse(readFileSync(TARGET_CONFIG, "utf-8")) as TargetConfig;
  return config.training_repository.full_name;
}

export function getDependabotAlertsApiEndpoint(): string {
  const config = JSON.parse(readFileSync(TARGET_CONFIG, "utf-8")) as TargetConfig;
  return config.training_repository.dependabot_alerts_api;
}

export async function fetchDependabotAlerts(
  token?: string,
): Promise<DependabotAlertsFetchResult> {
  const effectiveToken = token ?? process.env.GITHUB_TOKEN;
  if (!effectiveToken) {
    throw new Error(
      "GITHUB_TOKEN is required for Dependabot Alerts API (scope: security_events read or Dependabot alerts read)",
    );
  }

  if (process.env.USE_GH_CLI === "1") {
    return fetchViaGhCli();
  }

  return fetchViaHttp(effectiveToken);
}

async function fetchViaHttp(token: string): Promise<DependabotAlertsFetchResult> {
  const repo = getTrainingRepository();
  const alerts: DependabotAlert[] = [];
  let url: string | null =
    `https://api.github.com/repos/${repo}/dependabot/alerts?state=open&per_page=100`;
  let httpStatus = 0;

  while (url) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });
    httpStatus = response.status;
    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Dependabot Alerts API failed: ${response.status} ${response.statusText} — ${body}`,
      );
    }

    const page = (await response.json()) as DependabotAlert[];
    alerts.push(...page);
    url = parseNextLink(response.headers.get("link"));
  }

  return {
    http_status: httpStatus,
    api_endpoint: getDependabotAlertsApiEndpoint(),
    repository: repo,
    alerts,
    alert_count: alerts.length,
    fetched_at: new Date().toISOString(),
  };
}

function fetchViaGhCli(): DependabotAlertsFetchResult {
  const repo = getTrainingRepository();
  const output = execFileSync(
    "gh",
    ["api", `repos/${repo}/dependabot/alerts`, "-f", "state=open", "--paginate"],
    { encoding: "utf-8" },
  );
  const alerts = JSON.parse(output) as DependabotAlert[];
  return {
    http_status: 200,
    api_endpoint: getDependabotAlertsApiEndpoint(),
    repository: repo,
    alerts,
    alert_count: alerts.length,
    fetched_at: new Date().toISOString(),
  };
}

function parseNextLink(linkHeader: string | null): string | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
  return match?.[1] ?? null;
}
