// Avoid hard dependency on NextResponse so helpers work in plain test env.
import { serializeError } from './logger'
import { reportError } from './error-reporter'

export interface ApiErrorOptions {
  status?: number
  code: string
  message: string
  details?: unknown
  headers?: Record<string, string>
}

export function apiError(opts: ApiErrorOptions) {
  const { status = 400, code, message, details, headers = {} } = opts
  const body: Record<string, unknown> = {
    error: code,
    message,
  }
  if (details) body.details = details
  // Auto-inject x-request-id if present in headers (case-insensitive)
  const finalHeaders = { ...headers }
  const reqId = headers['x-request-id'] || headers['X-Request-Id']
  if (!reqId && typeof headers === 'object') {
    // Try to find x-request-id in any case
    for (const k in headers) {
      if (k.toLowerCase() === 'x-request-id') {
        finalHeaders['x-request-id'] = headers[k]
        break
      }
    }
  }
  const response = new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...finalHeaders,
    },
  })
  if (status >= 500) {
    // Report server-side errors through centralized hook
    reportError(new Error(message), { code, details })
  }
  return response
}

// Standardized success response helper (mirrors apiError header behavior)
export interface ApiSuccessOptions<T = unknown> {
  status?: number
  data: T
  headers?: Record<string, string>
  /**
   * Provide a strong ETag value (without quotes) or true to auto-generate based on JSON body hash (sha1 length-40 hex).
   * If provided and request supplies If-None-Match that matches, a 304 is returned with no body.
   */
  etag?: string | true
  /** Raw request headers for conditional ETag evaluation */
  requestHeaders?: Headers | Record<string, string> | undefined
}

function computeBodyHash(json: string) {
  // Lightweight hash (FNV-1a 32-bit) to avoid bringing in crypto for tests; acceptable for cache validation, not security.
  let hash = 0x811c9dc5
  for (let i = 0; i < json.length; i++) {
    hash ^= json.charCodeAt(i)
    hash = (hash * 0x01000193) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

export function apiSuccess<T = unknown>(opts: ApiSuccessOptions<T>) {
  const { status = 200, data, headers = {}, etag, requestHeaders } = opts
  const finalHeaders = { ...headers }
  // Normalize x-request-id casing if provided
  if (!finalHeaders['x-request-id']) {
    for (const k in finalHeaders) {
      if (k.toLowerCase() === 'x-request-id') {
        finalHeaders['x-request-id'] = finalHeaders[k]
        break
      }
    }
  }

  let bodyString: string | null = null
  let etagValue: string | undefined
  if (etag) {
    if (etag === true) {
      bodyString = JSON.stringify(data)
      etagValue = 'W/"' + computeBodyHash(bodyString) + '"'
    } else {
      etagValue =
        etag.startsWith('W/') || etag.startsWith('"') ? etag : '"' + etag + '"'
    }
    finalHeaders['ETag'] = etagValue
    // Conditional request handling
    const ifNoneMatch =
      (requestHeaders instanceof Headers
        ? requestHeaders.get('if-none-match')
        : requestHeaders &&
          Object.entries(requestHeaders).find(
            ([k]) => k.toLowerCase() === 'if-none-match'
          )?.[1]) || undefined
    if (ifNoneMatch && etagValue) {
      const candidates = ifNoneMatch.split(/\s*,\s*/)
      const normalized = (v: string) =>
        v.replace(/^W\//, '').replace(/^"|"$/g, '')
      const targetNorm = normalized(etagValue)
      const match = candidates.some(c => {
        const cNorm = normalized(c)
        return c === etagValue || cNorm === targetNorm
      })
      if (match) {
        return new Response(null, {
          status: 304,
          headers: {
            ...finalHeaders,
          },
        })
      }
    }
  }
  if (!bodyString) bodyString = JSON.stringify(data)
  return new Response(bodyString, {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...finalHeaders,
    },
  })
}

export function wrapHandler<
  T extends (...args: unknown[]) => Promise<Response>,
>(handler: T) {
  return async (...args: Parameters<T>) => {
    try {
      return await handler(...args)
    } catch (err) {
      const details =
        process.env.NODE_ENV === 'development' ? serializeError(err) : undefined
      reportError(err, { wrapper: 'wrapHandler' })
      return apiError({
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details,
      })
    }
  }
}

export function unauthorized(headers?: Record<string, string>) {
  return apiError({
    status: 401,
    code: 'UNAUTHORIZED',
    message: 'Unauthorized',
    headers,
  })
}
export function forbidden(headers?: Record<string, string>) {
  return apiError({
    status: 403,
    code: 'FORBIDDEN',
    message: 'Forbidden',
    headers,
  })
}
export function notFound(headers?: Record<string, string>) {
  return apiError({
    status: 404,
    code: 'NOT_FOUND',
    message: 'Not found',
    headers,
  })
}
export function tooManyRequests(
  retryAfterSeconds: number,
  headers?: Record<string, string>
) {
  return apiError({
    status: 429,
    code: 'RATE_LIMITED',
    message: 'Too many requests',
    headers: { 'Retry-After': String(retryAfterSeconds), ...headers },
  })
}

export function validationFailed(
  details: unknown,
  headers?: Record<string, string>
) {
  return apiError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details,
    headers,
  })
}
