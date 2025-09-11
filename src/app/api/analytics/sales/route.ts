import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'
import type { SalesAnalytics } from '@/types/analytics'

const salesAnalyticsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  period: z.enum(['TODAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'CUSTOM']),
  includeProjections: z.boolean().optional().default(false),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const period = searchParams.get('period') || 'MONTH'

    // Validate input
    const filters = salesAnalyticsSchema.parse({
      startDate:
        startDate ||
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: endDate || new Date().toISOString(),
      period,
    })

    const startDateTime = new Date(filters.startDate)
    const endDateTime = new Date(filters.endDate)

    // Get previous period for comparison
    const periodDiff = endDateTime.getTime() - startDateTime.getTime()
    const prevStartDate = new Date(startDateTime.getTime() - periodDiff)
    const prevEndDate = new Date(startDateTime.getTime())

    // Fetch sales data
    const [currentSales, previousSales] = await Promise.all([
      db.sale.findMany({
        where: {
          saleDate: {
            gte: startDateTime,
            lte: endDateTime,
          },
        },
        include: {
          items: {
            include: {
              inventoryItem: true,
            },
          },
        },
      }),
      db.sale.findMany({
        where: {
          saleDate: {
            gte: prevStartDate,
            lt: prevEndDate,
          },
        },
      }),
    ])

    // Calculate metrics using correct field name 'total'
    const currentRevenue = currentSales.reduce(
      (sum, sale) => sum + sale.total,
      0
    )
    const previousRevenue = previousSales.reduce(
      (sum, sale) => sum + sale.total,
      0
    )
    const revenueChange = currentRevenue - previousRevenue
    const revenueChangePercent =
      previousRevenue > 0 ? (revenueChange / previousRevenue) * 100 : 0

    const currentOrderCount = currentSales.length
    const previousOrderCount = previousSales.length
    const orderChange = currentOrderCount - previousOrderCount
    const orderChangePercent =
      previousOrderCount > 0 ? (orderChange / previousOrderCount) * 100 : 0

    const avgOrderValue =
      currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0
    const prevAvgOrderValue =
      previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0
    const avgOrderValueChange = avgOrderValue - prevAvgOrderValue
    const avgOrderValueChangePercent =
      prevAvgOrderValue > 0
        ? (avgOrderValueChange / prevAvgOrderValue) * 100
        : 0

    // Get top products
    const productSales = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >()

    currentSales.forEach((sale: any) => {
      sale.items?.forEach((item: any) => {
        const key = item.inventoryItem.id
        const existing = productSales.get(key) || {
          name: item.inventoryItem.name,
          quantity: 0,
          revenue: 0,
        }
        existing.quantity += item.quantity
        existing.revenue += item.total
        productSales.set(key, existing)
      })
    })

    const topProducts = Array.from(productSales.entries())
      .map(([id, data]) => ({
        productId: id,
        productName: data.name,
        quantity: data.quantity,
        revenue: data.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Sales by period (daily breakdown)
    const salesByPeriod = []
    const current = new Date(startDateTime)
    while (current <= endDateTime) {
      const dayStart = new Date(current)
      const dayEnd = new Date(current)
      dayEnd.setHours(23, 59, 59, 999)

      const daySales = currentSales.filter(
        sale => sale.saleDate >= dayStart && sale.saleDate <= dayEnd
      )
      const dayRevenue = daySales.reduce((sum, sale) => sum + sale.total, 0)

      salesByPeriod.push({
        label: current.toISOString().split('T')[0],
        value: dayRevenue,
        date: new Date(current),
      })

      current.setDate(current.getDate() + 1)
    }

    // Revenue by category (using description as category for now)
    const categoryRevenue = new Map<string, number>()
    currentSales.forEach((sale: any) => {
      sale.items?.forEach((item: any) => {
        const category =
          item.inventoryItem.description?.split(' ')[0] || 'General'
        categoryRevenue.set(
          category,
          (categoryRevenue.get(category) || 0) + item.total
        )
      })
    })

    const revenueByCategory = Array.from(categoryRevenue.entries()).map(
      ([category, revenue]) => ({
        label: category,
        value: revenue,
      })
    )

    const analytics: SalesAnalytics = {
      totalSales: {
        value: currentOrderCount,
        change: orderChange,
        changePercent: orderChangePercent,
        trend: orderChange > 0 ? 'UP' : orderChange < 0 ? 'DOWN' : 'STABLE',
        period: filters.period,
      },
      totalRevenue: {
        value: currentRevenue,
        change: revenueChange,
        changePercent: revenueChangePercent,
        trend: revenueChange > 0 ? 'UP' : revenueChange < 0 ? 'DOWN' : 'STABLE',
        period: filters.period,
      },
      averageOrderValue: {
        value: avgOrderValue,
        change: avgOrderValueChange,
        changePercent: avgOrderValueChangePercent,
        trend:
          avgOrderValueChange > 0
            ? 'UP'
            : avgOrderValueChange < 0
              ? 'DOWN'
              : 'STABLE',
        period: filters.period,
      },
      conversionRate: {
        value: 0, // Would need website traffic data
        change: 0,
        changePercent: 0,
        trend: 'STABLE',
        period: filters.period,
      },
      topProducts,
      salesByPeriod,
      revenueByCategory,
      customerSegmentation: [], // Would need customer classification logic
    }

    return NextResponse.json({
      success: true,
      data: analytics,
    })
  } catch (error) {
    console.error('Sales analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate sales analytics' },
      { status: 500 }
    )
  }
}
