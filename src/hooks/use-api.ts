import { useState, useEffect, useCallback } from 'react'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  immediate?: boolean
}

export function useApi<T>(
  fetcher: () => Promise<{ data?: T; error?: string }>,
  options: UseApiOptions = {}
) {
  const { immediate = true } = options

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  })

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const response = await fetcher()

      if (response.error) {
        setState({
          data: null,
          loading: false,
          error: response.error,
        })
      } else {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
        })
      }
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      })
    }
  }, [fetcher])

  const refresh = useCallback(() => {
    execute()
  }, [execute])

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

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const response = await mutationFn(variables)

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
    [mutationFn]
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
