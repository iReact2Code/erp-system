import { withApiContext } from '../observability/context'

// Simple test verifying header injection and preservation of response body/status

describe('withApiContext', () => {
  it('injects x-request-id and x-trace-id headers when absent', async () => {
    const handler = withApiContext(async (_req: Request) => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })

    const res = await handler(new Request('https://example.com/test'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    const collect = (h: Headers): Record<string, string> => {
      const out: Record<string, string> = {}
      for (const [k, v] of h as Headers) out[k] = v
      return out
    }
    const map = collect(res.headers as Headers)
    expect(map['x-request-id']).toBeTruthy()
    expect(map['x-trace-id']).toBeTruthy()
  })

  it('preserves existing correlation headers if already set by inner handler', async () => {
    const handler = withApiContext(async (_req: Request, ctx) => {
      // Return a response that already sets one header intentionally
      return new Response('ok', {
        headers: {
          'x-request-id': ctx.requestId, // simulate explicit pass-through
        },
      })
    })
    const res = await handler(new Request('https://example.com/test2'))
    const collect = (h: Headers): Record<string, string> => {
      const out: Record<string, string> = {}
      for (const [k, v] of h as Headers) out[k] = v
      return out
    }
    const map2 = collect(res.headers as Headers)
    expect(map2['x-request-id']).toBeTruthy()
    expect(map2['x-trace-id']).toBeTruthy()
  })

  it('propagates provided incoming correlation headers into context', async () => {
    let seen: { reqId?: string; traceId?: string } = {}
    const handler = withApiContext(async (_req: Request, ctx) => {
      seen = { reqId: ctx.requestId, traceId: ctx.traceId }
      return new Response('ok')
    })
    const incoming = new Request('https://example.com/test3', {
      headers: {
        'x-request-id': 'incoming-req',
        'x-trace-id': 'incoming-trace',
      },
    })
    const res = await handler(incoming)
    expect(seen.reqId).toBe('incoming-req')
    expect(seen.traceId).toBe('incoming-trace')
    const collect = (h: Headers): Record<string, string> => {
      const out: Record<string, string> = {}
      for (const [k, v] of h as Headers) out[k] = v
      return out
    }
    const map3 = collect(res.headers as Headers)
    expect(map3['x-request-id']).toBe('incoming-req')
    expect(map3['x-trace-id']).toBe('incoming-trace')
  })

  it('surfaces thrown errors (does not swallow)', async () => {
    const handler = withApiContext(async () => {
      throw new Error('boom')
    })
    await expect(handler(new Request('https://example.com/x'))).rejects.toThrow(
      'boom'
    )
  })
})
