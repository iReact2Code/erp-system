import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, requireAuth } from '@/lib/jwt-auth'
import { db } from '@/lib/db'
import { wrapCache } from '@/lib/in-memory-cache'
import { startRequestTimer, endRequestTimer } from '@/lib/request-timing'

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    requireAuth(user)

    // Use database aggregations for better performance
    const cacheKey = `reports:summary:${new URL(request.url).search}`
    const timer = startRequestTimer(request.url)
    const [
      inventoryCount,
      salesCount,
      purchasesCount,
      revenueSum,
      lowStockCount,
      recentSales,
      recentPurchases,
    ] = await wrapCache(cacheKey, 30000, async () =>
      Promise.all([
        // Count total inventory items
        db.inventoryItem.count(),

        // Count total sales
        db.sale.count(),

        // Count total purchases
        db.purchase.count(),

        // Calculate total revenue efficiently
        db.sale.aggregate({
          _sum: {
            total: true,
          },
        }),

        // Count low stock items (quantity < 10)
        db.inventoryItem.count({
          where: {
            quantity: {
              lt: 10,
            },
          },
        }),

        // Get recent sales with minimal data
        db.sale.findMany({
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        }),

        // Get recent purchases with minimal data
        db.purchase.findMany({
          select: {
            id: true,
            total: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 3,
        }),
      ])
    )
    endRequestTimer(timer, { cacheKey })

    // Format recent transactions
    const recentTransactions = [
      ...recentSales.map(sale => ({
        type: 'sale' as const,
        amount: sale.total,
        date: sale.createdAt.toISOString(),
        description: `Sale #${sale.id.slice(0, 8)}`,
      })),
      ...recentPurchases.map(purchase => ({
        type: 'purchase' as const,
        amount: purchase.total,
        date: purchase.createdAt.toISOString(),
        description: `Purchase #${purchase.id.slice(0, 8)}`,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)

    const reportData = {
      totalInventoryItems: inventoryCount,
      totalSales: salesCount,
      totalPurchases: purchasesCount,
      totalRevenue: revenueSum._sum.total || 0,
      lowStockItems: lowStockCount,
      recentTransactions,
    }

    return NextResponse.json({
      success: true,
      data: reportData,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
