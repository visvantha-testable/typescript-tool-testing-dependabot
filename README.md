# TypeScript Tool Testing — Dependabot

**Security White-box Testing → Dependency Risk (SCA) → 8 metrics at 100/100**

Training repo using **Dependabot** + GitHub Security Advisories API.

## Required Repository Layout

```
typescript-tool-testing-dependabot/
├── package.json          ✅ Required
├── package-lock.json     ✅ Required
├── .github/
│   └── dependabot.yml    ✅ Required
├── src/
│   └── index.ts          ✅ TypeScript entry
├── dependabot.json       ✅ Platform output (after trigger)
└── README.md
```

## Platform Trigger

```bash
npm install
npm run trigger
npm run verify
```

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

`GET /repos/nestjs/nest/security-advisories` on [nestjs/nest](https://github.com/nestjs/nest)
