import { createLogger } from '@/lib/logger'

/**
 * Lightweight request timing helpers.
 * Enabled when NODE_ENV !== 'production' or when ENABLE_API_TIMING=1 is set.
 */
const ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_TIMING === '1'

// Dedicated scoped logger for timing so it can be filtered independently
const timingLog = createLogger('timing')

export type TimerContext = { key: string; start: number } | null

export function startRequestTimer(reqUrl?: string): TimerContext {
  if (!ENABLED) return null
  try {
    const key = reqUrl ? new URL(reqUrl).pathname : 'unknown'
    return { key, start: Date.now() }
  } catch {
    return { key: 'unknown', start: Date.now() }
  }
}

export function endRequestTimer(
  ctx: TimerContext,
  meta?: Record<string, unknown>
) {
  if (!ENABLED || !ctx) return
  const duration = Date.now() - ctx.start
  try {
    // Structured timing log (debug level to avoid prod noise unless LOG_LEVEL=debug)
    timingLog.debug('request_completed', {
      path: ctx.key,
      durationMs: duration,
      ...(meta || {}),
    })
  } catch {
    // ignore logging errors
  }
}
