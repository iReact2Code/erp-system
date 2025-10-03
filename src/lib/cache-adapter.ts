/**
 * Cache Adapter Abstraction
 */
export interface CacheAdapter {
  get<T>(key: string): Promise<T | undefined>
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>
  del(key: string): Promise<void>
  wrap<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T>
  stats?(): Promise<{ hits: number; misses: number; entries?: number }>
  clearPrefix?(prefix: string): Promise<void>
  clear?(): Promise<void>
}

export function createInMemoryAdapter(): CacheAdapter {
  const store = new Map<string, { value: unknown; expiresAt: number }>()
  let hits = 0
  let misses = 0
  function get<T>(key: string): T | undefined {
    const entry = store.get(key)
    if (!entry) {
      misses++
      return undefined
    }
    if (Date.now() > entry.expiresAt) {
      store.delete(key)
      misses++
      return undefined
    }
    hits++
    return entry.value as T
  }
  function set<T>(key: string, value: T, ttlMs = 10000) {
    store.set(key, { value, expiresAt: Date.now() + ttlMs })
  }
  async function del(key: string) {
    store.delete(key)
  }
  async function wrap<T>(key: string, ttlMs: number, fn: () => Promise<T>) {
    const cached = get<T>(key)
    if (typeof cached !== 'undefined') return cached
    const value = await fn()
    set(key, value, ttlMs)
    return value
  }
  return {
    async get(k) {
      return get(k)
    },
    async set(k, v, ttl) {
      set(k, v, ttl)
    },
    async del(k) {
      await del(k)
    },
    async wrap(k, ttl, fn) {
      return wrap(k, ttl, fn)
    },
    async stats() {
      return { hits, misses, entries: store.size }
    },
    async clearPrefix(prefix: string) {
      for (const key of store.keys())
        if (key.startsWith(prefix)) store.delete(key)
    },
    async clear() {
      store.clear()
    },
  }
}
