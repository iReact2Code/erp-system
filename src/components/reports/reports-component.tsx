'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { authenticatedFetch } from '@/lib/api-helpers'
import {
  BarChart3,
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ReportData {
  totalInventoryItems: number
  totalSales: number
  totalPurchases: number
  totalRevenue: number
  lowStockItems: number
  recentTransactions: {
    type: 'sale' | 'purchase'
    amount: number
    date: string
    description: string
  }[]
}

export function ReportsComponent() {
  const [reportData, setReportData] = useState<ReportData>({
    totalInventoryItems: 0,
    totalSales: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    lowStockItems: 0,
    recentTransactions: [],
  })
  const [loading, setLoading] = useState(true)
  const t = useTranslations('common')
  const tReports = useTranslations('reports')

  useEffect(() => {
    fetchReportData()
  }, [])

  const fetchReportData = async () => {
    try {
      // Fetch inventory data
      const inventoryResponse = await authenticatedFetch('/api/inventory')
      const inventoryData = inventoryResponse.ok
        ? await inventoryResponse.json()
        : { data: [] }
      const inventory = Array.isArray(inventoryData.data)
        ? inventoryData.data
        : Array.isArray(inventoryData)
          ? inventoryData
          : []

      // Fetch sales data
      const salesResponse = await authenticatedFetch('/api/sales')
      const salesData = salesResponse.ok
        ? await salesResponse.json()
        : { data: [] }
      const sales = Array.isArray(salesData.data)
        ? salesData.data
        : Array.isArray(salesData)
          ? salesData
          : []

      // Fetch purchases data
      const purchasesResponse = await authenticatedFetch('/api/purchases')
      const purchasesData = purchasesResponse.ok
        ? await purchasesResponse.json()
        : { data: [] }
      const purchases = Array.isArray(purchasesData.data)
        ? purchasesData.data
        : Array.isArray(purchasesData)
          ? purchasesData
          : []

      // Calculate metrics
      const totalRevenue = sales.reduce(
        (sum: number, sale: { total: number }) => sum + sale.total,
        0
      )
      const lowStockItems = inventory.filter(
        (item: { quantity: number }) => item.quantity < 10
      ).length

      // Create recent transactions
      const recentTransactions = [
        ...sales
          .slice(0, 3)
          .map((sale: { total: number; createdAt: string; id: string }) => ({
            type: 'sale' as const,
            amount: sale.total,
            date: sale.createdAt,
            description: `Sale #${sale.id.slice(0, 8)}`,
          })),
        ...purchases
          .slice(0, 3)
          .map(
            (purchase: { total: number; createdAt: string; id: string }) => ({
              type: 'purchase' as const,
              amount: purchase.total,
              date: purchase.createdAt,
              description: `Purchase #${purchase.id.slice(0, 8)}`,
            })
          ),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)

      setReportData({
        totalInventoryItems: inventory.length,
        totalSales: sales.length,
        totalPurchases: purchases.length,
        totalRevenue,
        lowStockItems,
        recentTransactions,
      })
    } catch (error) {
      console.error('Error fetching report data:', error)
      // Set safe default values in case of error
      setReportData({
        totalInventoryItems: 0,
        totalSales: 0,
        totalPurchases: 0,
        totalRevenue: 0,
        lowStockItems: 0,
        recentTransactions: [],
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            {tReports('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">{t('loadingReports')}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            {tReports('title')}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {tReports('totalProducts')}
            </CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData.totalInventoryItems}
            </div>
            <p className="text-xs text-muted-foreground">
              {tReports('activeInventoryItems')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {tReports('totalSales')}
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalSales}</div>
            <p className="text-xs text-muted-foreground">
              {tReports('completedTransactions')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {tReports('totalRevenue')}
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${reportData.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {tReports('fromSalesTransactions')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              {tReports('lowStockAlert')}
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              {tReports('itemsBelowTenUnits')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>{tReports('recentTransactions')}</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData.recentTransactions.length === 0 ? (
            <div className="py-8 text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold">No transactions found</h3>
              <p className="text-muted-foreground">
                Start by creating sales or purchases to see activity here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportData.recentTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <Badge
                      variant={
                        transaction.type === 'sale' ? 'default' : 'secondary'
                      }
                    >
                      {transaction.type === 'sale' ? 'Sale' : 'Purchase'}
                    </Badge>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="font-bold">
                    ${transaction.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
