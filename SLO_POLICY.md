# Service Level Objectives (SLO) and Error Budget

This document defines our initial availability and latency SLOs and how we manage the error budget.

## SLO Targets

- Availability (monthly): 99.5%
  - Downtime budget ~3h 39m per 30-day month
- Latency (P95) for key APIs:
  - `GET /api/_internal/ready`: < 50ms
  - `GET /api/users`: < 250ms
  - `POST /api/login`: < 500ms

## Error Budget

We track the percentage of failed requests (HTTP 5xx) per rolling 7 days. The budget is `(1 - SLO) * request_count`.

- If the weekly error-rate exceeds the budget, we enter a "stability period":
  - Freeze risky deploys (features) until budget recovers
  - Prioritize reliability fixes

## Measurement

- Availability: Health checks and metrics exposed by `/api/_internal/metrics` (success vs failures)
- Latency: P95 latency captured in the perf-regression CI and optional APM (OpenTelemetry)

## Alerting (Initial)

- CI gate: Performance regression job compares current vs baseline with tolerances.
- Optional: Wire a simple alert in the deployment environment using metrics pipeline when 5xx error rate exceeds budget in 1h window.

## Review Cycle

- Monthly review of SLO and thresholds; ratchet once consistently exceeded by healthy margin.
