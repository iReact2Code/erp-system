import {
  useOptimizedApi,
  useOptimizedMutation,
  apiCache,
} from '@/hooks/use-optimized-api'
import {
  InventoryItem,
  CreateInventoryRequest,
  UpdateInventoryRequest,
} from '@/types/api'

// Cache keys for inventory operations
const CACHE_KEYS = {
  INVENTORY_LIST: 'inventory:list',
  INVENTORY_ITEM: (id: string) => `inventory:item:${id}`,
} as const

// Optimized inventory list hook with caching
export function useOptimizedInventory() {
  return useOptimizedApi<InventoryItem[]>(
    async () => {
      const response = await fetch('/api/inventory')
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.statusText}`)
      }
      const result = await response.json()
      return result.data || result
    },
    CACHE_KEYS.INVENTORY_LIST,
    {
      cacheTTL: 2 * 60 * 1000, // 2 minutes cache for inventory
      retryCount: 3,
      retryDelay: 1000,
    }
  )
}

// Optimized single inventory item hook
export function useOptimizedInventoryItem(id: string, enabled: boolean = true) {
  return useOptimizedApi<InventoryItem>(
    async () => {
      const response = await fetch(`/api/inventory/${id}`)
      if (!response.ok) {
        throw new Error(
          `Failed to fetch inventory item: ${response.statusText}`
        )
      }
      const result = await response.json()
      return result.data || result
    },
    CACHE_KEYS.INVENTORY_ITEM(id),
    {
      enabled,
      cacheTTL: 5 * 60 * 1000, // 5 minutes for individual items
    }
  )
}

// Optimized create inventory mutation
export function useOptimizedCreateInventory() {
  return useOptimizedMutation<InventoryItem, CreateInventoryRequest>(
    async data => {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to create inventory item: ${response.statusText}`
        )
      }

      const result = await response.json()
      return result.data || result
    },
    {
      invalidateCache: [CACHE_KEYS.INVENTORY_LIST],
      onSuccess: data => {
        // Cache the new item
        if (data.id) {
          apiCache.set(CACHE_KEYS.INVENTORY_ITEM(data.id), data)
        }
      },
    }
  )
}

// Optimized update inventory mutation
export function useOptimizedUpdateInventory() {
  return useOptimizedMutation<
    InventoryItem,
    UpdateInventoryRequest & { id: string }
  >(
    async ({ id, ...data }) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to update inventory item: ${response.statusText}`
        )
      }

      const result = await response.json()
      return result.data || result
    },
    {
      invalidateCache: [CACHE_KEYS.INVENTORY_LIST],
      onSuccess: data => {
        // Update the item cache
        if (data.id) {
          apiCache.set(CACHE_KEYS.INVENTORY_ITEM(data.id), data)
        }
      },
    }
  )
}

// Optimized delete inventory mutation
export function useOptimizedDeleteInventory() {
  return useOptimizedMutation<{ success: boolean }, string>(
    async id => {
      const response = await fetch(`/api/inventory?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(
          `Failed to delete inventory item: ${response.statusText}`
        )
      }

      const result = await response.json()
      return result.data || result
    },
    {
      invalidateCache: [CACHE_KEYS.INVENTORY_LIST],
      onSuccess: (_, id) => {
        // Remove from individual item cache
        apiCache.invalidate(CACHE_KEYS.INVENTORY_ITEM(id))
      },
    }
  )
}

// Bulk operations for performance
export function useOptimizedBulkInventoryOperations() {
  const bulkUpdate = useOptimizedMutation<
    InventoryItem[],
    Array<UpdateInventoryRequest & { id: string }>
  >(
    async items => {
      const response = await fetch('/api/inventory/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to bulk update inventory: ${response.statusText}`
        )
      }

      const result = await response.json()
      return result.data || result
    },
    {
      invalidateCache: [CACHE_KEYS.INVENTORY_LIST],
      onSuccess: data => {
        // Update individual item caches
        data.forEach(item => {
          if (item.id) {
            apiCache.set(CACHE_KEYS.INVENTORY_ITEM(item.id), item)
          }
        })
      },
    }
  )

  const bulkDelete = useOptimizedMutation<
    { success: boolean; deletedCount: number },
    string[]
  >(
    async ids => {
      const response = await fetch('/api/inventory/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to bulk delete inventory: ${response.statusText}`
        )
      }

      const result = await response.json()
      return result.data || result
    },
    {
      invalidateCache: [CACHE_KEYS.INVENTORY_LIST],
      onSuccess: (_, ids) => {
        // Remove from individual item caches
        ids.forEach(id => {
          apiCache.invalidate(CACHE_KEYS.INVENTORY_ITEM(id))
        })
      },
    }
  )

  return {
    bulkUpdate,
    bulkDelete,
  }
}

// Utility to prefetch inventory data
export function prefetchInventory() {
  // Prefetch inventory list
  fetch('/api/inventory')
    .then(response => response.json())
    .then(data => {
      const items = data.data || data
      apiCache.set(CACHE_KEYS.INVENTORY_LIST, items)

      // Optionally prefetch individual items
      items.slice(0, 10).forEach((item: InventoryItem) => {
        if (item.id) {
          apiCache.set(CACHE_KEYS.INVENTORY_ITEM(item.id), item)
        }
      })
    })
    .catch(() => {
      // Ignore prefetch errors
    })
}

// Export cache keys for external invalidation
export { CACHE_KEYS as INVENTORY_CACHE_KEYS }
