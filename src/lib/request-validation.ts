import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'

// Simple rate limiting implementation
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

async function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number
): Promise<{ success: boolean; retryAfter?: number }> {
  const now = Date.now()
  const key = ip
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true }
  }

  if (record.count >= maxRequests) {
    return {
      success: false,
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    }
  }

  record.count++
  return { success: true }
}

// Request size limits (in bytes)
const MAX_REQUEST_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_JSON_SIZE = 1 * 1024 * 1024 // 1MB

// Content type validation
const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
]

// File upload validation
const ALLOWED_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.pdf',
  '.csv',
  '.xlsx',
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Enhanced request validation middleware with security checks
 */
export function withRequestValidation<T>(
  schema: ZodSchema<T>,
  options: {
    requireAuth?: boolean
    rateLimit?: { requests: number; windowMs: number }
    allowedMethods?: string[]
    checkContentType?: boolean
    maxFileSize?: number
  } = {}
) {
  return function (
    handler: (req: NextRequest, validatedData: T) => Promise<NextResponse>
  ) {
    return async function (req: NextRequest) {
      try {
        // Method validation
        if (
          options.allowedMethods &&
          !options.allowedMethods.includes(req.method)
        ) {
          return NextResponse.json(
            { error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' },
            { status: 405 }
          )
        }

        // Content type validation
        if (options.checkContentType && req.method !== 'GET') {
          const contentType = req.headers.get('content-type')
          if (
            !contentType ||
            !ALLOWED_CONTENT_TYPES.some(type => contentType.includes(type))
          ) {
            return NextResponse.json(
              {
                error: 'Unsupported content type',
                code: 'INVALID_CONTENT_TYPE',
              },
              { status: 415 }
            )
          }
        }

        // Rate limiting
        if (options.rateLimit) {
          const ip =
            req.headers.get('x-forwarded-for') ||
            req.headers.get('x-real-ip') ||
            'unknown'
          const rateLimitResult = await checkRateLimit(
            ip,
            options.rateLimit.requests,
            options.rateLimit.windowMs
          )
          if (!rateLimitResult.success) {
            return NextResponse.json(
              {
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: rateLimitResult.retryAfter,
              },
              { status: 429 }
            )
          }
        }

        // Request size validation
        const contentLength = req.headers.get('content-length')
        if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
          return NextResponse.json(
            { error: 'Request too large', code: 'REQUEST_TOO_LARGE' },
            { status: 413 }
          )
        }

        // Parse and validate request data
        let data: unknown
        try {
          if (req.method === 'GET') {
            // For GET requests, validate query parameters
            const searchParams = Object.fromEntries(
              req.nextUrl.searchParams.entries()
            )
            data = searchParams
          } else {
            // For POST/PUT/PATCH requests, validate body
            const body = await req.text()

            // Check JSON size
            if (body.length > MAX_JSON_SIZE) {
              return NextResponse.json(
                { error: 'JSON payload too large', code: 'JSON_TOO_LARGE' },
                { status: 413 }
              )
            }

            // Parse JSON
            try {
              data = JSON.parse(body)
            } catch {
              return NextResponse.json(
                { error: 'Invalid JSON format', code: 'INVALID_JSON' },
                { status: 400 }
              )
            }
          }
        } catch {
          return NextResponse.json(
            { error: 'Failed to parse request data', code: 'PARSE_ERROR' },
            { status: 400 }
          )
        }

        // Schema validation
        const validationResult = schema.safeParse(data)
        if (!validationResult.success) {
          const errorDetails = validationResult.error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          }))

          return NextResponse.json(
            {
              error: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: errorDetails,
            },
            { status: 400 }
          )
        }

        // Call the actual handler with validated data
        return await handler(req, validationResult.data)
      } catch (error) {
        console.error('Request validation error:', error)
        return NextResponse.json(
          { error: 'Internal server error', code: 'INTERNAL_ERROR' },
          { status: 500 }
        )
      }
    }
  }
}

/**
 * File upload validation
 */
export function validateFileUpload(
  file: File,
  options?: {
    maxSize?: number
    allowedExtensions?: string[]
  }
): { valid: boolean; error?: string } {
  const maxSize = options?.maxSize || MAX_FILE_SIZE
  const allowedExtensions =
    options?.allowedExtensions || ALLOWED_FILE_EXTENSIONS

  // Size validation
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
    }
  }

  // Extension validation
  const fileName = file.name.toLowerCase()
  const hasValidExtension = allowedExtensions.some(ext =>
    fileName.endsWith(ext)
  )

  if (!hasValidExtension) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Response validation and sanitization
 */
export function sanitizeResponse<T>(data: T): T {
  if (typeof data !== 'object' || data === null) {
    return data
  }

  const sanitized = { ...data } as Record<string, unknown>

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash']

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      delete sanitized[field]
    }
  }

  // Recursively sanitize nested objects
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeResponse(sanitized[key])
    }
  }

  return sanitized as T
}

/**
 * API response wrapper with security headers
 */
export function createSecureResponse(data: unknown, status: number = 200) {
  const response = NextResponse.json(sanitizeResponse(data), { status })

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'")

  return response
}

/**
 * Enhanced error response with security considerations
 */
export function createErrorResponse(
  message: string,
  code: string,
  status: number = 400,
  details?: Record<string, unknown>
) {
  const response = NextResponse.json(
    {
      error: message,
      code,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && details ? { details } : {}),
    },
    { status }
  )

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')

  return response
}
