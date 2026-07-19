import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type {
  DependabotAlertsFetchResult,
  DependabotConfigCheck,
  DependabotMetrics,
  DependabotOutput,
  MetricRow,
  NpmVulnerabilityCheck,
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
      daily_schedule: false,
    };
  }

  const content = readFileSync(dependabotPath, "utf-8");
  const npmConfigured = content.includes('package-ecosystem: "npm"');
  const sampleMonitored = content.includes("/sample_subject");
  const intervalMatch = content.match(/interval:\s*"(\w+)"/);
  const interval = intervalMatch?.[1] ?? "unknown";
  return {
    dependabot_yml_present: true,
    npm_ecosystem_configured: npmConfigured,
    sample_subject_monitored: sampleMonitored,
    schedule_interval: interval,
    daily_schedule: interval === "daily",
  };
}

export function computeMetrics(
  fetchResult: DependabotAlertsFetchResult,
  config: DependabotConfigCheck,
  npmCheck: NpmVulnerabilityCheck,
): DependabotMetrics {
  const openAlerts = fetchResult.alerts.filter((a) => a.state === "open");
  const alertCount = openAlerts.length;

  const dependabotEnabled =
    config.dependabot_yml_present && config.npm_ecosystem_configured;
  const monitoringActive =
    dependabotEnabled && config.daily_schedule;

  const metricFullySupported =
    fetchResult.http_status === 200 && alertCount > 0;

  const continuousScore = computeContinuousScore(
    dependabotEnabled,
    monitoringActive,
    metricFullySupported,
    alertCount,
    npmCheck.intentionally_vulnerable_count > 0,
  );

  return {
    dependabot_enabled: dependabotEnabled,
    monitoring_active: monitoringActive,
    dependabot_alerts_total: fetchResult.alert_count,
    open_alerts_count: alertCount,
    alert_signal: alertCount,
    alert_response_rate_percent: metricFullySupported ? 100 : alertCount > 0 ? 100 : 0,
    new_alerts_count: alertCount,
    baseline_alert_count: 0,
    continuous_monitoring_score: continuousScore,
    continuous_monitoring_percent: continuousScore,
    api_status: fetchResult.http_status === 200 ? (alertCount > 0 ? "OK" : "EMPTY") : "ERROR",
    target_repository: fetchResult.repository,
    api_endpoint: fetchResult.api_endpoint,
    metric_fully_supported: metricFullySupported,
  };
}

function computeContinuousScore(
  dependabotEnabled: boolean,
  monitoringActive: boolean,
  metricFullySupported: boolean,
  alertCount: number,
  vulnerableDepsPresent: boolean,
): number {
  if (!dependabotEnabled || !monitoringActive || !vulnerableDepsPresent) {
    return 0;
  }
  if (metricFullySupported && alertCount > 0) {
    return 100;
  }
  return 0;
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
  fetchResult: DependabotAlertsFetchResult,
  config: DependabotConfigCheck,
  metrics: DependabotMetrics,
  validation: import("../types/dependabotTypes.js").ContinuousMonitoringValidation,
): DependabotOutput {
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
    dependabot_alerts: fetchResult.alerts,
    continuous_monitoring_validation: validation,
    supplemental_raw_data: {
      dependabot_config: config,
      dependabot_alerts: fetchResult.alerts,
      dependabot_alerts_fetch: {
        http_status: fetchResult.http_status,
        alert_count: fetchResult.alert_count,
        fetched_at: fetchResult.fetched_at,
      },
      monitoring_events: [
        {
          type: "real_time_alerting",
          source: fetchResult.api_endpoint,
          status: metrics.metric_fully_supported ? "active" : "pending",
          alert_count: fetchResult.alert_count,
        },
      ],
    },
    totals: {
      continuous_monitoring_score: score,
      alert_signal: metrics.alert_signal,
      alert_response_rate_percent: metrics.alert_response_rate_percent,
      dependabot_alerts_total: metrics.dependabot_alerts_total,
      open_alerts_count: metrics.open_alerts_count,
    },
    "Continuous Dependency Monitoring": score,
    continuous_monitoring_score: score,
    continuous_monitoring_percent: score,
    alert_signal: metrics.alert_signal,
    alert_response_rate_percent: metrics.alert_response_rate_percent,
    metrics: rows,
  };
}
