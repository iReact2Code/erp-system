# Observability

This document describes logging, metrics, tracing components and how to configure them.

## Logging

- Structured logger with JSON in production (unless `LOG_PRETTY=1`).
- Automatic enrichment: `requestId`, `traceId` (when tracing active).
- Redaction of sensitive keys: password, token, secret, authorization.

## Metrics

(Current minimal) request counters, error counters, latency histograms (see metrics module). Future expansion: cache hit/miss, queue depth, custom business KPIs.

## Distributed Tracing

Implemented via optional OpenTelemetry initialization (`ENABLE_TRACING=1`).

### Enabling

Set environment variables:

```
ENABLE_TRACING=1
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com/v1/traces
SERVICE_NAME=ai-erp-system
```

Optional sampling config (defaults always-on parent based):

```
OTEL_TRACES_SAMPLER=parentbased_always_on
OTEL_TRACES_SAMPLER_ARG= # depends on sampler
```

### Export

Uses OTLP HTTP exporter. Supports any collector (OpenTelemetry Collector, Tempo, Honeycomb ingest proxy, etc.) accepting OTLP.

### Auto Instrumentations

`@opentelemetry/auto-instrumentations-node` provides baseline spans (HTTP, fetch, DNS, etc.). Add database-specific instrumentation if needed later (e.g., Prisma instrumentation when released/stable in this codebase).

### Logger Trace Correlation

`traceId` inserted in log meta if active span present. Allows log aggregation systems to pivot from logs -> trace.

### Graceful Degradation

If packages missing or `ENABLE_TRACING` != 1, tracing module no-ops. Ambient module declarations avoid TypeScript errors.

### Shutdown

`SIGTERM` hook triggers SDK shutdown (flushing spans) to minimize data loss during deployments.

## Environment Variables Summary

| Variable                    | Purpose                          | Default               |
| --------------------------- | -------------------------------- | --------------------- |
| ENABLE_TRACING              | Turn tracing on/off              | off                   |
| SERVICE_NAME                | Override service name resource   | ai-erp-system         |
| OTEL_EXPORTER_OTLP_ENDPOINT | Collector endpoint for OTLP HTTP | undefined             |
| OTEL_TRACES_SAMPLER         | Sampler strategy                 | parentbased_always_on |
| LOG_LEVEL                   | Minimum log level                | info                  |

## Roadmap

- Add custom spans around high-value operations (auth, inventory mutation, report generation).
- Capture DB query spans (Prisma instrumentation) when stable.
- Propagate trace context to front-end (W3C traceparent header) for browser session linking.
- Add metrics exporter bridging spans -> RED metrics dashboards.

---

Owner: Platform / Observability. Update with each tracing capability enhancement.
