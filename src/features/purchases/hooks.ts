import { useApi, useMutation } from '@/hooks/use-api'
import { Purchase, CreatePurchaseRequest, PurchaseStatus } from '@/types/api'

// Fetch all purchases
export function usePurchases() {
  return useApi<Purchase[]>(async () => {
    const response = await fetch('/api/purchases')
    return response.json()
  })
}

// Create new purchase
export function useCreatePurchase() {
  return useMutation<Purchase, CreatePurchaseRequest>(async data => {
    const response = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  })
}

// Delete purchase
export function useDeletePurchase() {
  return useMutation<{ success: boolean }, string>(async id => {
    const response = await fetch(`/api/purchases?id=${id}`, {
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
