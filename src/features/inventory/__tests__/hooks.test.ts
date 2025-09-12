import { renderHook, waitFor } from '@testing-library/react'
import { useInventory, useDeleteInventory } from '../hooks'
import {
  mockApiResponse,
  mockApiError,
  setupFetchMock,
  createMockInventoryItem,
} from '@/lib/test-utils'

describe('Inventory Hooks', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = setupFetchMock()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('useInventory', () => {
    it('should fetch inventory items successfully', async () => {
      const mockItems = [
        createMockInventoryItem({ id: '1', name: 'Item 1' }),
        createMockInventoryItem({ id: '2', name: 'Item 2' }),
      ]

      fetchMock.mockResolvedValueOnce(await mockApiResponse(mockItems))

      const { result } = renderHook(() => useInventory())

      expect(result.current.loading).toBe(true)
      expect(result.current.data).toBe(null)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toEqual({ data: mockItems })
      expect(result.current.error).toBe(null)
      expect(fetchMock).toHaveBeenCalledWith('/api/inventory')
    })

    it('should handle fetch errors', async () => {
      fetchMock.mockResolvedValueOnce(await mockApiError('Server Error', 500))

      const { result } = renderHook(() => useInventory())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.data).toBe(null)
      expect(result.current.error).toBeTruthy()
    })

    it('should refresh inventory data', async () => {
      const mockItems1 = [createMockInventoryItem({ id: '1', name: 'Item 1' })]
      const mockItems2 = [
        createMockInventoryItem({ id: '1', name: 'Item 1' }),
        createMockInventoryItem({ id: '2', name: 'Item 2' }),
      ]

      fetchMock
        .mockResolvedValueOnce(await mockApiResponse(mockItems1))
        .mockResolvedValueOnce(await mockApiResponse(mockItems2))

      const { result } = renderHook(() => useInventory())

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      expect(result.current.data).toEqual({ data: mockItems1 })

      // Refresh data
      await result.current.refresh()
      // Wait for the hook state to update; prefer testing via waitFor instead
      // of relying on implementation timing inside the hook.
      await waitFor(() => {
        expect(result.current.data).toEqual({ data: mockItems2 })
      })
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })

  describe('useDeleteInventory', () => {
    it('should delete inventory item successfully', async () => {
      const mockResponse = { success: true }
      fetchMock.mockResolvedValueOnce(await mockApiResponse(mockResponse))

      const { result } = renderHook(() => useDeleteInventory())

      expect(result.current.loading).toBe(false)

      const deleteResult = await result.current.mutate('item-1')

      expect(deleteResult.success).toBe(true)
      expect(deleteResult.data).toEqual({ data: mockResponse })
      expect(fetchMock).toHaveBeenCalledWith('/api/inventory?id=item-1', {
        method: 'DELETE',
      })
    })

    it('should handle delete errors', async () => {
      fetchMock.mockResolvedValueOnce(await mockApiError('Not Found', 404))

      const { result } = renderHook(() => useDeleteInventory())

      const deleteResult = await result.current.mutate('nonexistent-item')

      expect(deleteResult.success).toBe(false)
      expect(deleteResult.error).toBeTruthy()
      expect(result.current.error).toBeTruthy()
    })

    it('should reset error state', async () => {
      fetchMock.mockResolvedValueOnce(await mockApiError('Error', 500))

      const { result } = renderHook(() => useDeleteInventory())

      // Trigger error
      await result.current.mutate('item-1')
      expect(result.current.error).toBeTruthy()

      // Reset error
      result.current.reset()
      expect(result.current.error).toBe(null)
    })
  })
})
