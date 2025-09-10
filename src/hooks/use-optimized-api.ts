import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

// Simple in-memory cache with TTL
class ApiCache {
  private cache = new Map<string, CacheEntry<unknown>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry !== undefined && Date.now() <= entry.expiresAt
  }
}

const apiCache = new ApiCache()

export interface UseApiOptions<T> {
  cacheTTL?: number
  retryCount?: number
  retryDelay?: number
  enabled?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  invalidateCache: () => void
}

export function useOptimizedApi<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const {
    cacheTTL = 5 * 60 * 1000, // 5 minutes
    retryCount = 3,
    retryDelay = 1000,
    enabled = true,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T | null>(() => {
    // Try to get cached data on initialization
    return apiCache.get<T>(cacheKey)
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchWithRetry = useCallback(
    async (attempt: number = 1): Promise<T> => {
      try {
        const result = await fetcher()
        return result
      } catch (err) {
        if (attempt < retryCount) {
          await new Promise(resolve => {
            retryTimeoutRef.current = setTimeout(resolve, retryDelay * attempt)
          })
          return fetchWithRetry(attempt + 1)
        }
        throw err
      }
    },
    [fetcher, retryCount, retryDelay]
  )

  const executeRequest = useCallback(
    async (useCache: boolean = true) => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Check cache first
      if (useCache && apiCache.has(cacheKey)) {
        const cachedData = apiCache.get<T>(cacheKey)
        if (cachedData) {
          setData(cachedData)
          setError(null)
          onSuccess?.(cachedData)
          return
        }
      }

      setLoading(true)
      setError(null)
      abortControllerRef.current = new AbortController()

      try {
        const result = await fetchWithRetry()

        // Cache the result
        apiCache.set(cacheKey, result, cacheTTL)

        setData(result)
        onSuccess?.(result)
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        onError?.(err instanceof Error ? err : new Error(errorMessage))
      } finally {
        setLoading(false)
      }
    },
    [cacheKey, cacheTTL, fetchWithRetry, onSuccess, onError]
  )

  const refresh = useCallback(async () => {
    await executeRequest(false) // Force refresh, skip cache
  }, [executeRequest])

  const invalidateCache = useCallback(() => {
    apiCache.invalidate(cacheKey)
  }, [cacheKey])

  useEffect(() => {
    if (!enabled) return

    executeRequest()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [executeRequest, enabled])

  return {
    data,
    loading,
    error,
    refresh,
    invalidateCache,
  }
}

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void
  onError?: (error: Error, variables: TVariables) => void
  invalidateCache?: string[]
}

export interface UseMutationReturn<TData, TVariables> {
  mutate: (
    variables: TVariables
  ) => Promise<{ success: boolean; data?: TData; error?: string }>
  loading: boolean
  error: string | null
  reset: () => void
}

export function useOptimizedMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationReturn<TData, TVariables> {
  const { onSuccess, onError, invalidateCache = [] } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = useCallback(
    async (variables: TVariables) => {
      setLoading(true)
      setError(null)

      try {
        const result = await mutationFn(variables)

        // Invalidate related cache entries
        invalidateCache.forEach(pattern => {
          apiCache.invalidate(pattern)
        })

        onSuccess?.(result, variables)
        return { success: true, data: result }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred'
        setError(errorMessage)
        onError?.(
          err instanceof Error ? err : new Error(errorMessage),
          variables
        )
        return { success: false, error: errorMessage }
      } finally {
        setLoading(false)
      }
    },
    [mutationFn, onSuccess, onError, invalidateCache]
  )

  const reset = useCallback(() => {
    setError(null)
    setLoading(false)
  }, [])

  return {
    mutate,
    loading,
    error,
    reset,
  }
}

// Export cache instance for global operations
export { apiCache }
