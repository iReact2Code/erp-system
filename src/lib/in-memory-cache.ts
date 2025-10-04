/**
 * Extremely small in-process TTL cache for short-lived caching in dev/edge
 * Use only for short TTLs (seconds). Not suitable for production-scale caching.
 */
type CacheEntry = { value: unknown; expiresAt: number }

const store = new Map<string, CacheEntry>()

let hits = 0
let misses = 0
const ENABLE_LOG = process.env.ENABLE_CACHE_LOG === '1'

export function getCache(key: string) {
  const entry = store.get(key)
  if (!entry) {
    misses++
    if (ENABLE_LOG) console.debug('[cache] miss', key)
    return undefined
  }
  if (Date.now() > entry.expiresAt) {
    store.delete(key)
    misses++
    if (ENABLE_LOG) console.debug('[cache] expired', key)
    return undefined
  }
  hits++
  if (ENABLE_LOG) console.debug('[cache] hit', key)
  return entry.value
}

export function setCache(key: string, value: unknown, ttlMs = 10000) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
}

export async function wrapCache<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = getCache(key) as T | undefined
  if (typeof cached !== 'undefined') return cached
  const res = await fn()
  try {
    setCache(key, res, ttlMs)
  } catch {
    // ignore cache set errors
  }
  return res
}

export function delCache(key: string) {
  store.delete(key)
}

export function clearCacheByPrefix(prefix: string) {
  if (ENABLE_LOG) console.debug(`[cache] clearing prefix: ${prefix}`)
  const keysToDelete: string[] = []
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      keysToDelete.push(key)
    }
  }
  for (const key of keysToDelete) {
    store.delete(key)
  }
  if (ENABLE_LOG)
    console.debug(`[cache] deleted ${keysToDelete.length} entries`)
}

export function clearCache() {
  store.clear()
}

export function getCacheStats() {
  return { hits, misses, entries: store.size }
}

export function resetCacheStats() {
  hits = 0
  misses = 0
}
