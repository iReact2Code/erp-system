import { useApi, useMutation } from '@/hooks/use-api'
import { Sale, CreateSaleRequest } from '@/types/api'

// Fetch all sales
export function useSales() {
  return useApi<Sale[]>(async () => {
    const response = await fetch('/api/sales')
    return response.json()
  })
}

// Create new sale
export function useCreateSale() {
  return useMutation<Sale, CreateSaleRequest>(async data => {
    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  })
}

// Delete sale
export function useDeleteSale() {
  return useMutation<{ success: boolean }, string>(async id => {
    const response = await fetch(`/api/sales?id=${id}`, {
      method: 'DELETE',
    })
    return response.json()
  })
}
