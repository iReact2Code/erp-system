'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { useParams } from 'next/navigation'
import { formatCurrency as formatCurrencyUtil } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  Package,
} from 'lucide-react'
import { OrderStatus, OrderPriority, OrderWithDetails } from '@/types/orders'

interface OrdersTableProps {
  orders: OrderWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    search: string
    status: OrderStatus | ''
    priority: OrderPriority | ''
    dateFrom: string
    dateTo: string
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }
  onFiltersChange: (filters: Partial<OrdersTableProps['filters']>) => void
  onPageChange: (page: number) => void
  onViewOrder: (order: OrderWithDetails) => void
  onEditOrder: (order: OrderWithDetails) => void
  onCancelOrder: (order: OrderWithDetails) => void
  loading?: boolean
  userRole?: string
}

// Utility functions
const formatDate = (date: Date | string, locale: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj)
}

const getStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'PROCESSING':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'SHIPPED':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'DELIVERED':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getPriorityColor = (priority: OrderPriority): string => {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'NORMAL':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'LOW':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function OrdersTable({
  orders,
  pagination,
  filters,
  onFiltersChange,
  onPageChange,
  onViewOrder,
  onEditOrder,
  onCancelOrder,
  loading = false,
  userRole,
}: OrdersTableProps) {
  const t = useTranslations('orders')
  const { locale } = useParams<{ locale: string }>()
  const canModifyOrders = userRole !== 'THIRD_PARTY_CLIENT'

  const handleSortChange = (field: string) => {
    const newSortOrder =
      filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    onFiltersChange({ sortBy: field, sortOrder: newSortOrder })
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search orders..."
                value={filters.search}
                onChange={e => onFiltersChange({ search: e.target.value })}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select
              value={filters.status}
              onValueChange={value =>
                onFiltersChange({ status: value as OrderStatus | '' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={filters.priority}
              onValueChange={value =>
                onFiltersChange({ priority: value as OrderPriority | '' })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={e => onFiltersChange({ dateFrom: e.target.value })}
                placeholder="From date"
              />
              <Input
                type="date"
                value={filters.dateTo}
                onChange={e => onFiltersChange({ dateTo: e.target.value })}
                placeholder="To date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSortChange('orderNumber')}
                  >
                    Order Number
                    {filters.sortBy === 'orderNumber' && (
                      <span className="ml-1">
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSortChange('customerName')}
                  >
                    Customer
                    {filters.sortBy === 'customerName' && (
                      <span className="ml-1">
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSortChange('orderDate')}
                  >
                    Order Date
                    {filters.sortBy === 'orderDate' && (
                      <span className="ml-1">
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSortChange('totalAmount')}
                  >
                    Total
                    {filters.sortBy === 'totalAmount' && (
                      <span className="ml-1">
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Loading orders...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p>No orders found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map(order => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(order.orderDate, locale)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(order.priority)}>
                          {order.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrencyUtil(order.totalAmount, locale)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {order.items.length} item
                          {order.items.length !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => onViewOrder(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {canModifyOrders &&
                              order.status !== 'DELIVERED' &&
                              order.status !== 'CANCELLED' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => onEditOrder(order)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Order
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => onCancelOrder(order)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Cancel Order
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} orders
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
