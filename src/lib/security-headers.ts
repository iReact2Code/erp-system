import { NextRequest, NextResponse } from 'next/server'
import { createLogger, serializeError } from '@/lib/logger'
import { buildCSP, extractNonceHeader } from '@/lib/csp'

// Scoped logger for security & CORS events
const securityLog = createLogger('security')

/**
 * Security headers configuration
 */
function buildSecurityHeaders(nonce?: string) {
  const csp = nonce
    ? buildCSP(nonce)
    : [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')

  return {
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',

    // Prevent clickjacking
    'X-Frame-Options': 'DENY',

    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',

    // Control referrer information
    'Referrer-Policy': 'strict-origin-when-cross-origin',

    // Prevent downloads of untrusted content
    'X-Download-Options': 'noopen',

    // Prevent content type sniffing
    'X-Permitted-Cross-Domain-Policies': 'none',

    // Content Security Policy (nonce-aware)
    'Content-Security-Policy': csp,

    // Strict Transport Security (HTTPS only)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

    // Permissions Policy (use widely recognized features only)
    'Permissions-Policy': [
      'accelerometer=()',
      'camera=()',
      'fullscreen=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'picture-in-picture=()',
    ].join(', '),
  }
}

/**
 * CORS configuration
 */
const CORS_OPTIONS = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-CSRF-Token',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  const nonce = extractNonceHeader(response.headers) || undefined
  const headers = buildSecurityHeaders(nonce)
  Object.entries(headers).forEach(([key, value]) =>
    response.headers.set(key, value)
  )
  return response
}

/**
 * Handle CORS preflight requests
 */
export function handleCORS(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin')

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })

    // Check if origin is allowed
    if (origin && CORS_OPTIONS.origin.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }

    response.headers.set(
      'Access-Control-Allow-Methods',
      CORS_OPTIONS.methods.join(', ')
    )
    response.headers.set(
      'Access-Control-Allow-Headers',
      CORS_OPTIONS.allowedHeaders.join(', ')
    )
    response.headers.set(
      'Access-Control-Max-Age',
      CORS_OPTIONS.maxAge.toString()
    )

    if (CORS_OPTIONS.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }

    return applySecurityHeaders(response)
  }

  return null
}

/**
 * Apply CORS headers to regular responses
 */
export function applyCORSHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const origin = request.headers.get('origin')

  if (origin && CORS_OPTIONS.origin.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  if (CORS_OPTIONS.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

/**
 * Enhanced middleware wrapper with security features
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async function secureHandler(req: NextRequest): Promise<NextResponse> {
    try {
      // Handle CORS preflight
      const corsResponse = handleCORS(req)
      if (corsResponse) {
        return corsResponse
      }

      // Call the original handler
      const response = await handler(req)

      // Apply security headers
      applySecurityHeaders(response)

      // Apply CORS headers
      applyCORSHeaders(response, req)

      return response
    } catch (error) {
      securityLog.error('middleware_error', { error: serializeError(error) })

      const errorResponse = NextResponse.json(
        {
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )

      return applySecurityHeaders(errorResponse)
    }
  }
}

/**
 * IP address extraction with proxy support
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for the real IP
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIP = request.headers.get('x-real-ip')
  const xClientIP = request.headers.get('x-client-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip') // Cloudflare

  if (xForwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return xForwardedFor.split(',')[0].trim()
  }

  if (xRealIP) return xRealIP
  if (xClientIP) return xClientIP
  if (cfConnectingIP) return cfConnectingIP

  return 'unknown'
}

/**
 * Request fingerprinting for security monitoring
 */
export function generateRequestFingerprint(request: NextRequest): string {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const acceptLanguage = request.headers.get('accept-language') || 'unknown'
  const method = request.method
  const url = request.url

  // Create a hash of identifying information
  const fingerprint = Buffer.from(
    `${ip}:${userAgent}:${acceptLanguage}:${method}:${url}`
  ).toString('base64')

  return fingerprint
}

/**
 * Enhanced logging for security events
 */
export function logSecurityEvent(
  event: string,
  request: NextRequest,
  details?: Record<string, unknown>
) {
  const timestamp = new Date().toISOString()
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent')
  const fingerprint = generateRequestFingerprint(request)

  const logEntry = {
    timestamp,
    event,
    ip,
    userAgent,
    fingerprint,
    method: request.method,
    url: request.url,
    ...details,
  }

  // Structured log of the security event (info level)
  securityLog.info('event', logEntry)
  // TODO: Future: enrich with trace/span IDs once OpenTelemetry integrated
  return logEntry
}
