import { NextResponse } from 'next/server'
import { ApiResponse } from '@/types/api'

export class ApiErrorHandler {
  static unauthorized(message = 'Unauthorized'): NextResponse<ApiResponse> {
    return NextResponse.json({ error: message }, { status: 401 })
  }

  static forbidden(message = 'Forbidden'): NextResponse<ApiResponse> {
    return NextResponse.json({ error: message }, { status: 403 })
  }

  static notFound(message = 'Resource not found'): NextResponse<ApiResponse> {
    return NextResponse.json({ error: message }, { status: 404 })
  }

  static badRequest(
    message = 'Bad request',
    errors?: { field: string; message: string }[]
  ): NextResponse<ApiResponse> {
    return NextResponse.json(
      { error: message, ...(errors && { errors }) },
      { status: 400 }
    )
  }

  static internalError(
    message = 'Internal server error'
  ): NextResponse<ApiResponse> {
    return NextResponse.json({ error: message }, { status: 500 })
  }

  static success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      data,
      ...(message && { message }),
    })
  }

  static created<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
      {
        data,
        ...(message && { message }),
      },
      { status: 201 }
    )
  }
}

// Auth middleware helper (server-side)
export async function requireAuth() {
  const { auth } = await import('@/lib/auth')
  const session = await auth()

  if (!session) {
    throw new Error('UNAUTHORIZED')
  }

  return session
}

// Role-based access control helper (server-side)
export function requireRole(
  session: { user?: { role?: string } },
  allowedRoles: string[]
) {
  if (!allowedRoles.includes(session.user?.role || '')) {
    throw new Error('FORBIDDEN')
  }
}

// Centralized error handling wrapper (server-side)
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof Error) {
        switch (error.message) {
          case 'UNAUTHORIZED':
            return ApiErrorHandler.unauthorized()
          case 'FORBIDDEN':
            return ApiErrorHandler.forbidden()
          case 'NOT_FOUND':
            return ApiErrorHandler.notFound()
          case 'BAD_REQUEST':
            return ApiErrorHandler.badRequest()
          default:
            return ApiErrorHandler.internalError()
        }
      }

      return ApiErrorHandler.internalError()
    }
  }
}
