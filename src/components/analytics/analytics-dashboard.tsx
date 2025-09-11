'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Download,
  RefreshCw,
} from 'lucide-react'
import type { SalesAnalytics } from '@/types/analytics'

interface AnalyticsDashboardProps {
  defaultPeriod?: string
  userRole?: string
}

// Metric card component
interface MetricCardProps {
  title: string
  value: string | number
  change: number
  changePercent: number
  trend: 'UP' | 'DOWN' | 'STABLE'
  icon: React.ReactNode
  formatter?: (value: number) => string
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changePercent,
  trend,
  icon,
  formatter = v => v.toString(),
}) => {
  const formatChange = (val: number) => {
    if (Math.abs(val) >= 1000000) return `${(val / 1000000).toFixed(1)}M`
    if (Math.abs(val) >= 1000) return `${(val / 1000).toFixed(1)}K`
    return val.toFixed(0)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? formatter(value) : value}
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
          {trend === 'UP' && (
            <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
          )}
          {trend === 'DOWN' && (
            <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
          )}
          <span
            className={
              trend === 'UP'
                ? 'text-green-600'
                : trend === 'DOWN'
                  ? 'text-red-600'
                  : 'text-gray-600'
            }
          >
            {changePercent > 0 ? '+' : ''}
            {changePercent.toFixed(1)}%
          </span>
          <span className="ml-1">
            ({change > 0 ? '+' : ''}
            {formatChange(change)})
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Chart component
interface ChartCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  children,
  className,
}) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle className="text-lg font-semibold">{title}</CardTitle>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
)

// Color palette for charts
const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
]

export default function AnalyticsDashboard({
  defaultPeriod = 'MONTH',
}: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState(defaultPeriod)
  const [activeTab, setActiveTab] = useState('sales')

  // Simulate API call for now
  const [salesData, setSalesData] = useState<SalesAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setSalesData({
        totalSales: {
          value: 150,
          change: 12,
          changePercent: 8.7,
          trend: 'UP',
          period: period,
        },
        totalRevenue: {
          value: 45000,
          change: 3500,
          changePercent: 8.4,
          trend: 'UP',
          period: period,
        },
        averageOrderValue: {
          value: 300,
          change: 15,
          changePercent: 5.3,
          trend: 'UP',
          period: period,
        },
        conversionRate: {
          value: 2.4,
          change: 0.2,
          changePercent: 9.1,
          trend: 'UP',
          period: period,
        },
        topProducts: [
          {
            productId: '1',
            productName: 'Product A',
            quantity: 45,
            revenue: 13500,
          },
          {
            productId: '2',
            productName: 'Product B',
            quantity: 38,
            revenue: 11400,
          },
          {
            productId: '3',
            productName: 'Product C',
            quantity: 32,
            revenue: 9600,
          },
        ],
        salesByPeriod: [],
        revenueByCategory: [
          { label: 'Electronics', value: 25000 },
          { label: 'Clothing', value: 15000 },
          { label: 'Books', value: 5000 },
        ],
        customerSegmentation: [],
      })
      setLoading(false)
    }, 1000)
  }, [period])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const handleRefresh = () => {
    setLoading(true)
    // Simulate refresh
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  const handleExport = (format: 'PDF' | 'EXCEL' | 'CSV') => {
    console.log(`Exporting ${activeTab} analytics as ${format}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading analytics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your business performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="WEEK">This Week</SelectItem>
              <SelectItem value="MONTH">This Month</SelectItem>
              <SelectItem value="QUARTER">This Quarter</SelectItem>
              <SelectItem value="YEAR">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport('PDF')}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Analytics</TabsTrigger>
          <TabsTrigger value="orders">Order Analytics</TabsTrigger>
          <TabsTrigger value="financial">Financial Overview</TabsTrigger>
        </TabsList>

        {/* Sales Analytics Tab */}
        <TabsContent value="sales" className="space-y-6">
          {salesData && (
            <>
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Total Sales"
                  value={salesData.totalSales.value}
                  change={salesData.totalSales.change}
                  changePercent={salesData.totalSales.changePercent}
                  trend={salesData.totalSales.trend}
                  icon={
                    <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                  }
                />
                <MetricCard
                  title="Total Revenue"
                  value={salesData.totalRevenue.value}
                  change={salesData.totalRevenue.change}
                  changePercent={salesData.totalRevenue.changePercent}
                  trend={salesData.totalRevenue.trend}
                  icon={
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                  }
                  formatter={formatCurrency}
                />
                <MetricCard
                  title="Average Order Value"
                  value={salesData.averageOrderValue.value}
                  change={salesData.averageOrderValue.change}
                  changePercent={salesData.averageOrderValue.changePercent}
                  trend={salesData.averageOrderValue.trend}
                  icon={
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  }
                  formatter={formatCurrency}
                />
                <MetricCard
                  title="Conversion Rate"
                  value={`${salesData.conversionRate.value.toFixed(1)}%`}
                  change={salesData.conversionRate.change}
                  changePercent={salesData.conversionRate.changePercent}
                  trend={salesData.conversionRate.trend}
                  icon={<Users className="w-4 h-4 text-muted-foreground" />}
                />
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-2">
                <ChartCard title="Sales Trend">
                  <div className="flex items-center justify-center rounded h-300 bg-muted/20">
                    <div className="text-center">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Sales trend chart
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (Chart visualization coming soon)
                      </p>
                    </div>
                  </div>
                </ChartCard>

                <ChartCard title="Revenue by Category">
                  <div className="space-y-4">
                    {salesData.revenueByCategory.map((category, index) => (
                      <div
                        key={category.label}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                          <span className="text-sm font-medium">
                            {category.label}
                          </span>
                        </div>
                        <span className="text-sm font-semibold">
                          {formatCurrency(category.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>

              {/* Top Products Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesData.topProducts.map((product, index) => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <Badge variant="secondary">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            <p className="text-sm text-muted-foreground">
                              {product.quantity} units sold
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(product.revenue)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Other tabs would be implemented similarly */}
        <TabsContent value="inventory" className="space-y-6">
          <div className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Inventory Analytics</h3>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-6">
          <div className="py-12 text-center">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Order Analytics</h3>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="py-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Financial Overview</h3>
            <p className="text-muted-foreground">Coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
