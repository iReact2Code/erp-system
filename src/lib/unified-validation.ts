// Avoid relying on NextResponse in validation error helper so tests can run in plain fetch env.
import { z, ZodTypeAny, ZodError } from 'zod'

export interface ValidatorSchemas<
  B extends ZodTypeAny | undefined,
  Q extends ZodTypeAny | undefined,
  P extends ZodTypeAny | undefined,
> {
  body?: B
  query?: Q
  params?: P
}

export interface ValidatorOptions {
  maxJsonBytes?: number
  allowEmptyBody?: boolean
  coerceQuery?: boolean
  requireContentType?: boolean
  acceptedContentTypes?: string[]
  /** Recursively trim all string fields in parsed objects (body/query/params) */
  trimStrings?: boolean
  /** Optional custom sanitize hooks executed AFTER successful schema parsing */
  sanitize?: {
    body?: (value: unknown) => unknown
    query?: (value: unknown) => unknown
    params?: (value: unknown) => unknown
  }
}

export interface ValidationResult<Body, Query, Params> {
  body: Body
  query: Query
  params: Params
}

export class HttpError extends Error {
  status: number
  code: string
  details?: unknown
  constructor(
    status: number,
    code: string,
    message: string,
    details?: unknown
  ) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

// Type guard that tolerates multiple module copies (avoids instanceof pitfalls in tests)
export function isHttpError(e: unknown): e is HttpError {
  return (
    e instanceof HttpError ||
    (typeof e === 'object' &&
      e !== null &&
      'status' in e &&
      'code' in e &&
      'message' in e)
  )
}

function formatZodError(err: ZodError) {
  return err.issues.map(issue => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
    code: issue.code,
  }))
}

async function parseJsonSafely(
  req: Request,
  maxBytes: number
): Promise<unknown> {
  // Some upstream middleware or auth extraction might have already consumed the body.
  // Attempt to recover via (req as any)._body first if available (Jest/fetch polyfills),
  // otherwise fall back to req.text(). If already consumed and no cache, treat as empty.
  const anyReq = req as unknown as {
    _body?: unknown
    bodyUsed?: boolean
    [k: string]: unknown
  }
  let text: string = ''
  if (typeof anyReq._body === 'string') {
    text = anyReq._body
  } else {
    try {
      if (anyReq.bodyUsed) {
        // body already consumed with no cached copy
        text = ''
      } else {
        text = await req.text()
        // stash for potential subsequent parses (tests calling twice)
        anyReq._body = text
      }
    } catch {
      text = ''
    }
  }
  if (process.env.NODE_ENV === 'test') {
    try {
      console.error('[PARSE_JSON_SAFELY]', {
        len: text.length,
        startsWith: text.slice(0, 20),
        bodyUsed: anyReq.bodyUsed,
        hasCached: typeof anyReq._body === 'string',
      })
    } catch {}
  }
  if (text.length === 0) return undefined
  // Fallback: if empty but content-type suggests JSON and cached raw exists
  if (text.length === 0) {
    try {
      const ct = req.headers.get('content-type') || ''
      if (ct.includes('application/json')) {
        const anyReq2 = req as unknown as { _body?: unknown }
        if (typeof anyReq2._body === 'string' && anyReq2._body.length > 0) {
          try {
            return JSON.parse(anyReq2._body)
          } catch {}
        }
      }
    } catch {}
  }
  if (text.length > maxBytes) {
    throw new HttpError(413, 'JSON_TOO_LARGE', 'JSON payload too large')
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new HttpError(400, 'INVALID_JSON', 'Invalid JSON')
  }
}

function coerceQueryValues(
  obj: Record<string, string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === 'true' || v === 'false') {
      out[k] = v === 'true'
      continue
    }
    const num = Number(v)
    if (!isNaN(num) && v.trim() !== '') {
      out[k] = num
      continue
    }
    out[k] = v
  }
  return out
}

export function buildValidator<
  B extends ZodTypeAny | undefined,
  Q extends ZodTypeAny | undefined,
  P extends ZodTypeAny | undefined,
>(schemas: ValidatorSchemas<B, Q, P>, options: ValidatorOptions = {}) {
  const {
    maxJsonBytes = 1024 * 1024,
    allowEmptyBody = false,
    coerceQuery = true,
    requireContentType = true,
    acceptedContentTypes = ['application/json'],
    trimStrings = false,
    sanitize,
  } = options

  function deepTrim(value: unknown): unknown {
    if (!trimStrings) return value
    if (typeof value === 'string') return value.trim()
    if (Array.isArray(value)) return value.map(v => deepTrim(v))
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = deepTrim(v)
      }
      return out
    }
    return value
  }

  function applySanitize<T>(value: T, which: 'body' | 'query' | 'params'): T {
    let v: unknown = value
    v = deepTrim(v)
    const hook = sanitize?.[which]
    if (hook) {
      try {
        v = hook(v)
      } catch {
        throw new HttpError(
          500,
          'SANITIZE_FAILED',
          `Sanitizer failed for ${which}`
        )
      }
    }
    return v as T
  }

  return async function validate(
    req: Request & { nextUrl?: URL },
    routeParams: unknown = {}
  ): Promise<
    ValidationResult<
      B extends ZodTypeAny ? z.infer<B> : undefined,
      Q extends ZodTypeAny ? z.infer<Q> : undefined,
      P extends ZodTypeAny ? z.infer<P> : undefined
    >
  > {
    try {
      // Params
      let paramsValue: z.infer<NonNullable<typeof schemas.params>> | undefined =
        undefined
      if (schemas.params) {
        const result = schemas.params.safeParse(routeParams)
        if (!result.success) {
          throw new HttpError(
            400,
            'PARAMS_INVALID',
            'Invalid route params',
            formatZodError(result.error)
          )
        }
        paramsValue = result.data as z.infer<NonNullable<typeof schemas.params>>
      }

      // Query
      let queryValue: z.infer<NonNullable<typeof schemas.query>> | undefined =
        undefined
      if (schemas.query) {
        const candidate = (req as unknown as { nextUrl?: URL }).nextUrl
        const searchParams =
          candidate instanceof URL
            ? candidate.searchParams
            : new URL(req.url).searchParams
        const rawQuery = Object.fromEntries(searchParams.entries())
        const source = coerceQuery ? coerceQueryValues(rawQuery) : rawQuery
        const result = schemas.query.safeParse(source)
        if (!result.success) {
          throw new HttpError(
            400,
            'QUERY_INVALID',
            'Invalid query params',
            formatZodError(result.error)
          )
        }
        queryValue = result.data as z.infer<NonNullable<typeof schemas.query>>
      }

      // Body
      let bodyValue: z.infer<NonNullable<typeof schemas.body>> | undefined =
        undefined
      if (schemas.body) {
        if (requireContentType) {
          const ct = req.headers.get('content-type') || ''
          if (!acceptedContentTypes.some(t => ct.includes(t))) {
            throw new HttpError(
              415,
              'UNSUPPORTED_CONTENT_TYPE',
              'Unsupported content type',
              { acceptedContentTypes }
            )
          }
        }
        const json = await parseJsonSafely(req, maxJsonBytes)
        if (json === undefined && !allowEmptyBody) {
          throw new HttpError(400, 'BODY_REQUIRED', 'Request body required')
        }
        const result = schemas.body.safeParse(json)
        if (!result.success) {
          throw new HttpError(
            400,
            'BODY_INVALID',
            'Invalid request body',
            formatZodError(result.error)
          )
        }
        bodyValue = result.data as z.infer<NonNullable<typeof schemas.body>>
      }

      // Apply trimming + custom sanitizers post-parse to retain schema guarantees
      const finalBody = applySanitize(
        bodyValue as B extends ZodTypeAny ? z.infer<B> : undefined,
        'body'
      )
      const finalQuery = applySanitize(
        queryValue as Q extends ZodTypeAny ? z.infer<Q> : undefined,
        'query'
      )
      const finalParams = applySanitize(
        paramsValue as P extends ZodTypeAny ? z.infer<P> : undefined,
        'params'
      )

      return {
        body: finalBody,
        query: finalQuery,
        params: finalParams,
      }
    } catch (e: unknown) {
      // Diagnostic instrumentation
      try {
        if (process.env.NODE_ENV === 'test') {
          const rec = e as Record<string, unknown> | null
          const name =
            rec && typeof rec.name === 'string' ? rec.name : undefined
          const message =
            rec && typeof rec.message === 'string' ? rec.message : undefined
          const stackRaw = rec && typeof rec.stack === 'string' ? rec.stack : ''
          console.error('[VALIDATOR_CATCH]', {
            typeof: typeof e,
            keys: rec ? Object.keys(rec) : [],
            name,
            message,
            stackFirst: stackRaw.split('\n')[0],
          })
        }
      } catch {}
      if (isHttpError(e)) throw e as HttpError
      throw new HttpError(
        500,
        'VALIDATION_INTERNAL',
        'Validation internal error'
      )
    }
  }
}

export function validationErrorResponse(err: HttpError) {
  const payload: Record<string, unknown> = {
    error: err.code,
    message: err.message,
  }
  if (err.details) payload.details = err.details
  return new Response(JSON.stringify(payload), {
    status: err.status,
    headers: { 'content-type': 'application/json' },
  })
}
