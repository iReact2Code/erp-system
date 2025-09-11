import { useApi, useMutation } from '@/hooks/use-api'
import { authenticatedFetch } from '@/lib/api-helpers'
import { User, CreateUserRequest } from '@/types/api'

// Fetch all users
export function useUsers() {
  return useApi<User[]>(
    async () => {
      const response = await authenticatedFetch('/api/users')
      return response.json()
    },
    { key: 'users:list', staleTime: 60000 }
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
