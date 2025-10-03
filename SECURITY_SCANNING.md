# Security & Dependency Scanning

This project integrates multiple layers of automated dependency and vulnerability scanning to catch issues early.

## Overview

| Tool                  | Purpose                                             | Trigger                       | Notes                                                  |
| --------------------- | --------------------------------------------------- | ----------------------------- | ------------------------------------------------------ |
| npm audit             | Detect known vulnerabilities from npm advisory DB   | PR / Push / Daily             | Non-blocking by default (reports surfaced as artifact) |
| Snyk (optional)       | Deep scan (including transitive & license)          | Conditional (ENABLE_SNYK var) | Requires `SNYK_TOKEN` secret                           |
| OSV Scanner           | Multi-ecosystem vulnerability matching (Google OSV) | PR / Push / Daily             | Outputs SARIF artifact                                 |
| Dependabot (external) | Automated dependency update PRs                     | Scheduled (GitHub)            | PRs validated by `dependabot-validation` job           |

## GitHub Actions Workflow

The workflow file: `.github/workflows/security-scan.yml` adds four jobs:

1. npm-audit
   - Installs dependencies with `npm ci` and runs `npm audit --audit-level=moderate`.
   - Always produces a JSON report artifact for historical tracking.

2. snyk (conditional)
   - Runs only when repository variable `ENABLE_SNYK` is set to `true`.
   - Requires repository secret `SNYK_TOKEN`.
   - Executes `snyk test` on all detected projects and (on `main`) `snyk monitor` to register snapshots.

3. osv-detector
   - Uses `google/osv-scanner-action` to recursively scan the repository.
   - Produces SARIF output for potential integration with GitHub code scanning alerts.

4. dependabot-validation
   - Adds safety net for dependency bump PRs (branch name starts with `dependabot/`).
   - Installs dependencies and executes the Jest suite to ensure no regressions.

## Local Usage

You can manually run the same scans locally:

```bash
# Standard audit (all deps)
npm run audit

# Production-only (omit devDependencies)
npm run audit:prod

# JSON machine-readable (used in CI)
npm run audit:ci

# If Snyk CLI installed locally
npm run snyk:test
npm run snyk:monitor
```

## Failing Builds on Vulnerabilities

Currently the workflow is non-blocking (it echoes instead of failing) to avoid noise during early stabilization. To enforce stricter gates later, remove the `|| echo` fallback and/or add severity thresholds to fail the job.

Example (strict mode):

```yaml
- name: Run npm audit (strict)
  run: npm audit --audit-level=high
```

## Adding Coverage Gates Next

A separate workflow (pending) will add coverage thresholds and lint/type checks. Keep scanning independent so security feedback arrives quickly even if tests are flaky.

## Secrets & Configuration

- SNYK_TOKEN: Add via GitHub repository settings if enabling Snyk.
- ENABLE_SNYK: Repository variable ("true" to activate Snyk job).

## Roadmap Enhancements

- Add license scanning & policy enforcement.
- Upload SARIF from npm audit using conversion tool for Code Scanning UI.
- Integrate dependency review action for PR diff risk classification.
- Add Slack notification for new high severity findings.

---

Maintained as part of production readiness hardening. Update this doc when scanning scope changes.
