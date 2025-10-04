import { RequestContext } from './context'

// Lightweight abstraction over AsyncLocalStorage so we can no-op gracefully
// in environments (like some edge runtimes) where it may not exist.

// Declare a minimal interface to allow fallback shim.
interface ContextStore<T> {
  run(
    store: T,
    callback: (...args: unknown[]) => void,
    ...args: unknown[]
  ): void
  getStore(): T | undefined
}

let store: ContextStore<RequestContext> | undefined

try {
  // Dynamically require to avoid bundler complaints if not available.
  const { AsyncLocalStorage } =
    require('async_hooks') as typeof import('async_hooks')
  store = new AsyncLocalStorage<RequestContext>()
} catch {
  // Fallback shim (no persistence across async boundaries)
  let current: RequestContext | undefined
  store = {
    run(
      value: RequestContext,
      callback: (...args: unknown[]) => void,
      ...args: unknown[]
    ) {
      current = value
      try {
        callback(...args)
      } finally {
        /* do not clear to allow sync access */
      }
    },
    getStore() {
      return current
    },
  }
}

export function runWithRequestContext<T>(
  ctx: RequestContext,
  fn: () => Promise<T> | T
): Promise<T> | T {
  if (!store) return fn()
  let result: Promise<T> | T
  store.run(ctx, () => {
    result = fn()
  })
  return result!
}

export function getCurrentRequestContext(): RequestContext | undefined {
  return store?.getStore()
}
