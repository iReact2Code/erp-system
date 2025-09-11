import { useApi, useMutation } from '@/hooks/use-api'
import { authenticatedFetch } from '@/lib/api-helpers'
import { Sale, CreateSaleRequest } from '@/types/api'

// Fetch all sales
export function useSales() {
  return useApi<Sale[]>(
    async () => {
      const response = await authenticatedFetch('/api/sales')
      return response.json()
    },
    { key: 'sales:list', staleTime: 60000 }
  )
}

// Create new sale
export function useCreateSale() {
  return useMutation<Sale, CreateSaleRequest>(async data => {
    const response = await authenticatedFetch('/api/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  })
}

// Delete sale
export function useDeleteSale() {
  return useMutation<{ success: boolean }, string>(async id => {
    const response = await authenticatedFetch(`/api/sales?id=${id}`, {
      method: 'DELETE',
    })
    return response.json()
  })
}
