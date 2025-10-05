'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useResponsive, mobileContainer } from '@/lib/responsive-utils'
import { useParams } from 'next/navigation'
import { formatCurrency } from '@/lib/formatters'
import {
  ResponsiveDashboardLayout,
  ResponsiveGrid,
  ResponsiveMetricCard,
} from '@/components/layout/responsive-components'
import {
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'

interface DashboardData {
  metrics: {
    totalRevenue: number
    totalOrders: number
    totalProducts: number
    totalCustomers: number
    revenueChange: number
    ordersChange: number
    productsChange: number
    customersChange: number
  }
  recentOrders: Array<{
    id: string
    customer: string
    amount: number
    status: 'pending' | 'processing' | 'completed' | 'cancelled'
    date: string
  }>
  alerts: Array<{
    id: string
    type: 'warning' | 'error' | 'info'
    message: string
    priority: 'high' | 'medium' | 'low'
  }>
  lowStockItems: Array<{
    id: string
    name: string
    currentStock: number
    minStock: number
  }>
}

interface MobileDashboardProps {
  data: DashboardData
}

const getStatusBadge = (status: string) => {
  const variants = {
    pending: 'secondary',
    processing: 'default',
    completed: 'default',
    cancelled: 'destructive',
  } as const

  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <Badge
      variant={variants[status as keyof typeof variants] || 'secondary'}
      className={colors[status as keyof typeof colors] || ''}
    >
      {status}
    </Badge>
  )
}

const getAlertIcon = (type: string) => {
  switch (type) {
    case 'error':
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    case 'info':
      return <CheckCircle className="w-4 h-4 text-blue-500" />
    default:
      return <AlertTriangle className="w-4 h-4 text-gray-500" />
  }
}

const MobileRecentOrders: React.FC<{
  orders: DashboardData['recentOrders']
}> = ({ orders }) => {
  const { isMobile } = useResponsive()
  const { locale } = useParams<{ locale: string }>()

  if (isMobile) {
    return (
      <div className="space-y-3">
        {orders.slice(0, 3).map(order => (
          <Card key={order.id} className="p-3">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-sm font-medium">{order.customer}</p>
                <p className="text-xs text-muted-foreground">{order.id}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {formatCurrency(order.amount, locale)}
              </span>
              <span className="text-xs text-muted-foreground">
                {order.date}
              </span>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {orders.slice(0, 5).map(order => (
        <div
          key={order.id}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">{order.customer}</p>
                <p className="text-sm text-muted-foreground">{order.id}</p>
              </div>
              {getStatusBadge(order.status)}
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {formatCurrency(order.amount, locale)}
            </p>
            <p className="text-sm text-muted-foreground">{order.date}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

const MobileAlerts: React.FC<{ alerts: DashboardData['alerts'] }> = ({
  alerts,
}) => {
  const { isMobile } = useResponsive()

  const priorityAlerts = alerts
    .filter(alert => alert.priority === 'high')
    .slice(0, isMobile ? 2 : 4)

  if (priorityAlerts.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-muted-foreground">
            No urgent alerts
          </span>
        </div>
      </Card>
    )
  }

  return (
    <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
      {priorityAlerts.map(alert => (
        <Card key={alert.id} className="p-3">
          <div className="flex items-start gap-3">
            {getAlertIcon(alert.type)}
            <div className="flex-1">
              <p
                className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}
              >
                {alert.message}
              </p>
              <Badge
                variant="outline"
                className={`mt-1 ${isMobile ? 'text-xs' : 'text-sm'}`}
              >
                {alert.priority} priority
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

const MobileLowStock: React.FC<{ items: DashboardData['lowStockItems'] }> = ({
  items,
}) => {
  const { isMobile } = useResponsive()

  const criticalItems = items
    .filter(item => item.currentStock <= item.minStock * 0.5)
    .slice(0, isMobile ? 3 : 5)

  if (criticalItems.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-sm text-muted-foreground">
            Stock levels normal
          </span>
        </div>
      </Card>
    )
  }

  return (
    <div className={isMobile ? 'space-y-2' : 'space-y-3'}>
      {criticalItems.map(item => (
        <Card key={item.id} className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p
                className={`${isMobile ? 'text-sm' : 'text-base'} font-medium`}
              >
                {isMobile && item.name.length > 20
                  ? item.name.substring(0, 20) + '...'
                  : item.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Min: {item.minStock}
              </p>
            </div>
            <div className="text-right">
              <Badge
                variant="destructive"
                className={isMobile ? 'text-xs' : 'text-sm'}
              >
                {item.currentStock} left
              </Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ data }) => {
  const { isMobile, isTablet } = useResponsive()
  const { locale } = useParams<{ locale: string }>()

  const metricCards = [
    {
      title: 'Total Revenue',
      value: data.metrics.totalRevenue,
      change: data.metrics.revenueChange,
      changePercent:
        (data.metrics.revenueChange / data.metrics.totalRevenue) * 100,
      trend:
        data.metrics.revenueChange > 0
          ? 'UP'
          : data.metrics.revenueChange < 0
            ? 'DOWN'
            : 'STABLE',
      icon: <DollarSign className="w-4 h-4" />,
      formatter: (v: number) => formatCurrency(v, locale),
      priority: 'high',
    },
    {
      title: 'Total Orders',
      value: data.metrics.totalOrders,
      change: data.metrics.ordersChange,
      changePercent:
        (data.metrics.ordersChange / data.metrics.totalOrders) * 100,
      trend:
        data.metrics.ordersChange > 0
          ? 'UP'
          : data.metrics.ordersChange < 0
            ? 'DOWN'
            : 'STABLE',
      icon: <ShoppingCart className="w-4 h-4" />,
      priority: 'high',
    },
    {
      title: 'Products',
      value: data.metrics.totalProducts,
      change: data.metrics.productsChange,
      changePercent:
        (data.metrics.productsChange / data.metrics.totalProducts) * 100,
      trend:
        data.metrics.productsChange > 0
          ? 'UP'
          : data.metrics.productsChange < 0
            ? 'DOWN'
            : 'STABLE',
      icon: <Package className="w-4 h-4" />,
      priority: 'medium',
    },
    {
      title: 'Customers',
      value: data.metrics.totalCustomers,
      change: data.metrics.customersChange,
      changePercent:
        (data.metrics.customersChange / data.metrics.totalCustomers) * 100,
      trend:
        data.metrics.customersChange > 0
          ? 'UP'
          : data.metrics.customersChange < 0
            ? 'DOWN'
            : 'STABLE',
      icon: <Users className="w-4 h-4" />,
      priority: 'low',
    },
  ] as const

  return (
    <div className={mobileContainer}>
      <ResponsiveDashboardLayout
        title="Dashboard"
        subtitle="Overview of your business performance"
      >
        {/* Metrics Grid */}
        <ResponsiveGrid
          columns={{ mobile: 2, tablet: 2, desktop: 4 }}
          gap={isMobile ? 'sm' : 'md'}
        >
          {metricCards.map((metric, index) => (
            <ResponsiveMetricCard
              key={index}
              title={metric.title}
              value={metric.value}
              change={metric.change}
              changePercent={metric.changePercent}
              trend={metric.trend}
              icon={metric.icon}
              formatter={'formatter' in metric ? metric.formatter : undefined}
              priority={metric.priority}
            />
          ))}
        </ResponsiveGrid>

        {/* Content Sections */}
        <div
          className={`grid gap-6 ${
            isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {/* Recent Orders */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}
                >
                  Recent Orders
                </h3>
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <MobileRecentOrders orders={data.recentOrders} />
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}
                >
                  Priority Alerts
                </h3>
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              </div>
              <MobileAlerts alerts={data.alerts} />
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Items */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'}`}
              >
                Critical Stock Levels
              </h3>
              <Package className="w-4 h-4 text-muted-foreground" />
            </div>
            <MobileLowStock items={data.lowStockItems} />
          </CardContent>
        </Card>
      </ResponsiveDashboardLayout>
    </div>
  )
}

export default MobileDashboard
