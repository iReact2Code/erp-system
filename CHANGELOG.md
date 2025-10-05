# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2025-10-05

### Added

- Production-ready security posture: nonce-based CSP with middleware nonce propagation; strict in production, relaxed in development to support HMR.
- Config drift detector: surfaces missing environment variables by comparing to `.env.example.full`; enabled in production/CI to avoid dev noise.
- JWT rotation support: dual-secret verification and rotation playbook; tests included.
- Caching layer: cache adapter abstraction with optional Redis adapter.
- Feature flags: lightweight runtime flags with env/runtime/default precedence.
- Observability: OpenTelemetry instrumentation hooks and improved context propagation.
- Benchmarks and tooling: bench scripts, SBOM generation (CycloneDX), license compliance checks.

### Changed

- Locale routing: `/` redirects to `/en`, `[locale]` routes align with Next.js 15 async params; dashboard redirect wired from `/${locale}`.
- i18n data quality: cleaned malformed Chinese locale file; ensured `sales.noSales` and other keys exist across locales.
- Tests and CI: stabilized Jest configuration, upgraded transitive deps to remove deprecated `inflight` and `glob@7` chain, added overrides for `test-exclude@7`.
- Dev Experience: relaxed CSP only in dev, trimmed Permissions-Policy to recognized directives, improved logging and error shapes.

### Fixed

- CSP violations in development (HMR, styles, Google Fonts) while maintaining strictness in production with nonces.
- Jest flakiness around Next.js App Router hooks by mocking `useParams` and sharing `router.push` spy in tests.
- Login API response now returns `accessToken` (alongside `token`) to satisfy existing consumers/tests.

### Notes

- See `PRODUCTION_ENV_CHECKLIST.md` and `.env.example.full` before deploying.
- Tag `v1.0.0` created and pushed.

[1.0.0]: https://github.com/iReact2Code/erp-system/releases/tag/v1.0.0
