import { createLogger } from '@/lib/logger'
import { runWithRequestContext } from './async-context'
import { recordApiMetric } from '@/lib/metrics'

/**
 * Lightweight tracing / request context primitives (no external deps yet).
 * Can be adapted to OpenTelemetry in a future step.
 */

export interface RequestContext {
  requestId: string
  traceId: string
  startTime: number
  parentSpanId?: string
}

export interface SpanContext {
  spanId: string
  name: string
  start: number
  end: () => SpanResult
  traceId: string
  parentSpanId?: string
  requestId: string
}

export interface SpanResult {
  spanId: string
  name: string
  durationMs: number
  traceId: string
  parentSpanId?: string
  requestId: string
}

const random = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    return crypto.randomUUID().replace(/-/g, '')
  return (Math.random().toString(16).slice(2) + Date.now().toString(16))
    .padEnd(32, '0')
    .slice(0, 32)
}

export function createRequestContext(
  init?: Partial<Pick<RequestContext, 'requestId' | 'traceId'>>
): RequestContext {
  return {
    requestId: init?.requestId || random().slice(0, 16),
    traceId: init?.traceId || random(),
    startTime: Date.now(),
  }
}

export function startSpan(
  name: string,
  ctx: RequestContext | SpanContext
): SpanContext {
  const traceId =
    (ctx as SpanContext).traceId || (ctx as RequestContext).traceId
  const requestId =
    (ctx as SpanContext).requestId || (ctx as RequestContext).requestId
  const parentSpanId = 'spanId' in ctx ? ctx.spanId : undefined
  const spanId = random().slice(0, 16)
  const start = Date.now()
  const log = spanLogger

  return {
    spanId,
    name,
    start,
    traceId,
    parentSpanId,
    requestId,
    end: () => {
      const durationMs = Date.now() - start
      const result: SpanResult = {
        spanId,
        name,
        durationMs,
        traceId,
        parentSpanId,
        requestId,
      }
      log.debug('span_complete', result as unknown as Record<string, unknown>)
      return result
    },
  }
}

const spanLogger = createLogger('trace')

/**
 * Wrap an async operation inside a span.
 */
export async function withSpan<T>(
  name: string,
  ctx: RequestContext | SpanContext,
  fn: (span: SpanContext) => Promise<T>
): Promise<T> {
  const span = startSpan(name, ctx)
  try {
    const result = await fn(span)
    span.end()
    return result
  } catch (error) {
    spanLogger.error('span_error', { name, error })
    span.end()
    throw error
  }
}

/**
 * Derive a child logger augmented with trace identifiers for direct logging.
 */
export function scopedTraceLogger(
  base: ReturnType<typeof createLogger>,
  ctx: RequestContext | SpanContext
) {
  const traceId =
    (ctx as SpanContext).traceId || (ctx as RequestContext).traceId
  const requestId =
    (ctx as SpanContext).requestId || (ctx as RequestContext).requestId
  return createLogger('app', { traceId, requestId })
}

// Wrapper for Next.js route handlers to auto-provide request/trace IDs and inject headers.

// Support both standard Fetch Request and Next.js NextRequest without importing Next types globally for environments where not available.
type GenericRequest = Request & { headers: Headers }

export function withApiContext<
  H extends (req: GenericRequest, ctx: RequestContext) => Promise<Response>,
>(handler: H) {
  return async function wrapped(req: GenericRequest): Promise<Response> {
    const requestId = req.headers.get('x-request-id') || undefined
    const traceId = req.headers.get('x-trace-id') || undefined
    const ctx = createRequestContext({ requestId, traceId })
    const res = await runWithRequestContext(ctx, () => handler(req, ctx))
    // Inject correlation headers if not already present. Some test environments may
    // provide a plain object for res.headers rather than a real Headers instance.
    // Prefer mutating existing headers if it's a Headers instance
    if (res.headers instanceof Headers) {
      if (!res.headers.get('x-request-id'))
        res.headers.set('x-request-id', ctx.requestId)
      if (!res.headers.get('x-trace-id'))
        res.headers.set('x-trace-id', ctx.traceId)
      return res
    }
    // Fallback: create new headers object
    const hdr = new Headers()
    try {
      for (const [k, v] of Object.entries(
        res.headers as unknown as Record<string, unknown>
      )) {
        if (typeof v === 'string') hdr.set(k, v)
      }
    } catch {
      // ignore
    }
    if (!hdr.get('x-request-id')) hdr.set('x-request-id', ctx.requestId)
    if (!hdr.get('x-trace-id')) hdr.set('x-trace-id', ctx.traceId)
    // Attempt to reuse original body
    const rUnknown = res as unknown as { _body?: unknown }
    const bodyRaw = rUnknown._body
    const body =
      typeof bodyRaw === 'string' || bodyRaw === null ? bodyRaw : undefined
    const statusText = ((): string => {
      const candidate = res as unknown as { statusText?: unknown }
      return typeof candidate.statusText === 'string'
        ? candidate.statusText
        : ''
    })()
    return new Response(body, { status: res.status, statusText, headers: hdr })
  }
}

// Optional metrics wrapper to compose with withApiContext
export function withApiMetrics<
  H extends (req: GenericRequest, ctx: RequestContext) => Promise<Response>,
>(handler: H, routeId: string) {
  return async function metricsWrapped(req: GenericRequest): Promise<Response> {
    const start = Date.now()
    let status = 500
    try {
      const res = await handler(req, {
        // Provide a minimal context fallback if called without withApiContext
        requestId: req.headers.get('x-request-id') || 'unknown',
        traceId: req.headers.get('x-trace-id') || 'unknown',
        startTime: start,
      })
      status = res.status
      return res
    } catch (err) {
      status = 500
      throw err
    } finally {
      const durationMs = Date.now() - start
      recordApiMetric({
        route: routeId,
        method: (req.method || 'GET').toUpperCase(),
        status,
        durationMs,
        error: status >= 500,
      })
    }
  }
}
