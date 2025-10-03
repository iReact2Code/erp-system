# Operations Runbook

Central reference for day‑2 operations: monitoring, incident handling, maintenance, and routine tasks.

## 1. Environment Overview

| Layer           | Component                                                        |
| --------------- | ---------------------------------------------------------------- |
| App             | Next.js + Node runtime                                           |
| DB              | PostgreSQL (Prisma ORM)                                          |
| Auth            | JWT (access 15m, refresh 7d)                                     |
| Cache (planned) | Redis optional                                                   |
| Metrics         | Custom in-process counters + latency histograms                  |
| Logging         | Structured JSON (prod) with requestId/traceId context            |
| Security        | CSP nonce, rate limiting, brute force protection, strict headers |

## 2. Health & Readiness

- Liveness: `/api/_internal/health` returns 200 if process alive.
- Readiness: `/api/_internal/ready` checks DB connectivity (extend with Redis later).
- Automate probes: configure platform to hit readiness on deploy.

## 3. Metrics & Monitoring

Expose internal metrics endpoint (if implemented) or integrate with external APM (future).
Recommended minimal SLO placeholders:
| Metric | Target |
|--------|--------|
| p95 latency (core API) | < 400ms |
| Error rate | < 1% of requests |
| Availability (monthly) | 99.5% |

## 4. Logging

- Production logs: JSON parseable.
- Sensitive keys redacted automatically (password|token|secret).
- Correlate requests using `requestId` / `traceId` fields.

## 5. Security Controls

| Control                | Detail                                             |
| ---------------------- | -------------------------------------------------- |
| Rate Limiting          | In-memory (pluggable) to mitigate abuse            |
| Brute Force Protection | Locks after 5 failed login attempts (15m release)  |
| CSP Nonce              | Per-request nonce removes need for `unsafe-inline` |
| Headers                | HSTS, X-Frame-Options=DENY, Referrer Policy, etc.  |
| Validation             | Zod + trim + sanitization layer                    |

## 6. Backups & Disaster Recovery

See `DATA_BACKUP_MIGRATION.md`.
Key actions quick list:

- Pre-deploy snapshot (automated or manual)
- Daily managed snapshot (retain >=7 days)
- Weekly logical dump test restore in staging

## 7. Deployment Checklist

| Step | Action                                                                     |
| ---- | -------------------------------------------------------------------------- |
| 1    | Ensure main is green in CI (lint, type, tests, coverage)                   |
| 2    | Review open security scan artifacts (npm audit, OSV)                       |
| 3    | Confirm no pending un-applied migrations locally (`prisma migrate status`) |
| 4    | Create release notes (changes, migrations, flags)                          |
| 5    | Deploy to staging & run smoke (auth, inventory, orders)                    |
| 6    | Promote to production                                                      |
| 7    | Post-deploy verify metrics, error rate, logs                               |

## 8. Incident Response

| Phase       | Action                                                 |
| ----------- | ------------------------------------------------------ |
| Detect      | Alert from monitoring (TODO integrate) or error spikes |
| Triage      | Categorize severity (user impact, data risk)           |
| Mitigate    | Roll forward fix OR rollback via snapshot restore      |
| Communicate | Internal status update; external if user-facing outage |
| Postmortem  | Within 48h: cause, timeline, actions, prevention       |

### Severity Levels (Template)

| Sev  | Description                          | Target Response   |
| ---- | ------------------------------------ | ----------------- |
| SEV1 | Full outage / data loss risk         | Immediate (pager) |
| SEV2 | Major functionality degraded         | < 30m             |
| SEV3 | Minor feature degraded / work-around | < 4h              |
| SEV4 | Cosmetic / low impact                | Backlog           |

## 9. Feature Flags Operations

- List current flags via `listFlags()` REPL or temporary endpoint.
- Remove deprecated flags after two release cycles.
- Emergency disable: set `FLAG_<NAME>=false` and restart.

## 10. Performance & Load

- Use `bench` scripts for quick local throughput sampling.
- Add k6 scenario (future) for capacity planning (RPS ramp, soak test).
- Watch for p95 latency regression >20% of baseline for 3 consecutive deploys.

## 11. Database Operations

| Task             | Command                            |
| ---------------- | ---------------------------------- |
| Apply migrations | `npx prisma migrate deploy`        |
| Status           | `npx prisma migrate status`        |
| Generate client  | `npx prisma generate`              |
| Reset (non-prod) | `npx prisma migrate reset --force` |

## 12. Secret Management

- Rotate JWT secret if suspected compromise (invalidate refresh tokens).
- Store secrets in managed vault / platform secret store; not in git.
- Immediately revoke leaked credentials; re-issue and redeploy.

## 13. Timeouts & Resilience

- Request timeout guard active (ENV configurable). Adjust cautiously after profiling.
- Add circuit breaker / retry (future) for external integrations.

## 14. Roadmap (Ops Enhancements)

| Item                                              | Priority |
| ------------------------------------------------- | -------- |
| Central metrics export (Prometheus/OpenTelemetry) | High     |
| Structured tracing (OpenTelemetry)                | High     |
| k6 load test pipeline                             | Medium   |
| Automated drift detection alert                   | Medium   |
| Slack/PagerDuty integration                       | Medium   |
| Auto license & vulnerability policy enforcement   | Low      |

## 15. Quick Commands (Reference)

```bash
# Run all quality gates
yarn lint && yarn typecheck && yarn test:coverage

# Apply migrations (prod deploy step)
npx prisma migrate deploy

# Audit dependencies (local)
npm run audit

# Security scan JSON artifact
git pull && # ensure up to date
```

---

Owned by Platform/Operations. Update as practices evolve.
