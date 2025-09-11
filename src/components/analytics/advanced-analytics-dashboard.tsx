'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useResponsive } from '@/lib/responsive-utils'
import {
  ResponsiveDashboardLayout,
  ResponsiveGrid,
} from '@/components/layout/responsive-components'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  ShoppingCart,
  Calendar,
  Download,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Zap,
} from 'lucide-react'

interface AdvancedMetric {
  id: string
  title: string
  value: number
  previousValue: number
  target?: number
  unit: string
  format: 'currency' | 'number' | 'percentage'
  trend: 'up' | 'down' | 'stable'
  category: 'revenue' | 'customers' | 'inventory' | 'orders'
  icon: React.ReactNode
  color: string
}

interface TimeSeriesData {
  date: string
  revenue: number
  orders: number
  customers: number
  inventory: number
}

interface CategoryData {
  name: string
  value: number
  color: string
}

interface PredictiveInsight {
  id: string
  type: 'opportunity' | 'risk' | 'recommendation'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  actionable: boolean
  category: string
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const { isMobile } = useResponsive()
  const [selectedPeriod, setSelectedPeriod] = useState('30d')
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(false)

  // Mock data - in real app, this would come from API
  const [timeSeriesData] = useState<TimeSeriesData[]>([
    {
      date: '2025-09-01',
      revenue: 45000,
      orders: 120,
      customers: 95,
      inventory: 1500,
    },
    {
      date: '2025-09-02',
      revenue: 52000,
      orders: 135,
      customers: 110,
      inventory: 1485,
    },
    {
      date: '2025-09-03',
      revenue: 48000,
      orders: 128,
      customers: 105,
      inventory: 1470,
    },
    {
      date: '2025-09-04',
      revenue: 61000,
      orders: 155,
      customers: 125,
      inventory: 1455,
    },
    {
      date: '2025-09-05',
      revenue: 58000,
      orders: 148,
      customers: 118,
      inventory: 1440,
    },
    {
      date: '2025-09-06',
      revenue: 65000,
      orders: 162,
      customers: 135,
      inventory: 1425,
    },
    {
      date: '2025-09-07',
      revenue: 71000,
      orders: 178,
      customers: 145,
      inventory: 1410,
    },
    {
      date: '2025-09-08',
      revenue: 68000,
      orders: 171,
      customers: 142,
      inventory: 1395,
    },
    {
      date: '2025-09-09',
      revenue: 74000,
      orders: 185,
      customers: 155,
      inventory: 1380,
    },
    {
      date: '2025-09-10',
      revenue: 78000,
      orders: 195,
      customers: 165,
      inventory: 1365,
    },
    {
      date: '2025-09-11',
      revenue: 82000,
      orders: 205,
      customers: 175,
      inventory: 1350,
    },
  ])

  const [categoryData] = useState<CategoryData[]>([
    { name: 'Electronics', value: 35, color: '#3b82f6' },
    { name: 'Clothing', value: 25, color: '#10b981' },
    { name: 'Books', value: 20, color: '#f59e0b' },
    { name: 'Home & Garden', value: 15, color: '#ef4444' },
    { name: 'Sports', value: 5, color: '#8b5cf6' },
  ])

  const [metrics] = useState<AdvancedMetric[]>([
    {
      id: 'total_revenue',
      title: 'Total Revenue',
      value: 682000,
      previousValue: 625000,
      target: 700000,
      unit: 'USD',
      format: 'currency',
      trend: 'up',
      category: 'revenue',
      icon: <DollarSign className="h-4 w-4" />,
      color: '#10b981',
    },
    {
      id: 'active_customers',
      title: 'Active Customers',
      value: 1425,
      previousValue: 1356,
      target: 1500,
      unit: '',
      format: 'number',
      trend: 'up',
      category: 'customers',
      icon: <Users className="h-4 w-4" />,
      color: '#3b82f6',
    },
    {
      id: 'total_orders',
      title: 'Total Orders',
      value: 1674,
      previousValue: 1598,
      target: 1800,
      unit: '',
      format: 'number',
      trend: 'up',
      category: 'orders',
      icon: <ShoppingCart className="h-4 w-4" />,
      color: '#f59e0b',
    },
    {
      id: 'inventory_turnover',
      title: 'Inventory Turnover',
      value: 4.2,
      previousValue: 3.8,
      target: 5.0,
      unit: 'x',
      format: 'number',
      trend: 'up',
      category: 'inventory',
      icon: <Package className="h-4 w-4" />,
      color: '#ef4444',
    },
    {
      id: 'conversion_rate',
      title: 'Conversion Rate',
      value: 3.8,
      previousValue: 3.2,
      target: 4.5,
      unit: '%',
      format: 'percentage',
      trend: 'up',
      category: 'customers',
      icon: <Target className="h-4 w-4" />,
      color: '#8b5cf6',
    },
    {
      id: 'avg_order_value',
      title: 'Avg Order Value',
      value: 127.5,
      previousValue: 118.25,
      target: 135.0,
      unit: 'USD',
      format: 'currency',
      trend: 'up',
      category: 'revenue',
      icon: <TrendingUp className="h-4 w-4" />,
      color: '#06b6d4',
    },
  ])

  const [insights] = useState<PredictiveInsight[]>([
    {
      id: 'insight_1',
      type: 'opportunity',
      title: 'Revenue Growth Opportunity',
      description:
        'Electronics category showing 25% growth trend. Consider increasing inventory and marketing focus.',
      impact: 'high',
      confidence: 87,
      actionable: true,
      category: 'revenue',
    },
    {
      id: 'insight_2',
      type: 'risk',
      title: 'Inventory Stock Risk',
      description:
        'Premium headphones likely to stock out within 3 days based on current demand pattern.',
      impact: 'medium',
      confidence: 92,
      actionable: true,
      category: 'inventory',
    },
    {
      id: 'insight_3',
      type: 'recommendation',
      title: 'Customer Retention Improvement',
      description:
        'Implementing loyalty program could increase repeat purchases by estimated 15%.',
      impact: 'high',
      confidence: 78,
      actionable: true,
      category: 'customers',
    },
  ])

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (autoRefresh) {
      interval = setInterval(() => {
        setLastUpdated(new Date())
        // In real app, this would trigger data refresh
      }, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const formatValue = (metric: AdvancedMetric): string => {
    switch (metric.format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
        }).format(metric.value)
      case 'percentage':
        return `${metric.value}%`
      default:
        return metric.value.toLocaleString()
    }
  }

  const getChangePercent = (current: number, previous: number): number => {
    return ((current - previous) / previous) * 100
  }

  const getProgressToTarget = (current: number, target?: number): number => {
    if (!target) return 0
    return Math.min((current / target) * 100, 100)
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const handleExportData = () => {
    // In real app, this would export actual data
    const csvContent = [
      ['Date', 'Revenue', 'Orders', 'Customers', 'Inventory'],
      ...timeSeriesData.map(row => [
        row.date,
        row.revenue,
        row.orders,
        row.customers,
        row.inventory,
      ]),
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-export-${selectedPeriod}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const AdvancedMetricCard: React.FC<{ metric: AdvancedMetric }> = ({
    metric,
  }) => {
    const changePercent = getChangePercent(metric.value, metric.previousValue)
    const progressToTarget = getProgressToTarget(metric.value, metric.target)

    return (
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-50/50" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle
            className={`text-sm font-medium ${isMobile ? 'text-xs' : ''}`}
          >
            {metric.title}
          </CardTitle>
          <div
            className="p-2 rounded-full"
            style={{ backgroundColor: `${metric.color}20` }}
          >
            <div style={{ color: metric.color }}>{metric.icon}</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {formatValue(metric)}
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center text-xs text-muted-foreground">
              {metric.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : metric.trend === 'down' ? (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              ) : null}
              <span
                className={
                  changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }
              >
                {changePercent >= 0 ? '+' : ''}
                {changePercent.toFixed(1)}%
              </span>
            </div>

            {metric.target && (
              <div className="text-xs text-muted-foreground">
                Target: {progressToTarget.toFixed(0)}%
              </div>
            )}
          </div>

          {metric.target && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress to Target</span>
                <span>{formatValue({ ...metric, value: metric.target })}</span>
              </div>
              <Progress
                value={progressToTarget}
                className="h-2"
                style={{ backgroundColor: `${metric.color}20` }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const InsightCard: React.FC<{ insight: PredictiveInsight }> = ({
    insight,
  }) => {
    const getInsightIcon = () => {
      switch (insight.type) {
        case 'opportunity':
          return <TrendingUp className="h-4 w-4 text-green-500" />
        case 'risk':
          return <TrendingDown className="h-4 w-4 text-red-500" />
        case 'recommendation':
          return <Zap className="h-4 w-4 text-blue-500" />
      }
    }

    const getInsightColor = () => {
      switch (insight.type) {
        case 'opportunity':
          return 'border-green-200 bg-green-50'
        case 'risk':
          return 'border-red-200 bg-red-50'
        case 'recommendation':
          return 'border-blue-200 bg-blue-50'
      }
    }

    return (
      <Card className={`${getInsightColor()} transition-all hover:shadow-md`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {getInsightIcon()}
              <Badge
                variant={insight.impact === 'high' ? 'default' : 'secondary'}
              >
                {insight.impact} impact
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {insight.confidence}% confidence
            </div>
          </div>

          <h4 className="font-semibold mb-1">{insight.title}</h4>
          <p className="text-sm text-muted-foreground mb-3">
            {insight.description}
          </p>

          {insight.actionable && (
            <Button size="sm" variant="outline" className="w-full">
              Take Action
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <ResponsiveDashboardLayout
        title="Advanced Analytics"
        subtitle={`Last updated: ${lastUpdated.toLocaleTimeString()}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            >
              <Activity className="h-4 w-4 mr-2" />
              {autoRefresh ? 'Live' : 'Auto-refresh'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        }
      >
        {/* Period Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Time Period:</span>
              </div>
              <div className="flex gap-2">
                {['7d', '30d', '90d', '1y'].map(period => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                  >
                    {period}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Metrics Grid */}
        <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
          {metrics.map(metric => (
            <AdvancedMetricCard key={metric.id} metric={metric} />
          ))}
        </ResponsiveGrid>

        {/* Charts and Analytics */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList
            className={`grid w-full ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}
          >
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            {!isMobile && (
              <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            )}
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue & Orders Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="orders"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Orders"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div
              className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Revenue by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {!isMobile && (
            <TabsContent value="forecasting" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Predictive Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f620"
                        name="Revenue"
                      />
                      <Area
                        type="monotone"
                        dataKey="customers"
                        stackId="2"
                        stroke="#10b981"
                        fill="#10b98120"
                        name="New Customers"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="insights" className="space-y-4">
            <ResponsiveGrid
              columns={{ mobile: 1, tablet: 1, desktop: 2 }}
              gap="md"
            >
              {insights.map(insight => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </ResponsiveGrid>
          </TabsContent>
        </Tabs>
      </ResponsiveDashboardLayout>
    </div>
  )
}

export default AdvancedAnalyticsDashboard
