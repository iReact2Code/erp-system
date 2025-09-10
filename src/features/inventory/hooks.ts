import { useApi, useMutation } from '@/hooks/use-api'
import {
  InventoryItem,
  CreateInventoryRequest,
  UpdateInventoryRequest,
} from '@/types/api'

// Fetch all inventory items
export function useInventory() {
  return useApi<InventoryItem[]>(async () => {
    const response = await fetch('/api/inventory')
    return response.json()
  })
}

// Create new inventory item
export function useCreateInventory() {
  return useMutation<InventoryItem, CreateInventoryRequest>(async data => {
    const response = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  })
}

// Update inventory item
export function useUpdateInventory() {
  return useMutation<InventoryItem, { id: string } & UpdateInventoryRequest>(
    async ({ id, ...data }) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return response.json()
    }
  )
}

// Delete inventory item
export function useDeleteInventory() {
  return useMutation<void, string>(async id => {
    const response = await fetch(`/api/inventory/${id}`, {
      method: 'DELETE',
    })
    return response.json()
  })
}
