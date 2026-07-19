import type {
  ContinuousMonitoringValidation,
  DependabotAlertsFetchResult,
  DependabotConfigCheck,
  NpmVulnerabilityCheck,
} from "../types/dependabotTypes.js";

export function validateContinuousDependencyMonitoring(
  config: DependabotConfigCheck,
  npmCheck: NpmVulnerabilityCheck,
  fetchResult: DependabotAlertsFetchResult,
): ContinuousMonitoringValidation {
  const alertsPresent = fetchResult.alert_count > 0;
  const apiOk = fetchResult.http_status === 200;
  const fullySupported = apiOk && alertsPresent;

  const evidence: string[] = [
    `dependabot_yml_present=${config.dependabot_yml_present}`,
    `npm_ecosystem_configured=${config.npm_ecosystem_configured}`,
    `schedule_interval=${config.schedule_interval}`,
    `intentionally_vulnerable_packages=${npmCheck.intentionally_vulnerable_count}`,
    `dependabot_alerts_api_status=${fetchResult.http_status}`,
    `dependabot_alerts_count=${fetchResult.alert_count}`,
    `api_endpoint=${fetchResult.api_endpoint}`,
  ];

  return {
    testing_type: "Security White-box Testing",
    classification: "Dependency Risk (SCA)",
    metric: "Continuous Dependency Monitoring",
    kpi: "Real-Time Alerting",
    supported: fullySupported ? "Supported" : apiOk ? "Partially Supported" : "Not Supported",
    directly_emitted: alertsPresent ? "Yes" : "No",
    derived: alertsPresent ? "No" : "Configuration-only (alerts pending GitHub scan)",
    evidence: evidence.join("; "),
    comments: fullySupported
      ? "Dependabot Alerts API returned HTTP 200 with real security alerts — metric fully validated."
      : apiOk
        ? "API reachable but no alerts yet. After push, wait for GitHub Dependency Graph + Dependabot scan (typically minutes to hours)."
        : "Dependabot Alerts API did not return HTTP 200. Verify GITHUB_TOKEN scopes and repository alert settings.",
    fully_supported: fullySupported,
    dependabot_config_detected: config.dependabot_yml_present && config.npm_ecosystem_configured,
    dependency_graph_available: true,
    vulnerable_dependencies_present: npmCheck.intentionally_vulnerable_count > 0,
    dependabot_scan_completed: alertsPresent,
    api_http_status: fetchResult.http_status,
    alert_count: fetchResult.alert_count,
  };
}
