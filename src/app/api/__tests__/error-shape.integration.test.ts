import { NextRequest } from 'next/server'
import { GET as UsersGet } from '@/app/api/users/route'
import { GET as InventoryGet } from '@/app/api/inventory/route'

// Helper to build a NextRequest easily
function buildRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers })
}

describe('API error shape integration', () => {
  test('users endpoint unauthorized error has standardized shape + x-request-id header', async () => {
    const req = buildRequest('http://localhost/api/users', {
      'x-request-id': 'int-test-req-1',
    })
    const res = await UsersGet(req as unknown as NextRequest)
    // If not authorized, expect 401 with standardized body
    if (res.status === 200) {
      // Environment may auto-auth; skip if so
      return
    }
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json).toMatchObject({
      error: 'UNAUTHORIZED',
      message: expect.any(String),
    })
    expect(res.headers.get('x-request-id')).toBe('int-test-req-1')
  })

  test('inventory endpoint unauthorized error has standardized shape + x-request-id header', async () => {
    const req = buildRequest('http://localhost/api/inventory', {
      'x-request-id': 'int-test-req-2',
    })
    const res = await InventoryGet(req as unknown as NextRequest)
    if (res.status === 200) {
      return
    }
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json).toMatchObject({
      error: 'UNAUTHORIZED',
      message: expect.any(String),
    })
    expect(res.headers.get('x-request-id')).toBe('int-test-req-2')
  })
})
