This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Developer testing notes

This project includes a lightweight `useApi` hook used across features. A few testing tips:

- Prefer to assert hook-driven UI changes using RTL's `waitFor` or `act()` rather than relying on internal timing within hooks. Tests that await the public `refresh()` method should wrap assertions in `waitFor` so they observe committed state.
- `useApi` previously used extra macrotask waits to stabilize Jest runs; that behavior has been removed in favor of clearer test assertions. If you encounter flakiness in CI, prefer adding explicit `waitFor()` in the test rather than reintroducing hidden waits in the hook.
- Use `clearApiCache()` from `src/hooks/use-api.ts` in test setup/teardown if you need to reset internal caches between tests.

If you'd like, I can add a short `CONTRIBUTING.md` with testing conventions for this repository.

## Logging

Structured logging is provided by a lightweight zero-dependency logger in `src/lib/logger.ts`. It supports:

- Log levels (debug, info, warn, error) with `LOG_LEVEL` env control.
- Pretty colored output in development; JSON lines in production (override with `LOG_PRETTY=1`).
- Redaction of obvious sensitive keys (password/token/secret/authorization).
- Scoped loggers via `createLogger('scope')`.
- Safe error serialization with `serializeError(error)`.

Example:

```ts
import { createLogger, serializeError } from '@/lib/logger'
const log = createLogger('inventory')
try {
  // ...
  log.info('item_created', { id })
} catch (e) {
  log.error('create_failed', { error: serializeError(e) })
}
```

## Observability / Tracing (Incremental Scaffold)

Initial minimal tracing utilities live in `src/lib/observability/context.ts` (no external dependencies yet). They provide:

- `createRequestContext()` – generates `requestId` & `traceId`.
- `startSpan(name, ctx)` and `withSpan(name, ctx, fn)` – lightweight timing spans.
- API routes (inventory & users) now include `x-request-id` and `x-trace-id` headers for correlation.

Planned future upgrade path:

1. Introduce OpenTelemetry SDK for real span objects and exporters.
2. Propagate context via middleware and async context APIs.
3. Auto-enrich logs with active span/trace IDs directly from OTel context.

Until then, search logs using `requestId` / `traceId` to correlate a single request across layers.

## Authorization Layer

Role & action based authorization is centralized in `src/lib/authorization/policies.ts` providing:

- `can(user, action)` -> boolean
- `requirePermission(user, action)` -> throws `AuthorizationError` if denied
- `listRolePermissions(role)` -> list actions

Defined actions (initial set): `inventory:create|update|delete|read`, `user:list`, `order:create|update|read|delete`.

Current role mappings (simplified):

- ADMIN: all actions
- MANAGER: inventory (create/update/read), user:list, order (create/update/read)
- SUPERVISOR: inventory:read, user:list, order:read
- THIRD_PARTY_CLIENT: order:read only

- Default window: 60s
- Default max: 30 requests per identity (user ID or fallback IP) per verb grouping

Returned headers on instrumented routes:

- `X-RateLimit-Limit` – maximum allowed in the window
- `X-RateLimit-Remaining` – remaining quota
- `X-RateLimit-Reset` – epoch seconds when window resets
- `Retry-After` – (429 only) seconds until next allowed attempt

Future upgrade path: swap internal map storage with Redis using atomic INCR + PX + TTL; expose async interface without changing calling code. Could add token bucket or sliding window for burst smoothing.

## Database Performance Instrumentation

Lightweight Prisma query performance tracking is implemented in `src/lib/prisma-performance.ts` and automatically attached in `src/lib/db.ts` when enabled.

Capabilities:

- Optional capture of raw SQL text and parameter JSON for slow query analysis

- `DB_PERF_ENABLE=1` – turn the feature on (defaults to on in development unless explicitly set `0`)
- `SLOW_QUERY_MS=150` – threshold in ms for marking a query as slow
- `DB_PERF_MAX_SAMPLES=50` – max retained slow query samples (oldest dropped first)
- `DB_PERF_VERBOSE=1` – log non-slow queries at debug level
- `DB_PERF_CAPTURE_SQL=1` – include SQL text in stored/logged sample (may contain identifiers)

```ts
import { getSlowQuerySamples } from '@/lib/prisma-performance'
const samples = getSlowQuerySamples()
// [{ ts, durationMs, query?, params?, target? }, ...]
```

Each slow sample logs an event `slow_query` with minimal metadata (duration + model/target) to avoid leaking SQL unless explicitly configured. Use these samples to:

1. Identify candidate indexes / query rewrites
2. Correlate with application-level spans (timestamps close to span durations)
3. Establish baseline before deeper instrumentation (e.g. full OpenTelemetry + exporter)

Future possible enhancements:

- Export metrics to Prometheus (histogram + counter for slow queries)
- Add basic percentile tracking without external deps
- Integrate trace/span IDs into query events once tracing context propagation improves

### Diagnostics Endpoint

An authenticated ADMIN-only endpoint exposes recent slow query samples:

`GET /api/_internal/db-perf?limit=25`
{
"samples": [
{ "ts": 1696032000000, "durationMs": 342, "target": "User", "query": "SELECT ..." }
],
"total": 42
}

````

Security:
- Protected by `diagnostics:read` action (only ADMIN mapped).
- Do NOT enable `DB_PERF_CAPTURE_PARAMS` or `DB_PERF_CAPTURE_SQL` in production unless reviewed; may contain sensitive data.
- Keep endpoint unlinked from public navigation; path intentionally namespaced under `_internal`.

Operational Tips:
- To flush samples quickly for a test session: temporarily lower `SLOW_QUERY_MS`.
- For ad-hoc debugging, set `DB_PERF_VERBOSE=1` to see all query durations in logs while still retrieving slow samples via the endpoint.

### Performance Summary Endpoint

`GET /api/_internal/db-perf/summary` (ADMIN only) returns aggregate counters:

Example response:
```json
{
	"totalQueries": 1284,
	"totalDurationMs": 53210,
	"avgMs": 41.4,
	"slowCount": 37,
	"slowRate": 0.0288,
	"slowThresholdMs": 150,
	"capturedSlowSamples": 37,
	"maxSlowSamples": 50,
	"globalP95Ms": 210,
	"sampleWindow": 200,
	"targets": [
		{ "target": "Order", "count": 600, "slow": 20, "avgMs": 52.3, "maxMs": 412, "p95Ms": 180, "slowRate": 0.033 },
		{ "target": "User", "count": 400, "slow": 9,  "avgMs": 12.1, "maxMs": 88,  "p95Ms": 40,  "slowRate": 0.0225 }
	],
	"generatedAt": 1696032000123
}
````

Notes:

- `p95Ms` and `globalP95Ms` computed from a rolling window (size `DB_PERF_SAMPLE_WINDOW`, default 200) using a simple sorted index method.
- `targets` sorted descending by query count for quick hotspot identification.
- Use `slowRate` (slow / count) per target to prioritize tuning even if raw durations differ.
- Adjust window via `DB_PERF_SAMPLE_WINDOW` to trade memory vs smoothing; small windows react faster, large windows stabilize noise.

Future enhancement: add lightweight rolling window histogram to approximate percentiles.

Testing:

- `isSlowQuery` classification covered by `src/lib/__tests__/prisma-performance.test.ts` (boundary: below, equal, above threshold)
- Additional integration validation can be done by temporarily setting `SLOW_QUERY_MS=0` and exercising API routes to force slow classification

## Unified Request Validation

Implemented in `src/lib/unified-validation.ts` to provide a single, typed entry point for validating body, query, and route params using Zod schemas.

Key Features:

- Separate optional schemas: `body`, `query`, `params`.
- Query value coercion (`"2" -> 2`, `"true" -> true`) enabled by default.
- Size guard (`maxJsonBytes`, default 1MB) with explicit `413 JSON_TOO_LARGE` errors.
- Content-Type enforcement (default `application/json`).
- Consistent structured error payload: `{ error, message, details: [{ path, code, message }] }`.
- Strong typing of returned `body/query/params` objects.

Example Usage (Inventory POST):

```ts
const validate = buildValidator({
  body: z.object({
    name: z.string().min(1),
    sku: z.string().min(1),
    description: z.string().optional(),
    unitPrice: z.union([z.number(), z.string()]).transform(v => Number(v)),
  }),
})
const { body } = await validate(request)
```

Error Handling:
Wrap the validator in try/catch and return `validationErrorResponse(err)` if `err instanceof HttpError`.

Migration Strategy:

- Existing older helpers (`validation.ts`, `request-validation.ts`) remain for backwards compatibility.
- New or refactored routes should adopt the unified validator for consistency.
- Gradually phase out ad-hoc manual `await request.json()` + inline checks.

Testing:

- Unit tests in `src/lib/__tests__/unified-validation.test.ts` cover: success path, body failure, query coercion.
- Future enhancements: add integration tests asserting 400 error shape on malformed payloads.

## Standardized API Errors

All new/refactored routes may use helpers in `src/lib/api-errors.ts` to ensure a consistent payload structure.

Shape:

```json
{ "error": "CODE", "message": "Human readable", "details": [ ...optional structured data... ] }
```

Helpers:

Inventory & Users routes now emit unified error responses for common failure modes (authz, rate limit, validation, internal errors).

Benefits:

Planned Enhancements:

### ETag Support (apiSuccess)

`apiSuccess` now supports a lightweight built-in ETag mechanism to help clients leverage conditional requests and reduce payload transfer for unchanged resources.

Options:

```ts
apiSuccess({
  data,
  etag: true, // auto-generate weak ETag from JSON body hash
  // OR provide custom string (quoted automatically if not already)
  // etag: 'resource-v1'
  requestHeaders: request.headers, // supply to enable 304 evaluation
  headers: { 'Cache-Control': 'public, max-age=30' },
})
```

Behavior:

- When `etag: true`, a weak ETag `W/"<hash>"` is produced using a fast FNV-1a style hash of the serialized JSON.
- When `etag: '<value>'`, the helper normalizes to a quoted (strong) tag unless you pass something already starting with `W/` or a quote.
- If the incoming request supplies `If-None-Match` and it matches (case-sensitive) the final ETag (weak or strong), a `304 Not Modified` is returned with no body.
- Matching is tolerant: it strips weak prefixes and quotes for comparison to handle clients that supply normalized values.

Notes / Caveats:

- The hash is for cache validation only (not cryptographic integrity). For stronger guarantees use a content digest header or real build fingerprint.
- Only applied when you provide `etag` – no implicit generation.
- Future enhancement could include automatic ETag injection on selected routes via middleware.

Client Tip:
Include `If-None-Match` header from a previous response's `ETag` to leverage 304s and save bandwidth.

## Correlated API Handler Wrapper (`withApiContext`)

To eliminate repetitive boilerplate for assigning and propagating correlation identifiers, routes can wrap their handlers with `withApiContext` from `src/lib/observability/context.ts`.

Features:

- Automatically reads inbound `x-request-id` / `x-trace-id` headers (if present) or generates new IDs.
- Supplies a lightweight `RequestContext` object `{ requestId, traceId, startTime }` to your handler as the second argument.
- Ensures the final `Response` includes both `x-request-id` and `x-trace-id` (without overwriting if you already set them).
- Safe in both real Next.js runtime and Jest test environment (graceful handling of polyfilled `Headers`).

Example:

```ts
import { withApiContext, withSpan } from '@/lib/observability/context'
import { apiSuccess, apiError, unauthorized } from '@/lib/api-errors'
import {
  getUserFromRequest,
  requireAuth,
  BasicAuthRequest,
} from '@/lib/jwt-auth'

export const GET = withApiContext(async (request: Request, ctx) => {
  try {
    const user = getUserFromRequest(request as unknown as BasicAuthRequest)
    requireAuth(user)
    const data = await withSpan('users.list', ctx, async () => {
      /* ... */
    })
    return apiSuccess({ data })
  } catch (e) {
    if (e instanceof Error && e.message === 'Unauthorized')
      return unauthorized()
    return apiError({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal error',
    })
  }
})
```

Testing:

- A dedicated test (`with-api-context.test.ts`) validates header injection, propagation of incoming IDs, and error surfacing.
- If you unit test a wrapped handler directly, just call the exported function with a standard `Request` – the wrapper manages context.

Migration Guidelines:

1. Replace previous manual generation of correlation IDs (if any) with the wrapper.
2. Remove ad-hoc header setting (`x-request-id`, `x-trace-id`) inside handlers—they'll be injected automatically.
3. Use the provided `ctx` for span creation or structured logging enrichment.
4. Prefer `withSpan('operation', ctx, fn)` for nested instrumentation.

Why not a Middleware?

- The App Router's edge/runtime nuances plus desire for a testable pure function made a wrapper simpler at this stage. Middleware-based propagation can be layered later without changing handler signatures.

Future Enhancements:

- Integrate with AsyncLocalStorage / OpenTelemetry context for transparent span propagation.
- Automatic log enrichment via an adapter logger bound to the current context.

## Validator Request Generalization

`buildValidator` previously required a `NextRequest`. It now accepts a standard `Request` (optionally with a `nextUrl: URL` property). This simplifies testing and decouples core validation from the Next.js runtime type.

Update Notes:

- Existing code that passed a `NextRequest` continues to work (structurally compatible with `Request`).
- Query parsing falls back to `new URL(req.url).searchParams` when `nextUrl` is absent.
- No functional changes to validation semantics; only the accepted input type broadened.

## Correlation & Caching Together

When combining `withApiContext` and `apiSuccess({ etag: true })` you get:

1. Stable correlation headers for tracing.
2. Automatic conditional 304 responses when content unchanged.
3. Uniform success / error payload envelopes.

Example pattern:

```ts
export const GET = withApiContext(async (request, ctx) => {
  const data = await withSpan('inventory.list', ctx, () =>
    service.list(/*...*/)
  )
  return apiSuccess({ data, etag: true, requestHeaders: request.headers })
})
```

## FAQ

**Q: Do I need to wrap every route immediately?**
No. New or actively modified routes should adopt the wrapper; legacy routes can migrate opportunistically.

**Q: Will adding the wrapper break streaming responses?**
Not currently supported for streaming because the wrapper clones/injects headers once. Planned enhancement: detect `ReadableStream` bodies and preserve them.

**Q: How are IDs generated?**
Simple UUID (or Math.random fallback) truncated for requestId; full 32 hex chars for traceId.

**Q: Can I override the generated IDs?**
Yes—supply your own `x-request-id` / `x-trace-id` headers in the incoming request; they propagate through unchanged.

## Async Context Propagation (Experimental)

To simplify accessing the current `requestId` / `traceId` deep inside services or repositories without threading a context parameter, the project now includes a minimal AsyncLocalStorage-backed helper.

Location: `src/lib/observability/async-context.ts`

Exports:

- `runWithRequestContext(ctx, fn)` – internal utility used by `withApiContext` to establish the context scope.
- `getCurrentRequestContext()` – retrieve `{ requestId, traceId, startTime }` for the active request (or `undefined` if none).

Usage Example (inside a service method):

```ts
import { getCurrentRequestContext } from '@/lib/observability/async-context'
import { createLogger } from '@/lib/logger'

const log = createLogger('inventory.service')

export async function doWork() {
  const ctx = getCurrentRequestContext()
  if (ctx)
    log.debug('work_started', {
      requestId: ctx.requestId,
      traceId: ctx.traceId,
    })
  // ... perform logic ...
}
```

Behavior & Limitations:

- In Node runtimes with `async_hooks`, context flows across async/await, microtasks, and timers.
- In environments lacking `AsyncLocalStorage` (some edge runtimes), a no-op shim returns only synchronous access (most handlers still work; deep async boundaries will not retain context).
- No automatic log injection yet—explicitly include IDs where needed (future enhancement could wrap logger factory).

Testing:

- `async-context.test.ts` asserts that identifiers remain stable across `Promise.resolve()` and `setTimeout()` boundaries.

Roadmap Enhancements:

1. Tie into a future OpenTelemetry context if/when tracing SDK is adopted.
2. Provide a `scopedLogger()` that automatically pulls current context.
3. Add request duration metric tagging with trace IDs.

Opt-Out:

- If you prefer explicit propagation, simply ignore `getCurrentRequestContext()`; existing handler `ctx` parameter remains authoritative.
