import { renderHook, waitFor } from '@testing-library/react'
import { useApi, useMutation } from '../use-api'
import { mockApiResponse, mockApiError, setupFetchMock } from '@/lib/test-utils'

describe('useApi Hook', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = setupFetchMock()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test Item' }
    fetchMock.mockResolvedValueOnce(await mockApiResponse(mockData))

    const { result } = renderHook(() =>
      useApi(async () => {
        const response = await fetch('/api/test')
        return response.json()
      })
    )

    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe(null)

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toEqual({ data: mockData })
    expect(result.current.error).toBe(null)
    expect(fetchMock).toHaveBeenCalledWith('/api/test')
  })

  it('should handle fetch errors', async () => {
    fetchMock.mockResolvedValueOnce(await mockApiError('Network Error', 500))

    const { result } = renderHook(() =>
      useApi(async () => {
        const response = await fetch('/api/test')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.data).toBe(null)
    expect(result.current.error).toBe('HTTP 500: Network Error')
  })

  it('should refresh data when refresh is called', async () => {
    const mockData1 = { id: 1, name: 'Test Item 1' }
    const mockData2 = { id: 2, name: 'Test Item 2' }

    fetchMock
      .mockResolvedValueOnce(await mockApiResponse(mockData1))
      .mockResolvedValueOnce(await mockApiResponse(mockData2))

    const { result } = renderHook(() =>
      useApi(async () => {
        const response = await fetch('/api/test')
        return response.json()
      })
    )

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    expect(result.current.data).toEqual({ data: mockData1 })

    // Call refresh
    await result.current.refresh()

    await waitFor(() => {
      expect(result.current.data).toEqual({ data: mockData2 })
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('useMutation Hook', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = setupFetchMock()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should perform mutation successfully', async () => {
    const mockResponse = { id: 1, name: 'Created Item' }
    fetchMock.mockResolvedValueOnce(await mockApiResponse(mockResponse))

    const { result } = renderHook(() =>
      useMutation<typeof mockResponse, { name: string }>(async data => {
        const response = await fetch('/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        return response.json()
      })
    )

    // Initially not loading
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(null)

    // Perform mutation
    const mutationResult = await result.current.mutate({ name: 'Test Item' })

    expect(mutationResult.success).toBe(true)
    expect(mutationResult.data).toEqual({ data: mockResponse })
    expect(result.current.loading).toBe(false)
    expect(fetchMock).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Item' }),
    })
  })

  it('should handle mutation errors', async () => {
    fetchMock.mockResolvedValueOnce(await mockApiError('Validation Error', 400))

    const { result } = renderHook(() =>
      useMutation<unknown, { name: string }>(async data => {
        const response = await fetch('/api/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        return response.json()
      })
    )

    const mutationResult = await result.current.mutate({ name: 'Test Item' })

    expect(mutationResult.success).toBe(false)
    expect(mutationResult.error).toBe('HTTP 400: Validation Error')
    expect(result.current.error).toBe('HTTP 400: Validation Error')
  })

  it('should reset error state', async () => {
    fetchMock.mockResolvedValueOnce(await mockApiError('Test Error', 500))

    const { result } = renderHook(() =>
      useMutation<unknown, { name: string }>(async () => {
        const response = await fetch('/api/test')
        if (!response.ok) {
          throw new Error('Test Error')
        }
        return response.json()
      })
    )

    // Trigger error
    await result.current.mutate({ name: 'Test' })
    expect(result.current.error).toBe('Test Error')

    // Reset error
    result.current.reset()
    expect(result.current.error).toBe(null)
  })
})
