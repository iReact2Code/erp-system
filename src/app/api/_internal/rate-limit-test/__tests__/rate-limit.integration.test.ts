import * as routeMod from '../route'

type Handler = (req: Request) => Promise<Response>

function headersToObject(h: Headers) {
  const o: Record<string, string> = {}
  for (const [k, v] of h.entries()) o[k] = v
  return o
}

describe('rate limit headers (integration)', () => {
  const handler = routeMod.GET as Handler

  async function hit(id: string) {
    const req = new Request(
      'https://example.com/api/_internal/rate-limit-test',
      {
        headers: { 'x-test-id': id },
      }
    )
    return handler(req)
  }

  test('serves within limit and then 429 with correct headers', async () => {
    const r1 = await hit('u1')
    const h1 = headersToObject(r1.headers)
    expect(r1.status).toBe(200)
    expect(h1['x-ratelimit-limit']).toBeDefined()
    const r2 = await hit('u1')
    expect(r2.status).toBe(200)
    const r3 = await hit('u1')
    const h3 = headersToObject(r3.headers)
    expect(r3.status).toBe(429)
    expect(h3['retry-after']).toBeDefined()
    expect(h3['x-ratelimit-remaining']).toBe('0')
    expect(Number(h3['x-ratelimit-limit'])).toBeGreaterThanOrEqual(2)
  })
})
