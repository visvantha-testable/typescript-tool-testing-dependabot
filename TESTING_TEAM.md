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
| `config/platform_trigger.json` | Trigger command and required fields |
| `config/golden_baseline_advisories.json` | Baseline GHSA IDs for alert_signal=0 |
| `.github/dependabot.yml` | Dependabot npm monitoring config |

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
