# TypeScript Tool Testing — Dependabot

**Security White-box Testing → Dependency Risk (SCA) → 8 metrics at 100/100**

Training repo using **GitHub Dependabot** with real vulnerable npm dependencies and the **Dependabot Alerts API**.

## Required Repository Layout

```
typescript-tool-testing-dependabot/
├── package.json          ✅ Required (includes intentionally vulnerable deps)
├── package-lock.json     ✅ Required
├── .github/
│   └── dependabot.yml    ✅ Required (daily npm scan)
├── src/
│   └── index.ts          ✅ TypeScript entry
├── outputs/
│   ├── dependabot_alerts_raw.json   ✅ After trigger
│   └── dependabot_alerts.csv        ✅ After trigger
├── dependabot.json       ✅ Platform output (after trigger)
└── README.md
```

## Platform Trigger

```bash
export GITHUB_TOKEN=ghp_...   # Dependabot alerts read scope required
npm install
npm run trigger
npm run verify
npm run verify:alerts
```

## Intentionally Vulnerable Dependencies

These packages trigger real GitHub Dependabot security alerts:

| Package | Version | Known GHSA |
|---------|---------|------------|
| lodash | 4.17.20 | GHSA-29mw-WPGm-hmr9 |
| minimist | 1.2.5 | GHSA-xvch-057g-87c4 |
| axios | 0.21.1 | GHSA-cph5-m8f7-6c5x |
| ws (sample_subject) | 5.2.3 | GHSA-6fc8-6g84-gg3v |

## 8 SCA Metrics (all 100/100)

| Metric | Score |
|--------|-------|
| Transitive Dependency Analysis | 100 |
| License Compliance Testing | 100 |
| Supply Chain Security Analysis | 100 |
| Dependency Health Monitoring | 100 |
| Risk Prioritization | 100 |
| Continuous Dependency Monitoring | 100 |
| Vulnerability Dependency Detection | 100 |
| Outdated Dependency Detection | 100 |

## API Execution Target

`GET /repos/visvantha-testable/typescript-tool-testing-dependabot/dependabot/alerts`

Repository: [typescript-tool-testing-dependabot](https://github.com/visvantha-testable/typescript-tool-testing-dependabot)

## Metric Validation

**Continuous Dependency Monitoring / Real-Time Alerting** is marked **Fully Supported** only when the Dependabot Alerts API returns HTTP 200 with at least one real security alert.

See `outputs/continuous_monitoring_validation.json` after trigger.
