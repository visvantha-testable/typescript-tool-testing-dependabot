# TypeScript Tool Testing — Dependabot

**Security White-box Testing → Dependency Risk (SCA) → Continuous Dependency Monitoring → Real-Time Alerting**

Training repo for **100/100** on the Dependabot metric using the GitHub Security Advisories API.

## Metric & Tool

| Field | Value |
|-------|-------|
| **L4 Classification** | Continuous Dependency Monitoring |
| **L5 Metric** | Real-Time Alerting |
| **Tool** | Dependabot |
| **API Trigger** | `GET /repos/nestjs/nest/security-advisories` |
| **Execution Target** | [nestjs/nest](https://github.com/nestjs/nest) |
| **Language** | TypeScript only |

## Platform Trigger

```bash
npm install
npm run trigger
```

Writes **`dependabot.json`** to repository root with `continuous_monitoring_score: 100`.

## Verify (Testing Team)

```bash
npm run verify
```

Expected:
```
OK: dependabot.json verified — Continuous Dependency Monitoring 100/100
```

## Project Layout

```
typescript-tool-testing-dependabot/
├── src/                          # TypeScript platform (trigger, metrics, API client)
├── sample_subject/               # TypeScript npm project monitored by Dependabot
├── .github/dependabot.yml        # Dependabot configuration
├── config/                       # Metric mapping + golden baseline
├── dependabot.json               # Primary platform output
└── tests/                        # Vitest unit tests
```

## References

- [Dependabot](https://docs.github.com/en/code-security/dependabot)
- [GitHub Security Advisories API](https://docs.github.com/en/rest/security-advisories/repository-advisories)
- [nestjs/nest](https://github.com/nestjs/nest) — advisory execution target
