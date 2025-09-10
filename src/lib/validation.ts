import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'

// Generic validation utility
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map(err => {
        const path = err.path.join('.')
        return path ? `${path}: ${err.message}` : err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: ['Invalid data format'] }
  }
}

// Middleware for API route validation
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (
    req: NextRequest,
    validatedData: T
  ) => Promise<Response | NextResponse>
) {
  return async (req: NextRequest) => {
    try {
      let data: unknown

      // Handle different HTTP methods
      if (req.method === 'GET') {
        // Parse query parameters
        const url = new URL(req.url)
        data = Object.fromEntries(url.searchParams.entries())

        // Convert string values to appropriate types for GET requests
        const convertedData: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(
          data as Record<string, string>
        )) {
          // Try to convert numeric strings to numbers
          if (!isNaN(Number(value)) && value !== '') {
            convertedData[key] = Number(value)
          }
          // Convert boolean strings
          else if (value === 'true' || value === 'false') {
            convertedData[key] = value === 'true'
          }
          // Keep as string
          else {
            convertedData[key] = value
          }
        }
        data = convertedData
      } else {
        // Parse JSON body for POST, PUT, DELETE
        try {
          data = await req.json()
        } catch {
          return NextResponse.json(
            { error: 'Invalid JSON in request body' },
            { status: 400 }
          )
        }
      }

      // Validate the data
      const validation = validateData(schema, data)

      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.errors,
          },
          { status: 400 }
        )
      }

      // Call the handler with validated data
      return await handler(req, validation.data)
    } catch (error) {
      console.error('Validation middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Sanitization utilities
export function sanitizeString(str: string): string {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\0/g, '') // Remove null bytes
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function sanitizeObject(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

// Rate limiting utilities (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const existing = rateLimitMap.get(identifier)

  if (!existing || now > existing.resetTime) {
    // Reset window
    const resetTime = now + windowMs
    rateLimitMap.set(identifier, { count: 1, resetTime })
    return { allowed: true, remaining: maxRequests - 1, resetTime }
  }

  if (existing.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime }
  }

  existing.count++
  rateLimitMap.set(identifier, existing)
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetTime: existing.resetTime,
  }
}

// CSRF protection utilities
export function generateCSRFToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken && token.length === 32
}

// Input validation helpers
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && date.toISOString() === dateString
}

// Error response helpers
export function createValidationErrorResponse(errors: string[]): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: errors,
    },
    { status: 400 }
  )
}

export function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function createForbiddenResponse(): NextResponse {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export function createNotFoundResponse(): NextResponse {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export function createRateLimitResponse(resetTime: number): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests' },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
        'X-RateLimit-Reset': resetTime.toString(),
      },
    }
  )
}

export function createServerErrorResponse(): NextResponse {
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
}
