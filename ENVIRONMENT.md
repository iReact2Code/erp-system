# Production Environment Configuration

This checklist documents required and optional environment variables and operational settings for production deployments.

## 1. Core Variables

| Variable                   | Required | Description                                   | Example                           |
| -------------------------- | -------- | --------------------------------------------- | --------------------------------- | ---- | ----- | ---- |
| NODE_ENV                   | Yes      | Execution mode                                | production                        |
| DATABASE_URL               | Yes      | Connection string for Postgres (or chosen DB) | postgres://user:pass@host:5432/db |
| JWT_SECRET                 | Yes      | HMAC secret for signing access/refresh JWTs   | (long random string)              |
| JWT_ACCESS_TTL_MIN         | No       | Override access token lifetime (minutes)      | 15                                |
| JWT_REFRESH_TTL_DAYS       | No       | Override refresh token lifetime (days)        | 7                                 |
| RATE_LIMIT_MAX             | No       | Requests per window per IP/user               | 100                               |
| RATE_LIMIT_WINDOW_MS       | No       | Sliding window size ms                        | 60000                             |
| LOGIN_BRUTE_MAX_ATTEMPTS   | No       | Lock threshold                                | 5                                 |
| LOGIN_BRUTE_WINDOW_MS      | No       | Attempts window ms                            | 900000                            |
| LOGIN_BRUTE_LOCK_MS        | No       | Lock duration ms                              | 900000                            |
| REQUEST_TIMEOUT_MS         | No       | Global API timeout (ms)                       | 10000                             |
| LOG_LEVEL                  | No       | debug                                         | info                              | warn | error | info |
| LOG_PRETTY                 | No       | Force pretty logs in dev                      | 1                                 |
| ENABLE_METRICS             | No       | Toggle metrics collection                     | 1                                 |
| FLAG_EXPERIMENTAL_CACHING  | No       | Feature flag override example                 | true                              |
| FLAG_NEW_DASHBOARD_WIDGETS | No       | Feature flag override example                 | false                             |
| ALLOWED_ORIGINS            | No       | Comma list for CORS allowlist                 | https://app.example.com           |
| REDIS_URL                  | No       | Redis cache (planned)                         | redis://host:6379                 |
| ENABLE_SNYK                | No       | Run Snyk job in security workflow             | true                              |
| RUN_E2E                    | No       | Enable e2e job in CI                          | true                              |

## 2. Secrets Handling

- Store secrets in platform secret manager (e.g., AWS Secrets Manager, GCP Secret Manager, Vercel project settings). Avoid committing `.env` files.
- Rotate `JWT_SECRET` (and any DB credentials) if leaked or on scheduled rotation (suggest 90 days).
- Use distinct environments (dev, staging, prod) each with isolated DB and secrets.

## 3. Default Safe Values

If optional variables are unset, application falls back to opinionated defaults (see source for each module). Always explicitly set security-related values in production.

## 4. Observability

- Ensure logs are aggregated centrally (e.g., CloudWatch, Loki, ELK).
- Capture metrics (export adapter roadmap) and define alarms: high error rate, elevated latency.

## 5. Security Posture Checklist

| Item                                     | Status |
| ---------------------------------------- | ------ |
| All secrets stored outside VCS           |        |
| JWT secret >= 32 bytes random            |        |
| CORS origins restricted                  |        |
| CSP nonce active (no unsafe-inline/eval) |        |
| Rate limit configured                    |        |
| Brute force thresholds tuned             |        |
| Regular dependency scanning active       |        |
| Backups & recovery tested                |        |
| Non-root runtime user (container)        |        |
| TLS termination (platform)               |        |

## 6. Deployment Strategy

- Blue/green or rolling updates recommended. Ensure readiness probe gating traffic.
- Run database migrations (`prisma migrate deploy`) before flipping traffic.
- Keep at least one prior DB snapshot for quick rollback.

## 7. Performance & Scaling

| Concern       | Practice                                                        |
| ------------- | --------------------------------------------------------------- |
| High CPU      | Profile endpoints, add caching layer                            |
| High latency  | Check DB indexes, N+1 queries, enable metrics drill down        |
| Memory growth | Investigate large object caching or leaks; heap dump (non-prod) |
| Burst traffic | Scale horizontally + move to Redis-backed rate limiter          |

## 8. Disaster Recovery Runbook

1. Detect failure (monitoring alert).
2. Assess blast radius (which services / data?).
3. If data corruption → stop writes, capture snapshot, consult backups.
4. Restore latest clean snapshot; reapply safe migrations.
5. Post-restore validation: smoke suite + targeted data checks.
6. Document incident & prevention actions.

## 9. Lifecycle Management

- Expire deprecated feature flags.
- Archive unused environment variables quarterly.
- Automate drift detection for schema & infra definitions.

## 10. Roadmap (Environment Hardening)

| Item                                  | Priority |
| ------------------------------------- | -------- |
| Add OpenTelemetry tracing exporter    | High     |
| Implement Redis cache & session store | High     |
| SSO / OAuth provider integration      | Medium   |
| WAF / bot mitigation                  | Medium   |
| Secret rotation automation            | Medium   |
| Fine-grained role-based permissions   | Medium   |
| DB connection pool tuning             | Low      |

---

Update this checklist with each production change introducing new variables or operational requirements.
