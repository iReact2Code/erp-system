// Simple in-memory brute force tracker. For production, replace with Redis or durable store.
// Tracks failed login attempts per key (email or IP) and enforces a lockout window.

export interface BruteForceConfig {
  maxAttempts: number // attempts before lock triggers
  windowMs: number // rolling window for counting attempts
  lockMs: number // lock duration after exceeding max attempts
}

interface AttemptState {
  attempts: number
  firstAttempt: number // timestamp
  lockedUntil?: number
}

const store = new Map<string, AttemptState>()

const DEFAULT_CONFIG: BruteForceConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15m
  lockMs: 15 * 60 * 1000, // 15m lock
}

export function getBruteForceState(key: string): AttemptState | undefined {
  const s = store.get(key)
  if (!s) return undefined
  // Expire old window when outside windowMs and not locked
  const now = Date.now()
  if (!s.lockedUntil && now - s.firstAttempt > DEFAULT_CONFIG.windowMs) {
    store.delete(key)
    return undefined
  }
  // Clear expired lock
  if (s.lockedUntil && s.lockedUntil <= now) {
    store.delete(key)
    return undefined
  }
  return s
}

export function isLocked(key: string): boolean {
  const s = getBruteForceState(key)
  return !!(s && s.lockedUntil && s.lockedUntil > Date.now())
}

export function recordFailure(
  key: string,
  config: Partial<BruteForceConfig> = {}
) {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const now = Date.now()
  const existing = store.get(key)
  if (!existing) {
    store.set(key, { attempts: 1, firstAttempt: now })
    return { locked: false, attempts: 1, remaining: cfg.maxAttempts - 1 }
  }
  // If locked and still within lock period, keep locked
  if (existing.lockedUntil && existing.lockedUntil > now) {
    return { locked: true, attempts: existing.attempts, remaining: 0 }
  }
  // Reset if outside window
  if (now - existing.firstAttempt > cfg.windowMs) {
    store.set(key, { attempts: 1, firstAttempt: now })
    return { locked: false, attempts: 1, remaining: cfg.maxAttempts - 1 }
  }
  existing.attempts += 1
  if (existing.attempts >= cfg.maxAttempts) {
    existing.lockedUntil = now + cfg.lockMs
    return { locked: true, attempts: existing.attempts, remaining: 0 }
  }
  return {
    locked: false,
    attempts: existing.attempts,
    remaining: cfg.maxAttempts - existing.attempts,
  }
}

export function recordSuccess(key: string) {
  store.delete(key)
}

export function bruteForceStatus(key: string) {
  const s = getBruteForceState(key)
  if (!s) return { attempts: 0, locked: false }
  return {
    attempts: s.attempts,
    locked: !!(s.lockedUntil && s.lockedUntil > Date.now()),
  }
}

export function resetBruteForce(key?: string) {
  if (key) store.delete(key)
  else store.clear()
}
