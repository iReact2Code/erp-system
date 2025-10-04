import {
  createRequestContext,
  startSpan,
  withSpan,
} from '@/lib/observability/context'

describe('observability context', () => {
  test('creates request context with ids', () => {
    const ctx = createRequestContext()
    expect(ctx.requestId).toBeTruthy()
    expect(ctx.traceId).toBeTruthy()
    expect(ctx.requestId.length).toBeGreaterThan(5)
    expect(ctx.traceId.length).toBeGreaterThan(10)
  })

  test('startSpan returns span and end yields duration', async () => {
    const ctx = createRequestContext()
    const span = startSpan('test-span', ctx)
    const result = span.end()
    expect(result.spanId).toBeTruthy()
    expect(result.name).toBe('test-span')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
    expect(result.traceId).toBe(ctx.traceId)
  })

  test('withSpan wraps async fn and records duration', async () => {
    const ctx = createRequestContext()
    const value = await withSpan('wrapped', ctx, async () => {
      return 42
    })
    expect(value).toBe(42)
  })
})
