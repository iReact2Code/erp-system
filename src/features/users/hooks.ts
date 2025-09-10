import { useApi, useMutation } from '@/hooks/use-api'
import { User, CreateUserRequest } from '@/types/api'

// Fetch all users
export function useUsers() {
  return useApi<User[]>(async () => {
    const response = await fetch('/api/users')
    return response.json()
  })
}

// Create new user
export function useCreateUser() {
  return useMutation<User, CreateUserRequest>(async data => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  })
}

// Delete user
export function useDeleteUser() {
  return useMutation<{ success: boolean }, string>(async id => {
    const response = await fetch(`/api/users?id=${id}`, {
      method: 'DELETE',
    })
    return response.json()
  })
}
