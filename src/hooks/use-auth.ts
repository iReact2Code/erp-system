'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { JWTUser } from '@/lib/jwt-auth'

export function useAuth() {
  const [user, setUser] = useState<JWTUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('auth-token')

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
        localStorage.removeItem('user')
        localStorage.removeItem('auth-token')
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    // Only redirect if not loading and no user, and not already on auth pages
    if (
      !loading &&
      !user &&
      !pathname.includes('/login') &&
      !pathname.includes('/register')
    ) {
      router.push('/login')
    }
  }, [loading, user, pathname, router])

  const signOut = async () => {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('user')
    setUser(null)

    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    }

    router.push('/login')
  }

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
  }
}
