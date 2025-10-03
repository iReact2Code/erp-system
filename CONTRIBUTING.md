# Contributing Guide

Thanks for taking the time to improve this project. This document describes how to propose changes safely and consistently.

## Table of Contents

- Code of Conduct
- Architecture Overview
- Development Workflow
- Branching & Commit Conventions
- Coding Standards
- Testing Strategy
- Security & Secrets
- Performance & Benchmarks
- Migrations & Data Safety
- Feature Flags
- Release & Deployment
- Checklist (PR Template)

## Code of Conduct

Be respectful. No harassment, abusive language, or discrimination. Assume positive intent. Report serious issues privately to maintainers.

## Architecture Overview

- Next.js (App Router) + TypeScript
- Prisma for data layer (+ migrations)
- Centralized validation via Zod with trim & sanitize hooks
- Observability: request context logger, metrics counters + latency histograms
- Security: strict headers, rate limiting, brute force protection, JWT auth (access + refresh), CSP nonce
- Feature flags: runtime/env/default precedence

## Development Workflow

1. Fork & clone / create feature branch from `main` or `develop`.
2. Install deps:
   ```bash
   npm ci
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```
4. Add/modify code (see coding standards below).
5. Run quality gates locally:
   ```bash
   npm run lint && npm run typecheck && npm test
   ```
6. Ensure coverage stays >= configured thresholds (70% global now; raise over time).
7. Submit PR with clear title + description.

## Branching & Commit Conventions

- Branch prefixes: `feat/`, `fix/`, `chore/`, `docs/`, `perf/`, `refactor/`, `test/`, `security/`.
- Commit style (semantic, optional scope):
  - `feat(auth): add refresh token rotation`
  - `fix(inventory): correct negative stock validation`
  - `chore(ci): add security scanning workflow`

## Coding Standards

- Use TypeScript strictness; prefer explicit return types for public functions.
- Keep functions small and cohesive; extract helpers when > ~30 lines.
- Avoid premature optimization—prove with metrics/bench.
- Log at appropriate level: debug (diagnostics), info (state changes), warn (recoverable anomaly), error (failure path).
- No `any` unless absolutely necessary (justify with comment).
- Handle errors centrally—prefer throwing domain errors consumed by API handler helpers.

## Testing Strategy

| Layer       | Tool                        | Purpose                              |
| ----------- | --------------------------- | ------------------------------------ |
| Unit        | Jest                        | Logic correctness, fast feedback     |
| Integration | Jest (API route tests)      | Validation, auth flows               |
| E2E         | Playwright                  | User-centric flows (optional gating) |
| Security    | npm audit / Snyk / OSV      | Vulnerability awareness              |
| Performance | Bench scripts / (future k6) | Latency & throughput tracking        |

### Writing Tests

- Co-locate under `__tests__` or `*.test.ts`.
- Mock boundaries (DB, network) but avoid overspecifying internals.
- Prefer data-driven tests for validation schemas.

## Security & Secrets

- Never commit real secrets. Use `.env.local` (uncommitted).
- Environment secret categories:
  - Auth: `JWT_SECRET`
  - DB: `DATABASE_URL`
  - Rate Limiting / Cache: `REDIS_URL` (future)
- Rotate secrets periodically and on suspicion of leak.

## Performance & Benchmarks

- Use built-in metrics counters (request count, errors, latency histogram) to validate changes.
- Bench scripts under `bench/` for comparative runs (pre vs post change).
- Add regression thresholds only when data supports stable baseline.

## Migrations & Data Safety

- Follow `DATA_BACKUP_MIGRATION.md` for workflow.
- Commit each auto-generated migration folder.
- Favor additive then cleanup phases for destructive changes.

## Feature Flags

- Implemented in `src/lib/feature-flags.ts`.
- Precedence: env > runtime override > defaults.
- Use `whenFlag('flagName', onFn, offFn)` for conditional logic.
- Remove stale flags (two-release policy) to reduce complexity.

## Release & Deployment

- CI: lint → typecheck → unit (coverage) → build (+ optional e2e).
- Security scan workflow runs in parallel.
- Deployment (future): Tag & build artifacts or push to hosting platform.
- Use `npm version <patch|minor|major>` then push tags (if versioned release model adopted later).

## PR Checklist

Before requesting review ensure:

- [ ] Lint passes (`npm run lint`)
- [ ] Type checks pass (`npm run typecheck`)
- [ ] Unit tests pass (`npm test`)
- [ ] Coverage threshold maintained (`npm run test:coverage` if changed core logic)
- [ ] No newly introduced high severity vulnerabilities (`npm run audit`)
- [ ] Docs updated (README / relevant MD files)
- [ ] Feature flags documented or removed if deprecated

## Communication

- Keep PRs small & focused (< ~400 LOC diff recommended).
- Provide migration notes if schema changed.
- Include benchmark deltas for significant performance claims.

---

Welcome aboard. Ship small, ship often.
