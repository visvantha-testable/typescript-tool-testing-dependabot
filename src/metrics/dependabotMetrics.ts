import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type {
  AdvisoryBaseline,
  DependabotConfigCheck,
  DependabotMetrics,
  MetricRow,
  SecurityAdvisory,
} from "../types/dependabotTypes.js";

export function checkDependabotConfig(repoRoot: string): DependabotConfigCheck {
  const dependabotPath = join(repoRoot, ".github", "dependabot.yml");
  const present = existsSync(dependabotPath);
  if (!present) {
    return {
      dependabot_yml_present: false,
      npm_ecosystem_configured: false,
      sample_subject_monitored: false,
      schedule_interval: "none",
    };
  }

  const content = readFileSync(dependabotPath, "utf-8");
  const npmConfigured = content.includes('package-ecosystem: "npm"');
  const sampleMonitored = content.includes("/sample_subject");
  const intervalMatch = content.match(/interval:\s*"(\w+)"/);
  return {
    dependabot_yml_present: true,
    npm_ecosystem_configured: npmConfigured,
    sample_subject_monitored: sampleMonitored,
    schedule_interval: intervalMatch?.[1] ?? "unknown",
  };
}

export function computeMetrics(
  advisories: SecurityAdvisory[],
  baseline: AdvisoryBaseline,
  config: DependabotConfigCheck,
): DependabotMetrics {
  const currentIds = advisories.map((a) => a.ghsa_id).sort();
  const baselineSet = new Set(baseline.ghsa_ids);
  const newAdvisories = currentIds.filter((id) => !baselineSet.has(id));
  const alertSignal = newAdvisories.length;

  const dependabotEnabled =
    config.dependabot_yml_present && config.npm_ecosystem_configured;
  const monitoringActive =
    dependabotEnabled && config.schedule_interval !== "none";

  const alertResponseRate =
    alertSignal === 0 ? 100 : Math.max(0, 100 - alertSignal * 20);
  const continuousScore = computeContinuousScore(
    dependabotEnabled,
    monitoringActive,
    alertSignal,
    advisories.length > 0,
  );

  return {
    dependabot_enabled: dependabotEnabled,
    monitoring_active: monitoringActive,
    security_advisories_total: advisories.length,
    alert_signal: alertSignal,
    alert_response_rate_percent: alertResponseRate,
    new_advisories_count: newAdvisories.length,
    baseline_advisory_count: baseline.advisory_count,
    continuous_monitoring_score: continuousScore,
    continuous_monitoring_percent: continuousScore,
    api_status: advisories.length > 0 ? "OK" : "EMPTY",
    target_repository: baseline.repository,
    api_endpoint: baseline.api_endpoint,
  };
}

function computeContinuousScore(
  dependabotEnabled: boolean,
  monitoringActive: boolean,
  alertSignal: number,
  apiHasData: boolean,
): number {
  if (!dependabotEnabled || !monitoringActive || !apiHasData) {
    return 0;
  }
  if (alertSignal === 0) {
    return 100;
  }
  return Math.max(0, 100 - alertSignal * 20);
}

export function buildMetricRows(metrics: DependabotMetrics): MetricRow[] {
  const score = metrics.continuous_monitoring_score;
  const covered = score === 100 ? "yes" : score >= 65 ? "partial" : "no";
  return [
    {
      l4_classification: "Continuous Dependency Monitoring",
      l5_metric: "Real-Time Alerting",
      field: "continuous_monitoring_score",
      value: score,
      score,
      covered,
    },
  ];
}

export function buildOutput(
  advisories: SecurityAdvisory[],
  baseline: AdvisoryBaseline,
  config: DependabotConfigCheck,
  metrics: DependabotMetrics,
): import("../types/dependabotTypes.js").DependabotOutput {
  const rows = buildMetricRows(metrics);
  const score = metrics.continuous_monitoring_score;
  return {
    status: score === 100 ? "READY" : "NOT_READY",
    tool: "Dependabot",
    strategy: "Security White-box Testing",
    category: "Dependency Risk (SCA)",
    metrics_total: 1,
    metrics_covered: score === 100 ? 1 : 0,
    target_repository: metrics.target_repository,
    api_endpoint: metrics.api_endpoint,
    dependabot_config: config,
    security_advisories: advisories,
    totals: {
      continuous_monitoring_score: score,
      alert_signal: metrics.alert_signal,
      alert_response_rate_percent: metrics.alert_response_rate_percent,
      security_advisories_total: metrics.security_advisories_total,
    },
    "Continuous Dependency Monitoring": score,
    continuous_monitoring_score: score,
    continuous_monitoring_percent: score,
    alert_signal: metrics.alert_signal,
    alert_response_rate_percent: metrics.alert_response_rate_percent,
    metrics: rows,
  };
}
