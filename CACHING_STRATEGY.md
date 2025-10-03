# Caching Strategy

This document outlines current and planned caching layers for the application and how to safely evolve them.

## Goals

- Reduce latency for frequent read-heavy endpoints.
- Lower database load / Prisma query volume.
- Provide deterministic invalidation patterns.
- Avoid stale sensitive data leakage.

## Layers Overview

| Layer                 | Scope                                                      | Current Status            | Notes                                             |
| --------------------- | ---------------------------------------------------------- | ------------------------- | ------------------------------------------------- |
| HTTP Browser Cache    | Static assets (Next.js build output, fonts, svg)           | Partially (Next defaults) | Can extend headers in middleware or Next config.  |
| Edge/CDN (Optional)   | Public GET endpoints, static assets                        | Not yet                   | Consider for global low-latency locales.          |
| Application In-Memory | Small TTL map for rate limiting, brute force, hot lookups  | Implemented               | Non-distributed, resets on redeploy.              |
| Redis (Planned)       | Shared ephemeral cache (auth sessions, derived aggregates) | Planned                   | Pluggable interface to mirror in-memory contract. |
| Persistence (DB)      | Source of truth                                            | Implemented               | Backed by Prisma migrations.                      |

## Candidate Cache Targets

| Domain                       | Pattern                | Value                    | TTL    | Invalidation                            |
| ---------------------------- | ---------------------- | ------------------------ | ------ | --------------------------------------- |
| User Profile (public subset) | getUserSummary(userId) | JSON summary shape       | 5m     | On profile update / role change.        |
| Product Inventory Snapshot   | getInventoryItem(id)   | { id, qty, price, meta } | 30s–2m | On inventory mutation (purchase/sale).  |
| Exchange Rates (if added)    | fetchRates(base)       | rates map                | 1h     | Natural expiry.                         |
| Analytics Mini-Dash          | computeRecentSales()   | aggregated metrics       | 5m     | Time-based only (acceptable staleness). |

## Recommended Implementation Phases

1. Abstraction: Create `CacheAdapter` interface (get, set, del, mget, incr, ttl) with in-memory implementation as default.
2. Introduce Redis adapter; enable by ENV (`REDIS_URL`). Fallback gracefully if not configured.
3. Add simple key helpers (namespaced): `cacheKey.userSummary(id)`, etc.
4. Wrap read paths with optional caching (opt-in by calling `cache.wrap(key, fetchFn, ttlMs)`).
5. Emit metrics: cache hit / miss / set counters to existing metrics module.
6. Add invalidation hooks in mutating services (e.g. invalidate user summary after profile update).

## Key Design Considerations

- Deterministic keys: `${namespace}:${version}:${id}` (version bump to bust broad sets on schema shape change).
- Avoid caching secrets / PII such as password hashes, refresh tokens.
- Partial response caching only for idempotent GET operations.
- Propagate trace context when backing function executes (wrap instrumentation inside `cache.wrap`).

## Staleness & Consistency

- Prefer eventual consistency for dashboards & aggregate stats.
- Use write-through or explicit invalidation for per-entity snapshots (inventory quantities, user roles).
- If race conditions matter (e.g., decrementing inventory), rely on DB transactions not cache writes for correctness.

## ETag & Conditional Requests

- For resources with stable deterministic JSON, compute weak ETag: `W/"<hash>"` where hash = SHA256 of canonicalized JSON (sorted keys) truncated (e.g. first 16 hex chars).
- On request: if `If-None-Match` matches current ETag, return `304 Not Modified` with empty body.
- Store last ETag for that resource (or recompute quickly if read cost is low). Hash function can be implemented without full caching layer.

## Purge / Invalidation Patterns

| Pattern               | Use Case                       | Example                                              |
| --------------------- | ------------------------------ | ---------------------------------------------------- |
| Direct key delete     | Specific entity changed        | userSummary:del(id) after profile update             |
| Version bump          | Schema shape changes widely    | Increase `version` constant in key factory           |
| TTL expiry only       | Aggregate tolerates staleness  | recentSales (5m)                                     |
| Event-driven (future) | Broadcast mutation via pub/sub | Inventory mutation triggers distributed invalidation |

## Metrics & Observability

Track counters:

- `cache_hits_total`
- `cache_misses_total`
- `cache_sets_total`
- `cache_evictions_total` (if using LRU)
  Latency histogram for underlying fetch on misses: `cache_fill_duration_seconds`.
  Add log at debug level for high-impact keys (user summary, inventory snapshot) when cache miss latency > threshold.

## Failure Modes

- Redis unavailable → fallback to in-memory (log warning, increment `cache_backend_failures_total`).
- Serialization error → skip caching (log; do not break response).
- Hot key burst → consider per-key mutex (single flight) to prevent cache stampede.

## Single Flight (Optional Enhancement)

Implement a simple promise map keyed by cache key; first miss populates, others await promise until resolved or rejected (then cleared).

## Example Interface Sketch

```ts
export interface CacheAdapter {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>
  del(key: string): Promise<void>
  incr(key: string, amount?: number, ttlMs?: number): Promise<number>
  ttl(key: string): Promise<number | undefined>
  wrap<T>(key: string, fn: () => Promise<T>, ttlMs: number): Promise<T>
}
```

## Security & Privacy

- Never cache authorization decisions; compute per-request.
- Sanitize objects prior to caching to ensure only necessary fields stored.
- Consider encrypting sensitive cached blobs if regulatory needs arise (rare for generic metadata).

## Roadmap

- Phase 1: Interface + metrics + in-memory wrap (short TTL experiments).
- Phase 2: Redis integration + single flight + hit/miss dashboard.
- Phase 3: ETag support for selected read endpoints.
- Phase 4: Pub/sub invalidation (Redis channels) for multi-instance scale out.

---

Document owner: Platform/Infra.
Update upon introducing Redis adapter PR.
