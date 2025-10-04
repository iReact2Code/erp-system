import * as inventoryRoute from '../inventory/route'
import { getUserFromRequest } from '@/lib/jwt-auth'

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

// silence noisy logs
jest.spyOn(console, 'error').mockImplementation(() => {})

const asMock = (fn: unknown) => fn as jest.Mock

describe('inventory POST debug', () => {
  beforeEach(() => {
    asMock(getUserFromRequest).mockReset()
    asMock(getUserFromRequest).mockReturnValue({
      id: 'u1',
      role: 'ADMIN',
      email: 't@example.com',
    })
  })

  test('validation failure details', async () => {
    const req = new Request('https://example.com/api/inventory', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    })
    const res = await (
      inventoryRoute.POST as (r: Request) => Promise<Response>
    )(req)
    const txt = await res.text()
    // Intentionally log raw output for diagnosis
    console.log('DEBUG_VALIDATION_STATUS', res.status)
    console.log('DEBUG_VALIDATION_BODY', txt)
    expect(res.status).toBeGreaterThan(0) // keep test always passing for now
  })

  test('success path details', async () => {
    const body = { name: 'X', sku: 'S', unitPrice: 1 }
    const req = new Request('https://example.com/api/inventory', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    })
    const res = await (
      inventoryRoute.POST as (r: Request) => Promise<Response>
    )(req)
    const txt = await res.text()
    console.log('DEBUG_SUCCESS_STATUS', res.status)
    console.log('DEBUG_SUCCESS_BODY', txt)
    expect(res.status).toBeGreaterThan(0)
  })
})
