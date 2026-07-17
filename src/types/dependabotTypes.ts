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
}

export interface DependabotMetrics {
  dependabot_enabled: boolean;
  monitoring_active: boolean;
  security_advisories_total: number;
  alert_signal: number;
  alert_response_rate_percent: number;
  new_advisories_count: number;
  baseline_advisory_count: number;
  continuous_monitoring_score: number;
  continuous_monitoring_percent: number;
  api_status: string;
  target_repository: string;
  api_endpoint: string;
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
  target_repository: string;
  api_endpoint: string;
  dependabot_config: DependabotConfigCheck;
  security_advisories: SecurityAdvisory[];
  totals: {
    continuous_monitoring_score: number;
    alert_signal: number;
    alert_response_rate_percent: number;
    security_advisories_total: number;
  };
  "Continuous Dependency Monitoring": number;
  continuous_monitoring_score: number;
  continuous_monitoring_percent: number;
  alert_signal: number;
  alert_response_rate_percent: number;
  metrics: MetricRow[];
}
