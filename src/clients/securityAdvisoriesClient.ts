import { execFileSync } from "node:child_process";
import type { SecurityAdvisory } from "../types/dependabotTypes.js";

const DEFAULT_REPO = "nestjs/nest";
const API_PATH = "/repos/nestjs/nest/security-advisories";

export function getApiEndpoint(): string {
  return `GET ${API_PATH}`;
}

export function getTargetRepository(): string {
  return DEFAULT_REPO;
}

export async function fetchSecurityAdvisories(
  token?: string,
): Promise<SecurityAdvisory[]> {
  const effectiveToken = token ?? process.env.GITHUB_TOKEN;
  if (effectiveToken) {
    return fetchViaHttp(effectiveToken);
  }
  try {
    return fetchViaGhCli();
  } catch {
    return fetchPublic();
  }
}

function fetchViaGhCli(): SecurityAdvisory[] {
  const output = execFileSync(
    "gh",
    ["api", `repos/${DEFAULT_REPO}/security-advisories`],
    { encoding: "utf-8" },
  );
  return JSON.parse(output) as SecurityAdvisory[];
}

async function fetchPublic(): Promise<SecurityAdvisory[]> {
  const response = await fetch(
    `https://api.github.com/repos/${DEFAULT_REPO}/security-advisories`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `GitHub Security Advisories API failed: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as SecurityAdvisory[];
}

async function fetchViaHttp(token: string): Promise<SecurityAdvisory[]> {
  const response = await fetch(
    `https://api.github.com/repos/${DEFAULT_REPO}/security-advisories`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `GitHub Security Advisories API failed: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as SecurityAdvisory[];
}

export function extractGhsaIds(advisories: SecurityAdvisory[]): string[] {
  return advisories.map((a) => a.ghsa_id).sort();
}
