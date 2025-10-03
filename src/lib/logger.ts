/**
 * Central structured logger (zero-dependency) with environment‑aware formatting.
 *
 * Features:
 *  - JSON output in production (LOG_PRETTY=1 forces pretty mode)
 *  - Pretty colored output in dev for readability
 *  - Redaction for obvious secret-ish keys (password, token, secret)
 *  - Child loggers via createLogger(scope, meta)
 *  - Safe error serialization preserving name/message/stack & custom props
 *
 * Usage:
 *  import { logger, createLogger, serializeError } from '@/lib/logger'
 *  logger.info('server started', { port })
 *  const authLog = createLogger('auth')
 *  authLog.error('login_failed', { err: serializeError(e), userId })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogRecord {
  level: LogLevel
  time: string
  msg: string
  scope?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>
}

import { getCurrentRequestContext } from '@/lib/observability/async-context'
interface LoggerApi {
  debug: (msg: string, meta?: Record<string, unknown>) => void
  info: (msg: string, meta?: Record<string, unknown>) => void
  warn: (msg: string, meta?: Record<string, unknown>) => void
  error: (msg: string, meta?: Record<string, unknown>) => void
}

const isProd = process.env.NODE_ENV === 'production'
const pretty = !isProd || process.env.LOG_PRETTY === '1'
const levelEnv = (process.env.LOG_LEVEL || 'info').toLowerCase()
const levelOrder: LogLevel[] = ['debug', 'info', 'warn', 'error']
const minLevelIndex = Math.max(0, levelOrder.indexOf(levelEnv as LogLevel))

const REDACT_PATTERN = /(password|token|secret|authorization)/i

function redact(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(redact)
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (REDACT_PATTERN.test(k)) {
      out[k] = '[REDACTED]'
    } else if (v && typeof v === 'object') {
      out[k] = redact(v)
    } else {
      out[k] = v
    }
  }
  return out
}

export function serializeError(err: unknown) {
  if (!err) return err
  if (err instanceof Error) {
    const base: Record<string, unknown> = {
      name: err.name,
      message: err.message,
      stack: err.stack,
    }
    // Include enumerable custom properties
    for (const key of Object.keys(err)) {
      // capture enumerable custom fields
      base[key] = (err as unknown as Record<string, unknown>)[key]
    }
    return base
  }
  if (typeof err === 'object') return redact(err)
  return { value: String(err) }
}

function shouldLog(level: LogLevel) {
  return levelOrder.indexOf(level) >= minLevelIndex
}

function formatDev(rec: LogRecord): void {
  const color =
    rec.level === 'error'
      ? '\x1b[31m'
      : rec.level === 'warn'
        ? '\x1b[33m'
        : rec.level === 'debug'
          ? '\x1b[36m'
          : '\x1b[32m'
  const reset = '\x1b[0m'
  console.log(
    `${color}${rec.time} ${rec.level.toUpperCase()}${rec.scope ? ' [' + rec.scope + ']' : ''}${reset} ${rec.msg}`,
    rec.meta && Object.keys(rec.meta).length ? rec.meta : ''
  )
}

function formatProd(rec: LogRecord): void {
  console.log(JSON.stringify(rec))
}

function emit(rec: LogRecord) {
  if (pretty) return formatDev(rec)
  return formatProd(rec)
}

function baseLog(
  scope: string | undefined,
  level: LogLevel,
  msg: string,
  meta?: Record<string, unknown>
) {
  if (!shouldLog(level)) return
  try {
    const record: LogRecord = {
      level,
      time: new Date().toISOString(),
      msg,
      scope,
      meta: meta ? (redact(meta) as Record<string, unknown>) : undefined,
    }
    emit(record)
  } catch {
    // swallow logging errors
  }
}

function buildLogger(scope?: string): LoggerApi {
  return {
    debug: (m, meta) => baseLog(scope, 'debug', m, meta),
    info: (m, meta) => baseLog(scope, 'info', m, meta),
    warn: (m, meta) => baseLog(scope, 'warn', m, meta),
    error: (m, meta) => baseLog(scope, 'error', m, meta),
  }
}

export const logger = buildLogger()
export function createLogger(
  scope: string,
  defaultMeta?: Record<string, unknown>
): LoggerApi {
  if (!defaultMeta) return buildLogger(scope)
  const base = buildLogger(scope)
  return {
    debug: (m, meta) => base.debug(m, { ...defaultMeta, ...meta }),
    info: (m, meta) => base.info(m, { ...defaultMeta, ...meta }),
    warn: (m, meta) => base.warn(m, { ...defaultMeta, ...meta }),
    error: (m, meta) => base.error(m, { ...defaultMeta, ...meta }),
  }
}

// Backwards-compatible fallback for rare cases where direct console usage is simpler
export function legacyConsoleFallback() {
  return console
}

// Context-aware logger helper (auto enriches with requestId/traceId if available)
export function getContextLogger(scope: string): LoggerApi {
  const base = createLogger(scope)
  function enrich(meta?: Record<string, unknown>) {
    const ctx = getCurrentRequestContext()
    let traceId: string | undefined = ctx?.traceId
    // Attempt to read active OpenTelemetry span if tracing enabled
    if (!traceId) {
      try {
        // Dynamically require to avoid hard dependency when tracing disabled

        const otelApi =
          require('@opentelemetry/api') as typeof import('@opentelemetry/api')
        const span = otelApi.trace.getActiveSpan()
        const sc = span?.spanContext()
        if (sc && sc.traceId) traceId = sc.traceId
      } catch {
        // ignore if otel not installed
      }
    }
    if (!ctx && !traceId) return meta
    return { requestId: ctx?.requestId, traceId, ...meta }
  }
  return {
    debug: (m, meta) => base.debug(m, enrich(meta)),
    info: (m, meta) => base.info(m, enrich(meta)),
    warn: (m, meta) => base.warn(m, enrich(meta)),
    error: (m, meta) => base.error(m, enrich(meta)),
  }
}
