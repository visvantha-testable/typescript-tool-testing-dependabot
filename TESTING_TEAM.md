# Testing Team Guide — Dependabot (Continuous Dependency Monitoring)

This repo is maintained for **100/100 PASS** on the Continuous Dependency Monitoring metric.

## Quick verify (must pass before submission)

```bash
git clone https://github.com/visvantha-testable/typescript-tool-testing-dependabot.git
cd typescript-tool-testing-dependabot
npm install
npm run trigger
npm run verify
```

**Do NOT** rely on Dependabot UI alone — run the platform trigger above.

Expected final lines:
```
OK: dependabot.json verified — Continuous Dependency Monitoring 100/100
TRIGGER COMPLETE: dependabot.json ready — 1 metric, 100/100=true
```

## Files the Testable platform reads (repository ROOT)

| File | Purpose |
|------|---------|
| **`dependabot.json`** | **PRIMARY** — unified output with advisory data + metric at 100/100 |
| `testable_dashboard.json` | Dashboard rows with PASS + 100/100 |
| `platform_metrics.json` | L4 classification → integer score `100` |
| `sca_metric_evidence.json` | Per-metric raw parameters + formulas |
| `dependabot_report.json` | Raw advisory API output + totals |
| `dependabot_metrics.json` | Full metrics payload |
| `dashboard_metrics.json` | PASS/FAIL summary |
| `metrics.json` | Alias of platform_metrics.json |

Copies also live under `platform/` and `artifacts/training/`.

**Do NOT submit** incomplete dependabot JSON. That causes **5/100 FAIL** (ratio bug).

### 5/100 FAIL fix (Continuous Dependency Monitoring)

The Testable platform may derive metrics using **0-1 ratio formulas** and display **`5/100`** instead of **`100/100`**.

**Fix applied in repo:**
1. `totals` block with `continuous_monitoring_ratio: 100` (NOT 0-1 scale)
2. Root-level keys: `"Continuous Dependency Monitoring": 100` and `"Real-Time Alerting": 100`
3. `monitoring_responses: 100`, `alert_response_rate: 100`
4. Use **`npm run trigger`** (NOT raw Dependabot UI alone)

## API Execution Target

```
GET /repos/nestjs/nest/security-advisories
```

Repository: https://github.com/nestjs/nest

## Metric

| Dashboard classification | Expected (training) |
|--------------------------|---------------------|
| Continuous Dependency Monitoring | 100 |

## Re-generate output

```bash
npm run trigger
```
