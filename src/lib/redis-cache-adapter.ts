import type { CacheAdapter } from './cache-adapter'
import { createLogger } from './logger'

const log = createLogger('redis-cache')

// Lazy load ioredis or node-redis style client if available.
interface RedisLike {
  get(key: string): Promise<string | null>
  set(
    key: string,
    value: string,
    mode?: string,
    ttlSeconds?: number
  ): Promise<unknown>
  del(key: string): Promise<number>
  scan(
    cursor: string,
    matchCount: string[]
  ): Promise<[string, string[]]> | Promise<[string, string[]]>
}

let client: RedisLike | null = null
let initializing: Promise<void> | null = null

async function ensureClient() {
  if (client) return
  if (initializing) return initializing
  initializing = (async () => {
    const url = process.env.REDIS_URL
    if (!url) throw new Error('REDIS_URL not set for redis cache adapter')
    try {
      // Try ioredis first
      try {
        // Dynamically require ioredis if present
        // Dynamically import ioredis
        const RedisCtor = require('ioredis')
        client = new RedisCtor(url) as unknown as RedisLike
      } catch {
        // Fallback to node-redis
        const redisLib = require('redis') as {
          createClient: (opts: { url: string }) => {
            connect: () => Promise<void>
            get: (k: string) => Promise<string | null>
            set: (...args: unknown[]) => Promise<unknown>
            del: (k: string) => Promise<number>
            scan: (
              ...args: unknown[]
            ) => Promise<{ cursor: number | string; keys: string[] }>
          }
        }
        const redisClient = redisLib.createClient({ url })
        await redisClient.connect()
        client = {
          get: (k: string) => redisClient.get(k),
          set: (k: string, v: string, mode?: string, ttlSeconds?: number) =>
            mode === 'EX' && ttlSeconds
              ? redisClient.set(k, v, { EX: ttlSeconds })
              : redisClient.set(k, v),
          del: (k: string) => redisClient.del(k),
          scan: async (cursor: string, args: string[]) => {
            const res = await redisClient.scan(cursor, {
              MATCH: args[1],
              COUNT: Number(args[3]),
            })
            return [res.cursor.toString(), res.keys] as [string, string[]]
          },
        }
      }
      log.info('redis client initialized')
    } catch (err) {
      log.error('redis init failed', { err })
      throw err
    }
  })()
  return initializing
}

export function createRedisCacheAdapter(prefix = 'app:cache:'): CacheAdapter {
  async function get<T>(key: string): Promise<T | undefined> {
    try {
      await ensureClient()
      const raw = await client!.get(prefix + key)
      if (!raw) return undefined
      return JSON.parse(raw) as T
    } catch (e) {
      log.warn('get_failed_fallback', { key, err: String(e) })
      return undefined
    }
  }
  async function set<T>(key: string, value: T, ttlMs = 10000) {
    try {
      await ensureClient()
      const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000))
      await client!.set(prefix + key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch (e) {
      log.warn('set_failed', { key, err: String(e) })
    }
  }
  async function del(key: string) {
    try {
      await ensureClient()
      await client!.del(prefix + key)
    } catch (e) {
      log.warn('del_failed', { key, err: String(e) })
    }
  }
  async function wrap<T>(key: string, ttlMs: number, fn: () => Promise<T>) {
    const cached = await get<T>(key)
    if (typeof cached !== 'undefined') return cached
    const value = await fn()
    await set(key, value, ttlMs)
    return value
  }
  async function clearPrefix(pref: string) {
    try {
      await ensureClient()
      let cursor = '0'
      const match = prefix + pref + '*'
      do {
        // Using SCAN to iterate
        const res = (await client!.scan(cursor, [
          'MATCH',
          match,
          'COUNT',
          '100',
        ])) as [string, string[]]
        cursor = res[0]
        const keys = res[1]
        if (keys.length) {
          for (const k of keys) await client!.del(k)
        }
      } while (cursor !== '0')
    } catch (e) {
      log.warn('clear_prefix_failed', { pref, err: String(e) })
    }
  }
  return {
    get,
    set,
    del,
    wrap,
    clearPrefix: clearPrefix,
  }
}
