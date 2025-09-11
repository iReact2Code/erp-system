import { useApi, useMutation } from '@/hooks/use-api'
import { authenticatedFetch } from '@/lib/api-helpers'
import { Purchase, CreatePurchaseRequest, PurchaseStatus } from '@/types/api'

// Fetch all purchases
export function usePurchases() {
  return useApi<Purchase[]>(
    async () => {
      const response = await authenticatedFetch('/api/purchases')
      return response.json()
    },
    { key: 'purchases:list', staleTime: 60000 }
  )
}

// Create new purchase
export function useCreatePurchase() {
  return useMutation<Purchase, CreatePurchaseRequest>(async data => {
    const response = await authenticatedFetch('/api/purchases', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  })
}

// Delete purchase
export function useDeletePurchase() {
  return useMutation<{ success: boolean }, string>(async id => {
    const response = await authenticatedFetch(`/api/purchases?id=${id}`, {
      method: 'DELETE',
    })
    return response.json()
  })
}

// Update purchase status
export function useUpdatePurchaseStatus() {
  return useMutation<Purchase, { id: string; status: PurchaseStatus }>(
    async ({ id, status }) => {
      const response = await fetch(`/api/purchases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      return response.json()
    }
  )
}
