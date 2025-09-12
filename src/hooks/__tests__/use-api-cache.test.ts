import { renderHook, act } from '@testing-library/react'
import { useApi, clearApiCache, stopApiCacheCleanup } from '../use-api'
import { setupFetchMock, mockApiResponse } from '@/lib/test-utils'

describe('useApi cache and inflight behavior', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = setupFetchMock()
    clearApiCache()
  })

  afterEach(() => {
    jest.clearAllMocks()
    stopApiCacheCleanup()
  })

  it('deduplicates concurrent requests for same key', async () => {
    const mockData = { value: 1 }
    // Return a promise that resolves after a short delay
    fetchMock.mockReturnValueOnce(mockApiResponse(mockData, 10))

    const { result } = renderHook(() =>
      useApi(
        async () => {
          const res = await fetch('/api/dedupe')
          return res.json()
        },
        { key: '/api/dedupe', forceDedupe: true }
      )
    )

    // Call execute concurrently twice
    const p1 = result.current.execute()
    const p2 = result.current.execute()

    await Promise.all([p1, p2])

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('evicts cache entries after TTL', async () => {
    const mockData1 = { value: 1 }
    const mockData2 = { value: 2 }

    fetchMock.mockResolvedValueOnce(await mockApiResponse(mockData1))
    const { result } = renderHook(() =>
      useApi(
        async () => {
          const res = await fetch('/api/ttl')
          return res.json()
        },
        { key: '/api/ttl', staleTime: 100, forceDedupe: true, forceCache: true }
      )
    )

    // Wait for first load
    await result.current.execute()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Second call within TTL should hit cache (no new fetch)
    await result.current.execute()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    // Wait beyond TTL
    await new Promise(r => setTimeout(r, 200))

    fetchMock.mockResolvedValueOnce(await mockApiResponse(mockData2))
    // Now execute should refetch
    await result.current.execute()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  }, 10000)
})
