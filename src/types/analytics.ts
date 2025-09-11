// Types for advanced reporting and analytics
export type ReportType =
  | 'SALES_SUMMARY'
  | 'INVENTORY_ANALYSIS'
  | 'ORDER_ANALYTICS'
  | 'PURCHASE_REPORT'
  | 'FINANCIAL_OVERVIEW'
  | 'CUSTOMER_INSIGHTS'
  | 'PERFORMANCE_METRICS'

export type DateRange = {
  startDate: Date
  endDate: Date
  period: 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM'
}

export type ChartType = 'LINE' | 'BAR' | 'PIE' | 'AREA' | 'DONUT' | 'SCATTER'

export interface ReportFilter {
  dateRange: DateRange
  categories?: string[]
  users?: string[]
  status?: string[]
  customers?: string[]
  suppliers?: string[]
}

export interface MetricData {
  value: number
  change: number
  changePercent: number
  trend: 'UP' | 'DOWN' | 'STABLE'
  period: string
}

export interface ChartDataPoint {
  label: string
  value: number
  color?: string
  date?: Date
  category?: string
}

export interface ReportData {
  id: string
  title: string
  description: string
  type: ReportType
  generatedAt: Date
  filters: ReportFilter
  metrics: Record<string, MetricData>
  charts: Array<{
    id: string
    title: string
    type: ChartType
    data: ChartDataPoint[]
    config?: Record<string, unknown>
  }>
  tables?: Array<{
    id: string
    title: string
    headers: string[]
    rows: Array<Record<string, string | number | boolean>>
  }>
  summary?: {
    totalRecords: number
    totalValue: number
    averageValue: number
    insights: string[]
  }
}

// Sales Analytics Types
export interface SalesAnalytics {
  totalSales: MetricData
  totalRevenue: MetricData
  averageOrderValue: MetricData
  conversionRate: MetricData
  topProducts: Array<{
    productId: string
    productName: string
    quantity: number
    revenue: number
  }>
  salesByPeriod: ChartDataPoint[]
  revenueByCategory: ChartDataPoint[]
  customerSegmentation: ChartDataPoint[]
}

// Inventory Analytics Types
export interface InventoryAnalytics {
  totalItems: MetricData
  totalValue: MetricData
  lowStockItems: number
  outOfStockItems: number
  turnoverRate: MetricData
  topMovingItems: Array<{
    itemId: string
    itemName: string
    quantity: number
    velocity: number
  }>
  stockLevels: ChartDataPoint[]
  categoryDistribution: ChartDataPoint[]
  reorderAlerts: Array<{
    itemId: string
    itemName: string
    currentStock: number
    reorderLevel: number
    suggestedOrder: number
  }>
}

// Order Analytics Types
export interface OrderAnalytics {
  totalOrders: MetricData
  pendingOrders: number
  completedOrders: number
  cancelledOrders: number
  averageProcessingTime: MetricData
  ordersByStatus: ChartDataPoint[]
  ordersByPriority: ChartDataPoint[]
  orderTrends: ChartDataPoint[]
  customerOrderFrequency: ChartDataPoint[]
}

// Financial Analytics Types
export interface FinancialAnalytics {
  totalRevenue: MetricData
  totalExpenses: MetricData
  grossProfit: MetricData
  netProfit: MetricData
  profitMargin: MetricData
  revenueByMonth: ChartDataPoint[]
  expensesByCategory: ChartDataPoint[]
  profitTrends: ChartDataPoint[]
  cashFlow: ChartDataPoint[]
}

// Performance Metrics Types
export interface PerformanceMetrics {
  systemUptime: MetricData
  responseTime: MetricData
  userActivity: MetricData
  errorRate: MetricData
  dataProcessingSpeed: MetricData
  userEngagement: ChartDataPoint[]
  systemLoad: ChartDataPoint[]
  featureUsage: ChartDataPoint[]
}

// Report Generation Request
export interface ReportRequest {
  type: ReportType
  filters: ReportFilter
  includeCharts: boolean
  includeTables: boolean
  format: 'JSON' | 'PDF' | 'EXCEL' | 'CSV'
  email?: string
  schedule?: {
    frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
    time: string
    recipients: string[]
  }
}

// Dashboard Configuration
export interface DashboardConfig {
  id: string
  name: string
  description: string
  layout: Array<{
    id: string
    type: 'METRIC' | 'CHART' | 'TABLE' | 'WIDGET'
    position: { x: number; y: number; w: number; h: number }
    config: Record<string, unknown>
  }>
  refreshInterval: number
  filters: ReportFilter
  isDefault: boolean
  userId: string
}
