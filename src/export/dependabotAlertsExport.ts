import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { DependabotAlert } from "../types/dependabotTypes.js";

const CSV_HEADERS = [
  "Alert ID",
  "Dependency Name",
  "Ecosystem",
  "Manifest Path",
  "Severity",
  "CVE",
  "GHSA",
  "Vulnerable Version",
  "First Patched Version",
  "Alert State",
  "Advisory Summary",
  "Created Date",
  "Updated Date",
] as const;

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function extractCve(alert: DependabotAlert): string {
  return alert.security_advisory?.cve_id ?? "";
}

function extractGhsa(alert: DependabotAlert): string {
  return alert.security_advisory?.ghsa_id ?? "";
}

function extractVulnerableVersion(alert: DependabotAlert): string {
  return (
    alert.security_vulnerability?.vulnerable_version_range ??
    alert.security_advisory?.vulnerabilities?.[0]?.vulnerable_version_range ??
    ""
  );
}

function extractFirstPatchedVersion(alert: DependabotAlert): string {
  return (
    alert.security_vulnerability?.first_patched_version?.identifier ??
    alert.security_advisory?.vulnerabilities?.[0]?.first_patched_version?.identifier ??
    ""
  );
}

export function alertToCsvRow(alert: DependabotAlert): string[] {
  return [
    String(alert.number),
    alert.dependency?.package?.name ?? "",
    alert.dependency?.package?.ecosystem ?? "",
    alert.dependency?.manifest_path ?? "",
    alert.security_vulnerability?.severity ?? alert.security_advisory?.severity ?? "",
    extractCve(alert),
    extractGhsa(alert),
    extractVulnerableVersion(alert),
    extractFirstPatchedVersion(alert),
    alert.state ?? "",
    alert.security_advisory?.summary ?? "",
    alert.created_at ?? "",
    alert.updated_at ?? "",
  ];
}

export function alertsToCsv(alerts: DependabotAlert[]): string {
  const rows = alerts.map((alert) =>
    alertToCsvRow(alert).map((cell) => escapeCsv(cell)).join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n") + (rows.length > 0 ? "\n" : "");
}

export function exportDependabotAlertOutputs(
  repoRoot: string,
  alerts: DependabotAlert[],
  rawResponse: string,
): { rawPath: string; csvPath: string } {
  const outputsDir = join(repoRoot, "outputs");
  mkdirSync(outputsDir, { recursive: true });

  const rawPath = join(outputsDir, "dependabot_alerts_raw.json");
  const csvPath = join(outputsDir, "dependabot_alerts.csv");

  writeFileSync(rawPath, rawResponse, "utf-8");
  writeFileSync(csvPath, alertsToCsv(alerts), "utf-8");

  return { rawPath, csvPath };
}
