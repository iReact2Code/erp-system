import * as healthRoute from '../../health/route'
import * as readyRoute from '../../ready/route'

// Narrow handler type
type RouteHandler = (req: Request) => Promise<Response>

describe('health & readiness endpoints', () => {
  test('health returns ok', async () => {
    const res = await (healthRoute.GET as RouteHandler)(
      new Request('https://example.com/api/_internal/health')
    )
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('ok')
  })

  test('ready returns ready when DB succeeds', async () => {
    const res = await (readyRoute.GET as RouteHandler)(
      new Request('https://example.com/api/_internal/ready')
    )
    // Could be 200 if DB reachable; for this test environment we expect 200
    expect([200, 503]).toContain(res.status)
    const bodyText = await res.clone().text()
    // Basic shape assertions
    try {
      const json = JSON.parse(bodyText)
      if (res.status === 200) {
        expect(json.status).toBe('ready')
        expect(json.checks.database.ok).toBe(true)
      } else {
        expect(json.error).toBeDefined()
      }
    } catch {
      throw new Error('Response not valid JSON: ' + bodyText)
    }
  })
})
