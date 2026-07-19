import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface SecurityAdvisory {
  ghsa_id: string;
  cve_id?: string;
  summary: string;
  severity: string;
  state: string;
  published_at?: string;
  updated_at?: string;
  html_url?: string;
}

export interface AdvisoryBaseline {
  repository: string;
  api_endpoint: string;
  advisory_count: number;
  ghsa_ids: string[];
  captured_at: string;
}

export interface DependabotConfigCheck {
  dependabot_yml_present: boolean;
  npm_ecosystem_configured: boolean;
  sample_subject_monitored: boolean;
  schedule_interval: string;
  daily_schedule: boolean;
}

export interface DependabotAlertPackage {
  ecosystem: string;
  name: string;
}

export interface DependabotAlertDependency {
  package: DependabotAlertPackage;
  manifest_path?: string;
  scope?: string;
}

export interface DependabotAlertVulnerability {
  package?: DependabotAlertPackage;
  vulnerable_version_range?: string;
  first_patched_version?: { identifier?: string };
  severity?: string;
}

export interface DependabotAlertAdvisory {
  ghsa_id?: string;
  cve_id?: string;
  summary?: string;
  severity?: string;
  vulnerabilities?: DependabotAlertVulnerability[];
}

export interface DependabotAlert {
  number: number;
  state: string;
  dependency?: DependabotAlertDependency;
  security_advisory?: DependabotAlertAdvisory;
  security_vulnerability?: DependabotAlertVulnerability;
  url?: string;
  html_url?: string;
  created_at?: string;
  updated_at?: string;
  fixed_at?: string | null;
  dismissed_at?: string | null;
}

export interface DependabotAlertsFetchResult {
  http_status: number;
  api_endpoint: string;
  repository: string;
  alerts: DependabotAlert[];
  alert_count: number;
  fetched_at: string;
}

export interface NpmVulnerabilityCheck {
  intentionally_vulnerable_count: number;
  packages: Array<{ name: string; version: string; manifest: string }>;
}

export interface DependabotMetrics {
  dependabot_enabled: boolean;
  monitoring_active: boolean;
  dependabot_alerts_total: number;
  open_alerts_count: number;
  alert_signal: number;
  alert_response_rate_percent: number;
  new_alerts_count: number;
  baseline_alert_count: number;
  continuous_monitoring_score: number;
  continuous_monitoring_percent: number;
  api_status: string;
  target_repository: string;
  api_endpoint: string;
  metric_fully_supported: boolean;
}

export interface ContinuousMonitoringValidation {
  testing_type: string;
  classification: string;
  metric: string;
  kpi: string;
  supported: string;
  directly_emitted: string;
  derived: string;
  evidence: string;
  comments: string;
  fully_supported: boolean;
  dependabot_config_detected: boolean;
  dependency_graph_available: boolean;
  vulnerable_dependencies_present: boolean;
  dependabot_scan_completed: boolean;
  api_http_status: number;
  alert_count: number;
}

export interface MetricRow {
  l4_classification: string;
  l5_metric: string;
  field: string;
  value: number | boolean | string;
  score: number;
  covered: "yes" | "no" | "partial";
}

export interface DependabotOutput {
  status: "READY" | "NOT_READY";
  tool: "Dependabot";
  strategy: string;
  category: string;
  metrics_total: number;
  metrics_covered: number;
  output_complete?: boolean;
  metric_coverage_complete?: boolean;
  execution_status?: string;
  target_repository: string;
  api_endpoint: string;
  dependabot_config: DependabotConfigCheck;
  baseline_advisories?: AdvisoryBaseline;
  dependabot_alerts: DependabotAlert[];
  continuous_monitoring_validation?: ContinuousMonitoringValidation;
  supplemental_raw_data?: Record<string, unknown>;
  totals: Record<string, number | string>;
  "Continuous Dependency Monitoring": number;
  "Real-Time Alerting"?: number;
  continuous_monitoring_score: number;
  continuous_monitoring_percent: number;
  continuous_monitoring_ratio?: number;
  alert_signal: number;
  alert_response_rate_percent: number;
  alert_response_rate?: number;
  platform_metrics?: Record<string, number>;
  platform_scores?: Record<string, number>;
  metrics: MetricRow[] | Array<Record<string, unknown>>;
}

export function checkIntentionallyVulnerablePackages(repoRoot: string): NpmVulnerabilityCheck {
  const targetPath = join(repoRoot, "config", "target_repo.json");
  const config = JSON.parse(readFileSync(targetPath, "utf-8")) as {
    intentionally_vulnerable_packages?: Array<{
      name: string;
      version: string;
      manifest?: string;
    }>;
  };

  const packages = (config.intentionally_vulnerable_packages ?? []).map((pkg) => ({
    name: pkg.name,
    version: pkg.version,
    manifest: pkg.manifest ?? "package.json",
  }));

  return {
    intentionally_vulnerable_count: packages.length,
    packages,
  };
}
