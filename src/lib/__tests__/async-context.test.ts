import { withApiContext } from '../observability/context'
import { getCurrentRequestContext } from '../observability/async-context'

// Test that context is available across async boundaries (microtasks + setTimeout)

describe('async request context propagation', () => {
  it('exposes same requestId/traceId inside nested async operations', async () => {
    let outerIds: { requestId?: string; traceId?: string } = {}
    const innerIds: { requestId?: string; traceId?: string } = {}

    const handler = withApiContext(async (_req: Request, ctx) => {
      outerIds = { requestId: ctx.requestId, traceId: ctx.traceId }
      await Promise.resolve()
      // Microtask boundary
      const ctxMid = getCurrentRequestContext()
      if (ctxMid) {
        innerIds.requestId = ctxMid.requestId
        innerIds.traceId = ctxMid.traceId
      }
      await new Promise(r => setTimeout(r, 0))
      const ctxLate = getCurrentRequestContext()
      if (ctxLate) {
        innerIds.requestId = ctxLate.requestId
        innerIds.traceId = ctxLate.traceId
      }
      return new Response('ok')
    })

    const res = await handler(new Request('https://example.com/ctx'))
    expect(res.status).toBe(200)
    expect(outerIds.requestId).toBeTruthy()
    expect(innerIds.requestId).toBe(outerIds.requestId)
    expect(innerIds.traceId).toBe(outerIds.traceId)
  })
})
