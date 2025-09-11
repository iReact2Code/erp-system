'use client'

import { useAuth } from '@/hooks/use-auth'
import { useTranslations } from 'next-intl'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const t = useTranslations('auth')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    // User will be redirected by useAuth hook
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">{t('redirecting')}</h2>
          <p className="text-muted-foreground">{t('redirectingMessage')}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
