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

  return {
    testing_type: "Security White-box Testing",
    classification: "Dependency Risk (SCA)",
    metric: "Continuous Dependency Monitoring",
    capability: "Real-Time Alerting",
    primary_tool: "GitHub Dependabot Alerts API",
    supported: fullySupported ? "Yes" : "No",
    directly_emitted: "No",
    derived: fullySupported ? "Yes" : "No",
    evidence: fullySupported
      ? "Dependabot alert JSON successfully retrieved"
      : "Dependabot alert JSON not yet available",
    comments: fullySupported
      ? "Monitoring validated using live Dependabot alerts"
      : apiOk
        ? "API reachable; wait for GitHub Dependency Graph scan after push."
        : "Verify GITHUB_TOKEN scopes and Dependabot alert settings.",
    real_time_alerting: fullySupported ? "PASS" : "FAIL",
    fully_supported: fullySupported,
    dependabot_config_detected: config.dependabot_yml_present && config.npm_ecosystem_configured,
    dependency_graph_available: true,
    vulnerable_dependencies_present: npmCheck.intentionally_vulnerable_count > 0,
    dependabot_scan_completed: alertsPresent,
    api_http_status: fetchResult.http_status,
    alert_count: fetchResult.alert_count,
  };
}
