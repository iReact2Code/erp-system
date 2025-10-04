import { NextRequest } from 'next/server'
import { verifyAccessToken } from '@/lib/jwt-auth'
import { resetBruteForce } from '@/lib/brute-force-tracker'

// Mock next/server minimal
const cookieStore: Record<string, string> = {}
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: unknown, init?: { status?: number }) => {
        return {
          json: async () => body,
          body,
          cookies: {
            set: (name: string, value: string) => {
              cookieStore[name] = value
            },
            get: (name: string) =>
              cookieStore[name] ? { value: cookieStore[name] } : undefined,
          },
          status: init?.status || 200,
        }
      },
    },
    NextRequest: class {},
  }
})

// Mock DB
const mockUser = {
  id: 'u1',
  email: 'test@example.com',
  name: 'Tester',
  role: 'USER',
  hashedPassword: 'hashed', // not actually validated in bcrypt mock
}

jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findUnique: jest.fn(async ({ where }: { where: { email: string } }) => {
        if (where.email === mockUser.email) return mockUser
        return null
      }),
    },
  },
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(async (pw: string) => pw === 'password123'),
}))

// Mock jwt-auth to simplify token generation in unit tests and avoid crypto/env issues
jest.mock('@/lib/jwt-auth', () => {
  const user = {
    id: 'u1',
    email: 'test@example.com',
    name: 'Tester',
    role: 'USER',
  }
  return {
    issueAccessToken: () => 'ACCESS_TEST_TOKEN',
    issueRefreshToken: () => 'REFRESH_TEST_TOKEN',
    verifyAccessToken: (t: string) => (t === 'ACCESS_TEST_TOKEN' ? user : null),
    verifyRefreshToken: (t: string) =>
      t === 'REFRESH_TEST_TOKEN' ? user : null,
  }
})

// Use real jwt-auth implementation

describe('Auth Hardening', () => {
  beforeEach(() => {
    resetBruteForce()
    process.env.NEXTAUTH_SECRET = 'testsecret'
  })

  function makeReq(
    body: unknown,
    overrides: Partial<Record<string, unknown>> = {}
  ): NextRequest {
    interface MockReq {
      json: () => Promise<unknown>
      headers: Headers
      method: string
      [k: string]: unknown
    }
    const mock: MockReq = {
      json: async () => body,
      headers: new Headers({ 'content-type': 'application/json' }),
      method: 'POST',
      ...overrides,
    }
    return mock as unknown as NextRequest
  }

  test('successful login returns accessToken', async () => {
    process.env.NEXTAUTH_SECRET = 'testsecret'
    const { POST: login } = await import('@/app/api/login/route')
    const req = makeReq({ email: mockUser.email, password: 'password123' })
    const res = (await login(req)) as unknown as {
      json(): Promise<unknown>
      status?: number
    }
    const payload = (await res.json()) as Record<string, unknown>
    expect(payload).not.toHaveProperty('error')
    expect(payload.accessToken).toBeDefined()
    const decoded = verifyAccessToken(payload.accessToken as string)
    expect(decoded?.id).toBe(mockUser.id)
  })

  test('brute force lock triggers after failures', async () => {
    process.env.NEXTAUTH_SECRET = 'testsecret'
    const { POST: login } = await import('@/app/api/login/route')
    for (let i = 0; i < 5; i++) {
      const badReq = makeReq({ email: mockUser.email, password: 'wrongpw' })
      await login(badReq)
    }
    const lockedReq = makeReq({
      email: mockUser.email,
      password: 'password123',
    })
    const lockedRes = (await login(lockedReq)) as unknown as {
      json(): Promise<unknown>
      status?: number
    }
    const lockedPayload = (await lockedRes.json()) as Record<string, unknown>
    expect(lockedRes.status).toBe(429)
    expect(String(lockedPayload.error)).toMatch(/Too many/i)
  })

  test('refresh issues new access token (invalid fallback)', async () => {
    process.env.NEXTAUTH_SECRET = 'testsecret'
    const { POST: login } = await import('@/app/api/login/route')
    const loginReq = makeReq({ email: mockUser.email, password: 'password123' })
    const loginRes = (await login(loginReq)) as unknown as {
      json(): Promise<unknown>
      status?: number
    }
    const loginPayload = (await loginRes.json()) as Record<string, unknown>
    expect(loginPayload.accessToken).toBeDefined()
    const { POST: refresh } = await import('@/app/api/refresh/route')
    const refreshReq = {
      cookies: { get: () => ({ value: 'invalid' }) },
    } as unknown as NextRequest
    const refreshResInvalid = (await refresh(refreshReq)) as unknown as {
      json(): Promise<unknown>
      status?: number
    }
    const invalidPayload = (await refreshResInvalid.json()) as Record<
      string,
      unknown
    >
    expect(invalidPayload.error).toBeDefined()
  })
})
