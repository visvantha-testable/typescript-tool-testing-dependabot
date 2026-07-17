# Platform Trigger — Dependabot

## Command

```bash
npm run trigger
```

Alternative:
```bash
npx tsx src/dependabotTrigger.ts
```

## What it does

1. Verifies `.github/dependabot.yml` monitors npm (`/` and `/sample_subject`)
2. Calls `GET /repos/nestjs/nest/security-advisories`
3. Compares advisories against `config/golden_baseline_advisories.json`
4. Computes `continuous_monitoring_score` (100 when `alert_signal == 0`)
5. Writes `dependabot.json` and verifies 100/100

## Environment

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | Optional; used for GitHub API in CI |

## Output

Primary file: **`dependabot.json`** at repository root.
