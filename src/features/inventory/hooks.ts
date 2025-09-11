import { useApi, useMutation } from '@/hooks/use-api'
import { authenticatedFetch } from '@/lib/api-helpers'
import {
  InventoryItem,
  CreateInventoryRequest,
  UpdateInventoryRequest,
} from '@/types/api'

// Fetch all inventory items
export function useInventory() {
  return useApi<InventoryItem[]>(
    async () => {
      const response = await authenticatedFetch('/api/inventory')
      return response.json()
    },
    { key: 'inventory:list', staleTime: 60000 }
  )
}

// Create new inventory item
export function useCreateInventory() {
  return useMutation<InventoryItem, CreateInventoryRequest>(async data => {
    const response = await authenticatedFetch('/api/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  })
}

// Update inventory item
export function useUpdateInventory() {
  return useMutation<InventoryItem, { id: string } & UpdateInventoryRequest>(
    async ({ id, ...data }) => {
      const response = await authenticatedFetch(`/api/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return response.json()
    }
  )
}

// Delete inventory item
export function useDeleteInventory() {
  return useMutation<void, string>(async id => {
    const response = await authenticatedFetch(`/api/inventory/${id}`, {
      method: 'DELETE',
    })
    return response.json()
  })
}
