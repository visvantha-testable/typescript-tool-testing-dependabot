# Platform Trigger — Dependabot Alerts API

## Command

```bash
export GITHUB_TOKEN=ghp_...   # PAT with Dependabot alerts (read), repo metadata, contents
npm run trigger
npm run verify
npm run verify:alerts
```

Alternative:
```bash
npx tsx src/dependabotTrigger.ts
```

## What it does

1. Verifies `.github/dependabot.yml` monitors npm daily (`/` and `/sample_subject`)
2. Confirms intentionally vulnerable packages in `config/target_repo.json`
3. Calls `GET /repos/visvantha-testable/typescript-tool-testing-dependabot/dependabot/alerts`
4. Saves raw JSON → `outputs/dependabot_alerts_raw.json` (unmodified API response array)
5. Parses alerts → `outputs/dependabot_alerts.csv`
6. Validates **Continuous Dependency Monitoring / Real-Time Alerting** metric
7. Writes `dependabot.json` and verifies 8/8 SCA metrics at 100/100

## Environment

| Variable | Purpose |
|----------|---------|
| `GITHUB_TOKEN` | **Required** — PAT with Dependabot alerts read + repo read |
| `USE_GH_CLI` | Set to `1` to fetch alerts via `gh api --paginate` instead of fetch |

## GitHub repository settings

After pushing vulnerable dependencies:

1. Enable **Dependabot alerts**: Settings → Code security → Dependabot → Dependabot alerts
2. Enable **Dependency graph** (default for public repos)
3. Wait for GitHub to scan (typically minutes to hours after push)
4. Re-run `npm run trigger` and `npm run verify:alerts`

Enable alerts via CLI:
```bash
gh api -X PUT repos/visvantha-testable/typescript-tool-testing-dependabot/vulnerability-alerts
```

## Output files

| File | Description |
|------|-------------|
| `outputs/dependabot_alerts_raw.json` | Raw Dependabot Alerts API JSON |
| `outputs/dependabot_alerts.csv` | Parsed alert fields |
| `outputs/continuous_monitoring_validation.json` | White-box metric validation |
| `dependabot.json` | Platform bundle (8 SCA metrics) |

## Success criteria

- HTTP 200 from Dependabot Alerts API
- At least one open alert for vulnerable deps (`lodash`, `minimist`, `axios`, `ws`)
- `npm run verify:alerts` passes
