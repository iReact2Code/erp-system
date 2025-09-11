'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [user, setUser] = useState<{
    id: string
    name: string
    email: string
    role: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const t = useTranslations('dashboard')

  useEffect(() => {
    // Check for stored user data
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('auth-token')

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div>{t('loading')}</div>
  }

  if (!user) {
    return <div>{t('pleaseLogin')}</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="animate-slide-in-left">
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">
          {t('welcome')}, {user?.name}! {t('role')}: {user?.role}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stats-grid">
        <Card className="rtl:text-right hover-lift animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalSales')}
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground stat-icon" />
          </CardHeader>
          <CardContent className="card-content">
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              +0% {t('stats.fromLastMonth')}
            </p>
          </CardContent>
        </Card>
        <Card
          className="rtl:text-right hover-lift animate-scale-in"
          style={{ animationDelay: '0.1s' }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('stats.inventoryItems')}
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground stat-icon" />
          </CardHeader>
          <CardContent className="card-content">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              0 {t('stats.itemsLowStock')}
            </p>
          </CardContent>
        </Card>
        <Card
          className="rtl:text-right hover-lift animate-scale-in"
          style={{ animationDelay: '0.2s' }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('stats.activeOrders')}
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground stat-icon" />
          </CardHeader>
          <CardContent className="card-content">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              0 {t('stats.pendingApproval')}
            </p>
          </CardContent>
        </Card>
        <Card
          className="rtl:text-right hover-lift animate-scale-in"
          style={{ animationDelay: '0.3s' }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalUsers')}
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground stat-icon" />
          </CardHeader>
          <CardContent className="card-content">
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              {user?.role?.toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-slide-in-right">
        <Card className="rtl:text-right hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('quickActions.recentActivity')}
            </CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {t('quickActions.noRecentActivity')}
            </div>
          </CardContent>
        </Card>

        <Card className="rtl:text-right hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('quickActions.lowStockAlerts')}
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              {t('quickActions.noLowStockItems')}
            </div>
          </CardContent>
        </Card>

        <Card className="rtl:text-right hover-lift">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('quickActions.systemHealth')}
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-600">
              {t('quickActions.allSystemsOperational')}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
