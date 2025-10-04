import { useApi, useMutation } from '@/hooks/use-api'
import { authenticatedFetch } from '@/lib/api-helpers'
import { User, CreateUserRequest } from '@/types/api'

type UseUsersParams = {
  q?: string
  page?: number
  limit?: number
}

// Fetch users (supports paginated response when page provided)
export function useUsers(params?: UseUsersParams) {
  const q = params?.q || ''
  const page = params?.page
  const limit = params?.limit

  const query = new URLSearchParams()
  if (q) query.set('q', q)
  if (page) query.set('page', String(page))
  if (limit) query.set('limit', String(limit))

  const key = `users:list${query.toString() ? `:${query.toString()}` : ''}`

  return useApi<
    | User[]
    | {
        data: User[]
        pagination: {
          page: number
          limit: number
          total: number
          pages: number
        }
      }
  >(
    async () => {
      const url = `/api/users${query.toString() ? `?${query.toString()}` : ''}`
      const response = await authenticatedFetch(url)
      return response.json()
    },
    { key, staleTime: 60000 }
  )
}

// Create new user
export function useCreateUser() {
  return useMutation<User, CreateUserRequest>(async data => {
    const response = await authenticatedFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.json()
  })
}

// Delete user
export function useDeleteUser() {
  return useMutation<{ success: boolean }, string>(async id => {
    const response = await authenticatedFetch(`/api/users?id=${id}`, {
      method: 'DELETE',
    })
    return response.json()
  })
}
