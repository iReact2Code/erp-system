import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, JWTUser } from './jwt-auth'

export function createUnauthorizedResponse(): Response {
  return new Response('Unauthorized', { status: 401 })
}

export function createForbiddenResponse(): Response {
  return new Response('Forbidden', { status: 403 })
}

export function createRateLimitResponse(): Response {
  return new Response('Too Many Requests', { status: 429 })
}

export function withAuth(
  handler: (req: NextRequest, user: JWTUser) => Promise<Response | NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const user = getUserFromRequest(req)
      if (!user) {
        return createUnauthorizedResponse()
      }
      return await handler(req, user)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return createUnauthorizedResponse()
    }
  }
}
