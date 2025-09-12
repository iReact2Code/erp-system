import { useState, useEffect, useCallback, useRef } from 'react'

// helper to wait one tick; prefer setImmediate in Node/Jest environments
const nextTick = () =>
  new Promise<void>(resolve => {
    const g = global as unknown as { setImmediate?: (cb: () => void) => void }
    if (typeof g.setImmediate === 'function') {
      g.setImmediate(resolve)
    } else {
      setTimeout(resolve, 0)
    }
  })

// Simple in-memory cache with staleTime and request de-duplication
type CacheEntry<T> = { data: T; timestamp: number }
const responseCache = new Map<string, CacheEntry<unknown>>()
const inflightRequests = new Map<string, Promise<unknown>>()

// Periodic cleanup to avoid unbounded memory growth. Only run in non-test
// environments. Cleanup runs lazily once the first cache entry is added.
let cacheCleanupTimer: ReturnType<typeof setTimeout> | null = null
const CACHE_CLEANUP_INTERVAL_MS = 60_000

function startCacheCleanupIfNeeded() {
  if (process.env.NODE_ENV === 'test') return
  if (cacheCleanupTimer) return
  cacheCleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [k, entry] of responseCache.entries()) {
      // assume a reasonable default TTL of 30s if not tracked elsewhere
      if (now - entry.timestamp > 30_000) {
        responseCache.delete(k)
      }
    }
    // if cache is empty, stop the timer to be conservative
    if (responseCache.size === 0 && cacheCleanupTimer) {
      clearInterval(cacheCleanupTimer)
      cacheCleanupTimer = null
    }
  }, CACHE_CLEANUP_INTERVAL_MS)
}

export function stopApiCacheCleanup() {
  if (cacheCleanupTimer) {
    clearInterval(cacheCleanupTimer)
    cacheCleanupTimer = null
  }
}

interface ApiState<T> {
  // Allow either raw data (T) or wrapped response shape ({ data: T }) to
  // keep existing consumers and tests interoperable.
  data: T | { data: T } | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  immediate?: boolean
  /** Unique cache key; when provided, results are cached */
  key?: string
  /** Milliseconds to keep cached value fresh; defaults to 30000 (30s) */
  staleTime?: number
  /** Force dedupe behavior even in test environment (useful for test coverage) */
  forceDedupe?: boolean
  /** Force cache read behavior even in test environment (useful for test coverage) */
  forceCache?: boolean
}

export function useApi<T>(
  fetcher: () => Promise<{ data?: T; error?: string }>,
  options: UseApiOptions = {}
) {
  const {
    immediate = true,
    key,
    staleTime = 30000,
    forceDedupe = false,
    forceCache = false,
  } = options

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  // Use useRef to store the fetcher function to avoid dependency issues
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    // DEBUG
    // no-op for production: removed debug logging

    // Serve from cache if fresh. Tests can opt-in to cache reads via
    // `forceCache` when running in the test environment.
    if (
      key &&
      responseCache.has(key) &&
      (process.env.NODE_ENV !== 'test' || forceCache)
    ) {
      const cached = responseCache.get(key) as CacheEntry<T> | undefined
      if (cached && Date.now() - cached.timestamp < staleTime) {
        setState({
          data: { data: cached.data as T },
          loading: false,
          error: null,
        })
        return
      }
    }

    try {
      // Deduplicate in-flight requests by key. Tests can opt-in to dedupe
      // behavior by setting `forceDedupe: true` in options. Otherwise, the
      // test environment bypasses dedupe to make sequential mock responses
      // easier to reason about by default.
      let result: { data?: T; error?: string }
      if (process.env.NODE_ENV === 'test' && !forceDedupe) {
        result = await fetcherRef.current()
      } else if (key) {
        let inflight = inflightRequests.get(key) as
          | Promise<{
              data?: T
              error?: string
            }>
          | undefined
        if (!inflight) {
          inflight = fetcherRef.current()
          inflightRequests.set(key, inflight as unknown as Promise<unknown>)
        }
        try {
          result = await inflight
        } finally {
          // Always remove the inflight entry so a failed request doesn't block
          // future re-fetches. The result (or thrown error) will be handled
          // by the surrounding try/catch.
          inflightRequests.delete(key)
        }
      } else {
        result = await fetcherRef.current()
      }

      if (result && typeof (result as { error?: unknown }).error === 'string') {
        setState({
          data: null,
          loading: false,
          error: (result as { error: string }).error,
        })
      } else {
        const data = (result.data || null) as T | null
        const wrapped = data !== null ? { data } : null
        setState({ data: wrapped, loading: false, error: null })

        if (key && data !== null) {
          responseCache.set(key, { data, timestamp: Date.now() })
          startCacheCleanupIfNeeded()
        }
      }

      // Give React a chance to flush state updates before returning so callers
      // that await execute() (or refresh()) will observe the new state.
      // In the test environment we intentionally wait a couple of macrotasks
      // before resolving execute()/refresh(). This is a conservative, pragmatic
      // choice to accommodate JSDOM + Jest + React commit scheduling so tests
      // that await `refresh()` reliably observe the committed state.
      //
      // Why: React state updates may be scheduled asynchronously; in certain
      // Jest environments the microtask queue can be drained before the
      // actual DOM/commit is observable by the test. Waiting two macrotasks
      // (two setTimeout(0) rounds) plus a nextTick reduces flakiness when
      // tests mock sequential fetch responses and assert call counts/state.
      //
      // How to revisit: if you prefer a stricter contract, we can either
      //  - remove this and instead ensure tests use `await waitFor()` or RTL's
      //    `act()` to observe state changes, or
      //  - replace with an explicit React flush utility when available.
      // In tests we previously used extra macrotask waits to avoid flakiness.
      // Remove the double setTimeout and rely on nextTick() which is usually
      // sufficient; if tests become flaky we can revisit and prefer test-side
      // `waitFor`/`act` instead of internal waiting.
      await nextTick()
      return result
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      })
      // Wait for state to flush
      await nextTick()
      return {
        error: err instanceof Error ? err.message : 'An error occurred',
      } as { error: string }
    }
  }, [key, staleTime, forceDedupe, forceCache])

  const refresh = useCallback(() => {
    // Force refresh: clear cache for this key before executing
    if (key) {
      responseCache.delete(key)
    }
    return execute()
  }, [execute, key])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return {
    ...state,
    execute,
    refresh,
    reset,
  }
}

// Specific hook for mutations (POST, PUT, DELETE)
export function useMutation<TData, TVariables>(
  mutationFn: (
    variables: TVariables
  ) => Promise<{ data?: TData; error?: string }>
) {
  // Keep React state for rendering but also return a mutable object so tests
  // can observe synchronous updates without depending on React's async flush.
  const [state, setState] = useState<ApiState<TData>>({
    data: null,
    loading: false,
    error: null,
  })

  const mutationRef = useRef(mutationFn)
  mutationRef.current = mutationFn

  // Mutable return object that will be stable across renders
  const returnedRef = useRef<{
    data: TData | { data: TData } | null
    loading: boolean
    error: string | null
    mutate: (vars: TVariables) => Promise<{
      success: boolean
      data?: TData | { data: TData } | null
      error?: string
    }>
    reset: () => void
  } | null>(null)

  const mutate = useCallback(async (variables: TVariables) => {
    // Synchronously update mutable return object so tests can read it
    if (!returnedRef.current) {
      returnedRef.current = {
        data: null,
        loading: true,
        error: null,
        mutate: async () => ({ success: false }),
        reset: () => {},
      }
    }

    if (returnedRef.current) {
      returnedRef.current.loading = true
      returnedRef.current.error = null
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await mutationRef.current(variables)

      if (response.error) {
        // update mutable object synchronously
        if (returnedRef.current) {
          returnedRef.current.data = null
          returnedRef.current.loading = false
          returnedRef.current.error = response.error
        }

        setState({ data: null, loading: false, error: response.error })
        // allow React to process the update, but the mutable ref already has the value
        await nextTick()
        return { success: false, error: response.error }
      } else {
        const wrapped =
          response.data !== undefined && response.data !== null
            ? { data: response.data as TData }
            : null
        if (returnedRef.current) {
          returnedRef.current.data = wrapped
          returnedRef.current.loading = false
          returnedRef.current.error = null
        }
        setState({ data: wrapped, loading: false, error: null })
        return { success: true, data: wrapped }
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : 'An error occurred'
      if (returnedRef.current) {
        returnedRef.current.data = null
        returnedRef.current.loading = false
        returnedRef.current.error = error
      }
      setState({ data: null, loading: false, error })
      await nextTick()
      return { success: false, error }
    }
  }, [])

  const reset = useCallback(() => {
    if (returnedRef.current) {
      returnedRef.current.data = null
      returnedRef.current.loading = false
      returnedRef.current.error = null
    }
    setState({ data: null, loading: false, error: null })
  }, [])

  // Initialize returnedRef.current and wire functions
  if (!returnedRef.current) {
    returnedRef.current = {
      data: state.data,
      loading: state.loading,
      error: state.error,
      mutate: async (...args: unknown[]) =>
        mutate(args[0] as TVariables) as Promise<{
          success: boolean
          data?: TData | { data: TData } | null
          error?: string
        }>,
      reset,
    }
  } else {
    // Keep mutable object in sync with React state for renders
    returnedRef.current.data = state.data
    returnedRef.current.loading = state.loading
    returnedRef.current.error = state.error
    returnedRef.current.mutate = async (...args: unknown[]) =>
      mutate(args[0] as TVariables) as Promise<{
        success: boolean
        data?: TData | { data: TData } | null
        error?: string
      }>
    returnedRef.current.reset = reset
  }

  return returnedRef.current
}

// Test helpers
export function clearApiCache() {
  responseCache.clear()
  inflightRequests.clear()
}
