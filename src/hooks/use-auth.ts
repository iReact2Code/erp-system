'use client'

import { useEffect, useState } from 'react'
import { createLogger, serializeError } from '@/lib/logger'
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
        authLog.error('parse_stored_user_failed', {
          error: serializeError(error),
        })
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
      authLog.error('logout_failed', { error: serializeError(error) })
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

// place logger after hook definition to avoid server-side issues during import evaluation
const authLog = createLogger('auth-hook')
