import { createLogger } from '@/lib/logger'

const rlLog = createLogger('rate-limit')

export interface RateLimiterOptions {
  windowMs: number
  max: number
  cleanupInterval?: number // after how many checks to attempt cleanup (in-memory only)
  prefix?: string
  backend?: 'memory' | 'redis'
  redisClient?: unknown // for future redis support
}

export interface RateLimitResult {
  limited: boolean
  limit: number
  remaining: number
  reset: number // epoch seconds
}

export interface RateLimiter {
  check: (key: string) => Promise<RateLimitResult>
}

// In-memory backend
function createMemoryRateLimiter(opts: RateLimiterOptions): RateLimiter {
  interface Entry {
    count: number
    windowStart: number
  }
  const windowMs = opts.windowMs
  const max = opts.max
  const map = new Map<string, Entry>()
  let opCount = 0
  const cleanupEvery = opts.cleanupInterval || 500
  const prefix = opts.prefix || 'rl:'

  function cleanup(now: number) {
    for (const [k, v] of map.entries()) {
      if (now - v.windowStart >= windowMs) {
        map.delete(k)
      }
    }
  }

  async function check(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    opCount++
    if (opCount % cleanupEvery === 0) cleanup(now)
    const namespaced = prefix + key
    let entry = map.get(namespaced)
    if (!entry) {
      entry = { count: 0, windowStart: now }
      map.set(namespaced, entry)
    }
    if (now - entry.windowStart >= windowMs) {
      // reset window
      entry.count = 0
      entry.windowStart = now
    }
    entry.count++
    const limited = entry.count > max
    const remaining = limited ? 0 : Math.max(0, max - entry.count)
    const reset = Math.floor((entry.windowStart + windowMs) / 1000)
    if (limited) {
      rlLog.warn('throttle', { key, count: entry.count, max, reset })
    }
    return { limited, limit: max, remaining, reset }
  }

  return { check }
}

// Factory for pluggable backends
export function createRateLimiter(opts: RateLimiterOptions): RateLimiter {
  if (opts.backend === 'redis') {
    throw new Error('Redis backend not yet implemented')
    // return createRedisRateLimiter(opts)
  }
  return createMemoryRateLimiter(opts)
}

export function buildRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
    ...(result.limited
      ? {
          'Retry-After': String(
            Math.max(1, result.reset - Math.floor(Date.now() / 1000))
          ),
        }
      : {}),
  }
}
