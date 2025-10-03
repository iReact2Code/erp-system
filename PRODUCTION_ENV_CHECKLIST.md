# Production Environment Checklist

Comprehensive reference for configuring and operating the application in production.

## 1. Environment Variables

| Variable                   | Required    | Description                                 | Example                           | Rotation Strategy                          |
| -------------------------- | ----------- | ------------------------------------------- | --------------------------------- | ------------------------------------------ |
| NODE_ENV                   | yes         | Runtime environment indicator               | production                        | N/A                                        |
| DATABASE_URL               | yes         | Prisma database connection string           | postgres://user:pass@host:5432/db | Rotate credentials annually / on incident  |
| JWT_ACCESS_SECRET          | yes         | Secret for signing access tokens            | (32+ random chars)                | Rotate every 90 days (dual secret overlap) |
| JWT_REFRESH_SECRET         | yes         | Secret for signing refresh tokens           | (32+ random chars)                | Rotate every 90 days (staggered)           |
| RATE_LIMIT_WINDOW_MS       | no          | Rate limit window override                  | 60000                             | Adjust via deploy                          |
| RATE_LIMIT_MAX             | no          | Max requests per window                     | 100                               | Adjust via deploy                          |
| BRUTE_FORCE_MAX_ATTEMPTS   | no          | Login attempts before lock                  | 5                                 | Adjust via deploy                          |
| BRUTE_FORCE_WINDOW_MS      | no          | Brute force counting window                 | 900000                            | Adjust via deploy                          |
| BRUTE_FORCE_LOCK_MS        | no          | Lock duration after limit                   | 900000                            | Adjust via deploy                          |
| ACCESS_TOKEN_TTL_MIN       | no          | Access token lifetime (minutes)             | 15                                | Shorten if risk event                      |
| REFRESH_TOKEN_TTL_DAYS     | no          | Refresh token lifetime (days)               | 7                                 | Shorten if risk event                      |
| LOG_LEVEL                  | no          | Minimum log level (debug/info/...)          | info                              | Immediate via env change                   |
| LOG_PRETTY                 | no          | Force pretty logs in prod (not recommended) | 0                                 | N/A                                        |
| ALLOWED_ORIGINS            | yes\*       | Comma list of allowed CORS origins          | https://app.example.com           | Update when adding domains                 |
| ENABLE_METRICS             | no          | Toggle metrics collection                   | 1                                 | Immediate                                  |
| FLAG_EXPERIMENTAL_CACHING  | no          | Feature flag override                       | true                              | Immediate                                  |
| FLAG_NEW_DASHBOARD_WIDGETS | no          | Feature flag override                       | false                             | Immediate                                  |
| SNYK_TOKEN                 | no          | Snyk API token for security scans           | (redacted)                        | Rotate per org policy                      |
| REDIS_URL                  | no (future) | External cache / rate limit store           | redis://...                       | Rotate password quarterly                  |
| PORT                       | no          | Runtime port (if not default)               | 3000                              | N/A                                        |

(\*) If omitted defaults to localhost only; set explicitly in production.

## 2. Secrets Management

- Store secrets in a managed secrets system (e.g., AWS SSM Parameter Store, Vault, Doppler, KMS-backed secrets).
- Never commit secrets to VCS.
- Use separate secrets for staging vs production (no sharing).
- Implement dual-secret rotation for JWT secrets:
  1. Introduce new secret as `JWT_ACCESS_SECRET_NEXT`.
  2. Modify verification to accept both old + next for overlap window.
  3. After overlap period, promote NEXT to primary and remove old.

## 3. Build & Deployment

- Ensure `npm ci` used (lockfile integrity).
- Run CI suite (lint, typecheck, tests, build) green before deploy.
- Apply migrations with `npx prisma migrate deploy`.
- Post-deploy smoke test critical endpoints: `/api/_internal/health`, login, a sample CRUD roundtrip.

## 4. Logging & Monitoring

- Forward stdout/stderr to centralized log aggregation (e.g., CloudWatch, ELK, Loki).
- Set alert on error rate: > X errors per 5 min window.
- Track p95 request latency; alert if > threshold (e.g., 800ms) sustained 15 min.
- Monitor rate limit rejections spikes (potential abuse patterns).

## 5. Metrics & Dashboards

Recommended panels:

- Request rate (per route)
- Error rate by code
- Latency histogram (p50/p95/p99)
- Cache hit vs miss (when cache adapter added)
- Auth failures vs successes
- Brute force lock events count

## 6. Security Controls

- CSP nonce active (verify header includes `Content-Security-Policy`).
- HSTS enabled (`Strict-Transport-Security`).
- Frame denial (`X-Frame-Options: DENY`).
- Confirm no secrets in logs (spot check).
- Validate dependency scan results before release (npm audit / Snyk).

## 7. Backups & Disaster Recovery

- Automated daily snapshot and weekly logical dump configured.
- Recovery time objective (RTO) documented (e.g., < 30 min).
- Recovery point objective (RPO) documented (e.g., < 15 min data loss).
- Quarterly restore drill executed & logged.

## 8. Performance & Capacity

- Load test baseline stored (RPS, latency) for regression comparison.
- Track DB connection usage (Prisma connection pool sizing).
- Plan vertical/horizontal scaling triggers (CPU >70% sustained, memory >75%).

## 9. Operational Runbooks

- Incident response: define severity levels & escalation path.
- Rollback: pointer to `DATA_BACKUP_MIGRATION.md` procedures.
- Access request process for DB / production logs.

## 10. Deployment Checklist (Pre-Release)

| Item                            | Status |
| ------------------------------- | ------ |
| CI pipeline green               | ☐      |
| Migrations generated & reviewed | ☐      |
| Security scan reviewed          | ☐      |
| ENV diff vs template reconciled | ☐      |
| Secrets present in manager      | ☐      |
| Feature flags in intended state | ☐      |
| Rollback snapshot taken         | ☐      |
| Smoke tests passed post-deploy  | ☐      |

## 11. Post-Incident Checklist

- Root cause analysis (RCA) documented within 48h.
- Action items tracked with owners & due dates.
- Update monitoring / alerts if gap identified.

## 12. Future Enhancements

- Add structured secret rotation helper script.
- Implement dual-signing JWT strategy for seamless rotation.
- Add automated config drift detection (ENV template vs runtime).
- Integrate license scanning & SBOM export.

---

Owner: Platform / DevOps. Review quarterly or after major infra changes.
