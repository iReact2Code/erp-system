import { NextRequest, NextResponse } from 'next/server'
import { auth } from './auth'
import { UserRole } from '@/types/api'
import {
  rateLimit,
  createRateLimitResponse,
  createUnauthorizedResponse,
  createForbiddenResponse,
} from './validation'

// Get user's IP address for rate limiting
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const real = req.headers.get('x-real-ip')
  const ip = forwarded ? forwarded.split(',')[0] : real || 'unknown'
  return ip
}

// Rate limiting middleware
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000,
  handler: (req: NextRequest) => Promise<Response | NextResponse>
) {
  return async (req: NextRequest) => {
    const ip = getClientIP(req)
    const { allowed, remaining, resetTime } = rateLimit(
      ip,
      maxRequests,
      windowMs
    )

    if (!allowed) {
      return createRateLimitResponse(resetTime)
    }

    const response = await handler(req)

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    response.headers.set('X-RateLimit-Reset', resetTime.toString())

    return response
  }
}

// Authentication middleware
export function withAuth(
  handler: (
    req: NextRequest,
    session: { user: { id: string; email: string; role: UserRole } }
  ) => Promise<Response | NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      const session = await auth()

      if (!session?.user) {
        return createUnauthorizedResponse()
      }

      // Ensure user has required fields
      if (!session.user.id || !session.user.email || !session.user.role) {
        return createUnauthorizedResponse()
      }

      return await handler(
        req,
        session as { user: { id: string; email: string; role: UserRole } }
      )
    } catch (error) {
      console.error('Authentication error:', error)
      return createUnauthorizedResponse()
    }
  }
}

// Role-based authorization middleware
export function withRole(
  allowedRoles: UserRole[],
  handler: (
    req: NextRequest,
    session: { user: { id: string; email: string; role: UserRole } }
  ) => Promise<Response | NextResponse>
) {
  return withAuth(async (req, session) => {
    if (!allowedRoles.includes(session.user.role)) {
      return createForbiddenResponse()
    }

    return await handler(req, session)
  })
}

// Admin-only middleware
export function withAdmin(
  handler: (
    req: NextRequest,
    session: { user: { id: string; email: string; role: UserRole } }
  ) => Promise<Response | NextResponse>
) {
  return withRole([UserRole.ADMIN], handler)
}

// Manager and Admin middleware
export function withManagerOrAdmin(
  handler: (
    req: NextRequest,
    session: { user: { id: string; email: string; role: UserRole } }
  ) => Promise<Response | NextResponse>
) {
  return withRole([UserRole.ADMIN, UserRole.SUPERVISOR], handler)
}

// User can access their own data or admin/manager can access any data
export function withOwnershipOrRole(
  allowedRoles: UserRole[],
  getUserIdFromRequest: (req: NextRequest) => string | null,
  handler: (
    req: NextRequest,
    session: { user: { id: string; email: string; role: UserRole } }
  ) => Promise<Response | NextResponse>
) {
  return withAuth(async (req, session) => {
    const requestedUserId = getUserIdFromRequest(req)

    // Allow if user is accessing their own data
    if (requestedUserId === session.user.id) {
      return await handler(req, session)
    }

    // Allow if user has required role
    if (allowedRoles.includes(session.user.role)) {
      return await handler(req, session)
    }

    return createForbiddenResponse()
  })
}

// CSRF protection middleware (simplified)
export function withCSRF(
  handler: (req: NextRequest) => Promise<Response | NextResponse>
) {
  return async (req: NextRequest) => {
    // Skip CSRF for GET requests
    if (req.method === 'GET') {
      return await handler(req)
    }

    const csrfToken = req.headers.get('x-csrf-token')

    if (!csrfToken) {
      return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 })
    }

    // Simple CSRF validation (in production, use proper token validation)
    if (csrfToken.length < 16) {
      return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 })
    }

    return await handler(req)
  }
}

// Combine multiple middleware (simplified)
export function withSecurity(options: {
  auth?: boolean
  roles?: UserRole[]
  rateLimit?: { maxRequests?: number; windowMs?: number }
  csrf?: boolean
}) {
  return function (
    handler: (req: NextRequest) => Promise<Response | NextResponse>
  ) {
    let wrappedHandler = handler

    // Apply CSRF protection
    if (options.csrf) {
      wrappedHandler = withCSRF(wrappedHandler)
    }

    // Apply rate limiting
    if (options.rateLimit) {
      const { maxRequests = 100, windowMs = 15 * 60 * 1000 } = options.rateLimit
      wrappedHandler = withRateLimit(maxRequests, windowMs, wrappedHandler)
    }

    return wrappedHandler
  }
}

// Method-specific middleware
export function withMethods(
  allowedMethods: string[],
  handler: (req: NextRequest) => Promise<Response | NextResponse>
) {
  return async (req: NextRequest) => {
    if (!allowedMethods.includes(req.method || '')) {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405, headers: { Allow: allowedMethods.join(', ') } }
      )
    }

    return await handler(req)
  }
}

// Logging middleware
export function withLogging(
  handler: (req: NextRequest) => Promise<Response | NextResponse>
) {
  return async (req: NextRequest) => {
    const start = Date.now()
    const ip = getClientIP(req)

    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${ip}`
    )

    try {
      const response = await handler(req)
      const duration = Date.now() - start

      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.url} - ${
          response.status
        } - ${duration}ms`
      )

      return response
    } catch (error) {
      const duration = Date.now() - start
      console.error(
        `[${new Date().toISOString()}] ${req.method} ${
          req.url
        } - ERROR - ${duration}ms:`,
        error
      )
      throw error
    }
  }
}
