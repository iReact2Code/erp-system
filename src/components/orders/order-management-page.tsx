'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, RefreshCw, AlertCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import OrdersTable from '@/components/orders/orders-table'
import OrderDetailDialog from '@/components/orders/order-detail-dialog'
import OrderFormDialog from '@/components/orders/order-form-dialog'
import {
  OrderWithDetails,
  OrderFormData,
  OrderFilters,
  PaginationInfo,
} from '@/types/orders'

export default function OrderManagementPage() {
  const { data: session } = useSession()
  const t = useTranslations('orders')

  // State management
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(
    null
  )
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [formLoading, setFormLoading] = useState(false)

  // Filters and pagination
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: '',
    priority: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'orderDate',
    sortOrder: 'desc',
  })

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  })

  // Fetch orders function
  const fetchOrders = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
          ...filters,
        })

        // Remove empty filters
        Object.entries(filters).forEach(([key, value]) => {
          if (!value) {
            params.delete(key)
          }
        })

        const response = await fetch(`/api/orders?${params}`)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (data.data) {
          setOrders(data.data)
          setPagination(data.pagination)
        } else {
          throw new Error('Invalid response format')
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
        setError(
          error instanceof Error ? error.message : 'Failed to fetch orders'
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [pagination.page, pagination.limit, filters]
  )

  // Initial load
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (newFilters: Partial<OrderFilters>) => {
      setFilters(prev => ({ ...prev, ...newFilters }))
      setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
    },
    []
  )

  // Handle page changes
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }, [])

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    fetchOrders(false)
  }, [fetchOrders])

  // Handle view order
  const handleViewOrder = useCallback((order: OrderWithDetails) => {
    setSelectedOrder(order)
    setShowOrderDetail(true)
  }, [])

  // Handle edit order
  const handleEditOrder = useCallback((order: OrderWithDetails) => {
    setSelectedOrder(order)
    setFormMode('edit')
    setShowOrderForm(true)
  }, [])

  // Handle create order
  const handleCreateOrder = useCallback(() => {
    setSelectedOrder(null)
    setFormMode('create')
    setShowOrderForm(true)
  }, [])

  // Handle cancel order
  const handleCancelOrder = useCallback(
    async (order: OrderWithDetails) => {
      if (
        !confirm(`Are you sure you want to cancel order ${order.orderNumber}?`)
      ) {
        return
      }

      try {
        const response = await fetch(`/api/orders/${order.id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to cancel order')
        }

        // Refresh orders list
        await fetchOrders(false)
      } catch (error) {
        console.error('Error cancelling order:', error)
        alert('Failed to cancel order. Please try again.')
      }
    },
    [fetchOrders]
  )

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (formData: OrderFormData) => {
      setFormLoading(true)

      try {
        const url =
          formMode === 'create'
            ? '/api/orders'
            : `/api/orders/${selectedOrder?.id}`
        const method = formMode === 'create' ? 'POST' : 'PUT'

        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to save order')
        }

        // Refresh orders list
        await fetchOrders(false)
        setShowOrderForm(false)
      } catch (error) {
        console.error('Error saving order:', error)
        throw error // Re-throw to let form handle the error
      } finally {
        setFormLoading(false)
      }
    },
    [formMode, selectedOrder?.id, fetchOrders]
  )

  // Prepare form initial data for editing
  const getFormInitialData = useCallback(() => {
    if (formMode === 'edit' && selectedOrder) {
      return {
        customerName: selectedOrder.customerName,
        customerEmail: selectedOrder.customerEmail,
        customerPhone: selectedOrder.customerPhone || '',
        customerAddress: selectedOrder.customerAddress || '',
        priority: selectedOrder.priority,
        status: selectedOrder.status,
        requiredDate: selectedOrder.requiredDate
          ? new Date(selectedOrder.requiredDate).toISOString().split('T')[0]
          : '',
        notes: selectedOrder.notes || '',
        internalNotes: selectedOrder.internalNotes || '',
        items: selectedOrder.items.map(item => ({
          inventoryItemId: item.inventoryItem.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          notes: item.notes || '',
        })),
      }
    }
    return undefined
  }, [formMode, selectedOrder])

  if (!session) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-gray-500">
            Please sign in to access order management.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-gray-500">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            {t('refresh')}
          </Button>
          {session.user?.role !== 'THIRD_PARTY_CLIENT' && (
            <Button onClick={handleCreateOrder}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addOrder')}
            </Button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  {t('errorLoading')}
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchOrders()}
                className="ml-auto"
              >
                {t('tryAgain')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <OrdersTable
        orders={orders}
        pagination={pagination}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onPageChange={handlePageChange}
        onViewOrder={handleViewOrder}
        onEditOrder={handleEditOrder}
        onCancelOrder={handleCancelOrder}
        loading={loading}
        userRole={session.user?.role}
      />

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        isOpen={showOrderDetail}
        onClose={() => setShowOrderDetail(false)}
        onEdit={handleEditOrder}
        onCancel={handleCancelOrder}
        userRole={session.user?.role}
      />

      {/* Order Form Dialog */}
      <OrderFormDialog
        isOpen={showOrderForm}
        onClose={() => setShowOrderForm(false)}
        onSubmit={handleFormSubmit}
        initialData={getFormInitialData()}
        mode={formMode}
        loading={formLoading}
      />
    </div>
  )
}
