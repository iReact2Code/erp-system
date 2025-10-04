/**
 * Integration-style tests invoking exported route handlers directly.
 * These do not spin up Next.js server, but exercise handler layers,
 * auth + validation + correlation header injection.
 */

import * as userRoute from '../users/route'
import * as inventoryRoute from '../inventory/route'

// We'll mock auth + services to keep deterministic.
jest.mock('@/lib/jwt-auth', () => {
  const original = jest.requireActual('@/lib/jwt-auth')
  return {
    ...original,
    getUserFromRequest: jest.fn(),
    requireAuth: jest.fn(user => {
      if (!user) throw new Error('Unauthorized')
    }),
  }
})

jest.mock('@/server/services/user-service', () => ({
  UserService: class {
    async list() {
      return [{ id: 'u1', email: 'test@example.com' }]
    }
  },
}))

jest.mock('@/server/repositories/user-repository', () => ({
  UserRepository: class {},
}))

jest.mock('@/server/services/inventory-service', () => ({
  InventoryService: class {
    async list() {
      return { items: [], page: 1, limit: 25, total: 0 }
    }
    async create(input: Record<string, unknown>) {
      return { id: 'inv1', ...input }
    }
  },
}))

jest.mock('@/server/repositories/inventory-repository', () => ({
  InventoryRepository: class {},
}))

import { getUserFromRequest } from '@/lib/jwt-auth'

const asMock = (fn: unknown) => fn as jest.Mock

// Narrow handler signatures for tests (they accept standard Request per wrapper design)
type RouteHandler = (req: Request) => Promise<Response>

function collectHeaders(res: Response) {
  const out: Record<string, string> = {}
  for (const [k, v] of res.headers as Headers) out[k] = v
  return out
}

describe('Route handlers integration', () => {
  beforeEach(() => {
    asMock(getUserFromRequest).mockReset()
  })

  test('users GET unauthorized returns 401 shape with correlation headers', async () => {
    asMock(getUserFromRequest).mockReturnValue(undefined)
    const req = new Request('https://example.com/api/users')
    const res = await (userRoute.GET as RouteHandler)(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBeDefined()
    const headers = collectHeaders(res)
    expect(headers['x-request-id']).toBeTruthy()
    expect(headers['x-trace-id']).toBeTruthy()
  })

  test('users GET authorized returns list + headers', async () => {
    asMock(getUserFromRequest).mockReturnValue({
      id: 'u1',
      role: 'ADMIN',
      email: 'test@example.com',
    })
    const req = new Request('https://example.com/api/users')
    const res = await (userRoute.GET as RouteHandler)(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    const headers = collectHeaders(res)
    expect(headers['x-request-id']).toBeTruthy()
    expect(headers['x-trace-id']).toBeTruthy()
  })

  test('inventory POST validation error returns 400 with details', async () => {
    asMock(getUserFromRequest).mockReturnValue({
      id: 'u1',
      role: 'ADMIN',
      email: 'test@example.com',
    })
    const req = new Request('https://example.com/api/inventory', {
      method: 'POST',
      body: JSON.stringify({
        /* missing fields */
      }),
      headers: { 'content-type': 'application/json' },
    })
    const res = await (inventoryRoute.POST as RouteHandler)(req)
    // Expect validation failure: BODY_INVALID (400)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
    const headers = collectHeaders(res)
    expect(headers['x-request-id']).toBeTruthy()
    expect(headers['x-trace-id']).toBeTruthy()
  })

  test('inventory POST success returns created item + correlation headers', async () => {
    asMock(getUserFromRequest).mockReturnValue({
      id: 'u1',
      role: 'ADMIN',
      email: 'test@example.com',
    })
    const bodyObj = { name: 'Widget', sku: 'W-1', unitPrice: 10 }
    const bodyStr = JSON.stringify(bodyObj)
    const req = new Request('https://example.com/api/inventory', {
      method: 'POST',
      body: bodyStr,
      headers: { 'content-type': 'application/json' },
    })
    ;(req as any)._body = bodyStr
    const res = await (inventoryRoute.POST as RouteHandler)(req)
    const debugText = await res.clone().text()
    console.log('POST_SUCCESS_DIAG', res.status, debugText)
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.name).toBe('Widget')
    expect(json.sku).toBe('W-1')
    const headers = collectHeaders(res)
    expect(headers['x-request-id']).toBeTruthy()
    expect(headers['x-trace-id']).toBeTruthy()
  })
})
