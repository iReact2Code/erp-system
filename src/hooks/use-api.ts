import { useState, useEffect, useCallback, useRef } from 'react'

// Simple in-memory cache with staleTime and request de-duplication
type CacheEntry<T> = { data: T; timestamp: number }
const responseCache = new Map<string, CacheEntry<unknown>>()
const inflightRequests = new Map<string, Promise<unknown>>()

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  immediate?: boolean
  /** Unique cache key; when provided, results are cached */
  key?: string
  /** Milliseconds to keep cached value fresh; defaults to 30000 (30s) */
  staleTime?: number
}

export function useApi<T>(
  fetcher: () => Promise<{ data?: T; error?: string }>,
  options: UseApiOptions = {}
) {
  const { immediate = true, key, staleTime = 30000 } = options

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

    // Serve from cache if fresh
    if (key && responseCache.has(key)) {
      const cached = responseCache.get(key) as CacheEntry<T> | undefined
      if (cached && Date.now() - cached.timestamp < staleTime) {
        setState({ data: cached.data, loading: false, error: null })
        return
      }
    }

    try {
      // Deduplicate in-flight requests by key
      let result: { data?: T; error?: string }
      if (key) {
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
        result = await inflight
        inflightRequests.delete(key)
      } else {
        result = await fetcherRef.current()
      }

      if (result.error) {
        setState({ data: null, loading: false, error: result.error })
      } else {
        const data = (result.data || null) as T | null
        setState({ data, loading: false, error: null })
        if (key && data !== null) {
          responseCache.set(key, { data, timestamp: Date.now() })
        }
      }
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      })
    }
  }, [key, staleTime])

  const refresh = useCallback(() => {
    // Force refresh: clear cache for this key before executing
    if (key) {
      responseCache.delete(key)
    }
    execute()
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
  const [state, setState] = useState<ApiState<TData>>({
    data: null,
    loading: false,
    error: null,
  })

  // Use useRef to store the mutation function to avoid dependency issues
  const mutationRef = useRef(mutationFn)
  mutationRef.current = mutationFn

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await mutationRef.current(variables)

        if (response.error) {
          setState({
            data: null,
            loading: false,
            error: response.error,
          })
          return { success: false, error: response.error }
        } else {
          setState({
            data: response.data || null,
            loading: false,
            error: null,
          })
          return { success: true, data: response.data }
        }
      } catch (err) {
        const error = err instanceof Error ? err.message : 'An error occurred'
        setState({
          data: null,
          loading: false,
          error,
        })
        return { success: false, error }
      }
    },
    [] // Remove mutationFn from dependencies
  )

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    })
  }, [])

  return {
    ...state,
    mutate,
    reset,
  }
}
