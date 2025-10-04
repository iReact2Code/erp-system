jest.resetModules()
import type { NextRequest } from 'next/server'
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: unknown, opts?: Record<string, string> | undefined) => ({
        json: async () => body,
        headers: opts?.headers,
      }),
    },
    // provide a minimal NextRequest for typing if needed
    NextRequest: class {},
  }
})

import { getUserFromRequest } from '@/lib/jwt-auth'

jest.mock('@/lib/jwt-auth')
const mockFindMany = jest.fn()
const mockCount = jest.fn()
jest.mock('@/lib/db', () => ({
  db: { user: { findMany: mockFindMany, count: mockCount } },
}))

describe.skip('GET /api/users', () => {
  beforeAll(() => {
    ;(getUserFromRequest as unknown as jest.Mock).mockReturnValue({
      id: 'u1',
      email: 'sup@local',
      name: 'Supervisor',
      role: 'SUPERVISOR',
    })
  })

  it('returns paginated users when page param provided', async () => {
    // import after mocking next/server module
    const { GET } = await import('@/app/api/users/route')

    const mockUsers = [
      {
        id: '1',
        name: 'A',
        email: 'a@x.com',
        role: 'ADMIN',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'B',
        email: 'b@x.com',
        role: 'USER',
        createdAt: new Date().toISOString(),
      },
    ]

    // ensure mocked db export has the methods we expect
    const mockedDb = jest.requireMock('@/lib/db')
    mockedDb.db = {
      user: {
        findMany: jest.fn().mockResolvedValue(mockUsers),
        count: jest.fn().mockResolvedValue(2),
      },
    }

    const url = 'http://localhost/api/users?page=1&limit=2&q=a'
    const request = {
      url,
      headers: { get: (_: string) => null },
      cookies: { get: (_: string) => undefined },
    }

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const res = await GET(request as unknown as NextRequest)
    const json = await res.json()

    const jsonObj = json as unknown as Record<string, unknown>
    if (jsonObj && jsonObj.error) {
      // surface server logs to the test output
      consoleSpy.mockRestore()
      throw new Error(
        `Server returned error: ${String(jsonObj.error)} - logs: ${consoleSpy.mock.calls.map(c => c.join(' ')).join('\n')}`
      )
    }

    expect(json).toHaveProperty('data')
    expect(json).toHaveProperty('pagination')
    expect(json.pagination).toEqual(
      expect.objectContaining({ page: 1, limit: 2, total: 2 })
    )
    expect(Array.isArray(json.data)).toBe(true)
  })
})
