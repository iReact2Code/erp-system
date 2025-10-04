import React from 'react'
import Email from '@/components/ui/email'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Eye,
  Package,
  User,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  Truck,
} from 'lucide-react'
import { OrderStatus, OrderPriority, OrderWithDetails } from '@/types/orders'

interface OrderDetailDialogProps {
  order: OrderWithDetails | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (order: OrderWithDetails) => void
  onCancel?: (order: OrderWithDetails) => void
  userRole?: string
}

// Utility functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'PENDING':
      return <Calendar className="h-4 w-4" />
    case 'CONFIRMED':
      return <FileText className="h-4 w-4" />
    case 'PROCESSING':
      return <Package className="h-4 w-4" />
    case 'SHIPPED':
      return <Truck className="h-4 w-4" />
    case 'DELIVERED':
      return <Package className="h-4 w-4" />
    case 'CANCELLED':
      return <FileText className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export default function OrderDetailDialog({
  order,
  isOpen,
  onClose,
  onEdit,
  onCancel,
  userRole,
}: OrderDetailDialogProps) {
  if (!order) return null

  const canModifyOrders = userRole !== 'THIRD_PARTY_CLIENT'
  const canEditOrder =
    canModifyOrders &&
    order.status !== 'DELIVERED' &&
    order.status !== 'CANCELLED'
  const canCancelOrder =
    canModifyOrders &&
    order.status !== 'DELIVERED' &&
    order.status !== 'CANCELLED'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Order Details - {order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Complete information for order #{order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Status and Priority */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge className={getStatusColor(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-2">{order.status}</span>
              </Badge>
              <Badge className={getPriorityColor(order.priority)}>
                {order.priority} Priority
              </Badge>
            </div>
            <div className="text-sm text-gray-500">
              Created: {formatDate(order.createdAt)}
            </div>
          </div>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Name
                </label>
                <p className="text-sm">{order.customerName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <p className="text-sm">
                  <Email>{order.customerEmail}</Email>
                </p>
              </div>
              {order.customerPhone && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  <p className="text-sm">{order.customerPhone}</p>
                </div>
              )}
              {order.customerAddress && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Address
                  </label>
                  <p className="text-sm flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                    {order.customerAddress}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Order Date
                  </label>
                  <p className="text-sm">{formatDate(order.orderDate)}</p>
                </div>
                {order.requiredDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Required Date
                    </label>
                    <p className="text-sm">{formatDate(order.requiredDate)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Last Updated
                  </label>
                  <p className="text-sm">{formatDate(order.updatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Created By
                  </label>
                  <p className="text-sm">
                    {order.user.name || <Email>{order.user.email}</Email>}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map(item => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.inventoryItem.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {item.inventoryItem.sku}
                        </div>
                        {item.inventoryItem.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {item.inventoryItem.description}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                            <strong>Note:</strong> {item.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-medium">
                          {formatCurrency(item.total)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </div>
                        {item.discount > 0 && (
                          <div className="text-sm text-green-600">
                            Discount: -{formatCurrency(item.discount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {(order.notes || order.internalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Customer Notes
                    </label>
                    <p className="text-sm mt-1 p-3 bg-gray-50 rounded-md">
                      {order.notes}
                    </p>
                  </div>
                )}
                {order.internalNotes && canModifyOrders && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Internal Notes
                    </label>
                    <p className="text-sm mt-1 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                      {order.internalNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {canEditOrder && onEdit && (
              <Button variant="outline" onClick={() => onEdit(order)}>
                <FileText className="h-4 w-4 mr-2" />
                Edit Order
              </Button>
            )}
            {canCancelOrder && onCancel && (
              <Button variant="destructive" onClick={() => onCancel(order)}>
                Cancel Order
              </Button>
            )}
          </div>
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
