'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, Package, ShoppingCart, X } from 'lucide-react'

// Import shared types
import { OrderStatus, OrderPriority, OrderFormData } from '@/types/orders'

interface InventoryItem {
  id: string
  name: string
  sku: string
  description: string | null
  price: number
  quantity: number
}

interface OrderItem {
  inventoryItemId: string
  quantity: number
  unitPrice: number
  discount: number
  notes?: string
  inventoryItem?: InventoryItem
}

interface OrderFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: OrderFormData) => Promise<void>
  initialData?: Partial<OrderFormData>
  mode: 'create' | 'edit'
  loading?: boolean
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export default function OrderFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
  loading = false,
}: OrderFormDialogProps) {
  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    priority: 'NORMAL',
    status: 'PENDING',
    requiredDate: '',
    notes: '',
    internalNotes: '',
    items: [],
  })

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when dialog opens or initial data changes
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        items: initialData.items || [],
      }))
    }
  }, [initialData])

  // Fetch inventory items
  const fetchInventoryItems = React.useCallback(async () => {
    setInventoryLoading(true)
    try {
      const response = await fetch('/api/inventory')
      if (response.ok) {
        const data = await response.json()
        setInventoryItems(data.data || data)
      } else {
        console.error('Failed to fetch inventory items')
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setInventoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchInventoryItems()
    }
  }, [isOpen, fetchInventoryItems])

  const handleInputChange = (field: keyof OrderFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addOrderItem = (inventoryItem: InventoryItem) => {
    const existingItemIndex = formData.items.findIndex(
      item => item.inventoryItemId === inventoryItem.id
    )

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...formData.items]
      updatedItems[existingItemIndex].quantity += 1
      setFormData(prev => ({ ...prev, items: updatedItems }))
    } else {
      // Add new item
      const newItem: OrderItem = {
        inventoryItemId: inventoryItem.id,
        quantity: 1,
        unitPrice: inventoryItem.price,
        discount: 0,
        notes: '',
        inventoryItem,
      }
      setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }))
    }
  }

  const updateOrderItem = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updatedItems = [...formData.items]
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      updatedItems[index][field] = Number(value)
    } else if (field === 'notes') {
      updatedItems[index][field] = value as string
    }
    setFormData(prev => ({ ...prev, items: updatedItems }))
  }

  const removeOrderItem = (index: number) => {
    const updatedItems = formData.items.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, items: updatedItems }))
  }

  const calculateSubtotal = () => {
    return formData.items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice - item.discount)
    }, 0)
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = subtotal * 0.1 // 10% tax
    return subtotal + tax
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Customer name is required'
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = 'Customer email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address'
    }

    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required'
    }

    // Validate item quantities
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i]
      if (item.quantity <= 0) {
        newErrors[`item_${i}_quantity`] = 'Quantity must be greater than 0'
      }
      if (item.unitPrice <= 0) {
        newErrors[`item_${i}_price`] = 'Unit price must be greater than 0'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
      onClose()
      // Reset form for next use
      if (mode === 'create') {
        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
          customerAddress: '',
          priority: 'NORMAL',
          requiredDate: '',
          notes: '',
          internalNotes: '',
          items: [],
        })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const filteredInventoryItems = inventoryItems.filter(
    item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {mode === 'create' ? 'Create New Order' : 'Edit Order'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Fill in the details below to create a new order'
              : 'Update the order details as needed'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={e =>
                      handleInputChange('customerName', e.target.value)
                    }
                    placeholder="Enter customer name"
                  />
                  {errors.customerName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customerName}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerEmail">Customer Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={e =>
                      handleInputChange('customerEmail', e.target.value)
                    }
                    placeholder="Enter customer email"
                  />
                  {errors.customerEmail && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customerEmail}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="customerPhone">Customer Phone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={e =>
                      handleInputChange('customerPhone', e.target.value)
                    }
                    placeholder="Enter customer phone"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: OrderPriority) =>
                      handleInputChange('priority', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="customerAddress">Customer Address</Label>
                <Textarea
                  id="customerAddress"
                  value={formData.customerAddress}
                  onChange={e =>
                    handleInputChange('customerAddress', e.target.value)
                  }
                  placeholder="Enter customer address"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="requiredDate">Required Date</Label>
                  <Input
                    id="requiredDate"
                    type="date"
                    value={formData.requiredDate}
                    onChange={e =>
                      handleInputChange('requiredDate', e.target.value)
                    }
                  />
                </div>
                {mode === 'edit' && (
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: OrderStatus) =>
                        handleInputChange('status', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                        <SelectItem value="PROCESSING">Processing</SelectItem>
                        <SelectItem value="SHIPPED">Shipped</SelectItem>
                        <SelectItem value="DELIVERED">Delivered</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Order Items ({formData.items.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Item Section */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <Label htmlFor="itemSearch">Add Items</Label>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="itemSearch"
                      placeholder="Search inventory items..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {inventoryLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  </div>
                ) : (
                  <div className="max-h-32 overflow-y-auto mt-2">
                    {filteredInventoryItems.slice(0, 5).map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 hover:bg-white rounded cursor-pointer"
                        onClick={() => addOrderItem(item)}
                      >
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            SKU: {item.sku} | Available: {item.quantity} |{' '}
                            {formatCurrency(item.price)}
                          </div>
                        </div>
                        <Button type="button" size="sm" variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errors.items && (
                <p className="text-red-500 text-sm">{errors.items}</p>
              )}

              {/* Order Items List */}
              <div className="space-y-3">
                {formData.items.map((item, index) => (
                  <div
                    key={`${item.inventoryItemId}-${index}`}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">
                          {item.inventoryItem?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          SKU: {item.inventoryItem?.sku}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOrderItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div>
                        <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e =>
                            updateOrderItem(index, 'quantity', e.target.value)
                          }
                        />
                        {errors[`item_${index}_quantity`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item_${index}_quantity`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`unitPrice-${index}`}>Unit Price</Label>
                        <Input
                          id={`unitPrice-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={e =>
                            updateOrderItem(index, 'unitPrice', e.target.value)
                          }
                        />
                        {errors[`item_${index}_price`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item_${index}_price`]}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor={`discount-${index}`}>Discount</Label>
                        <Input
                          id={`discount-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.discount}
                          onChange={e =>
                            updateOrderItem(index, 'discount', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Total</Label>
                        <div className="h-10 flex items-center font-medium">
                          {formatCurrency(
                            item.quantity * item.unitPrice - item.discount
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label htmlFor={`notes-${index}`}>Item Notes</Label>
                      <Input
                        id={`notes-${index}`}
                        value={item.notes || ''}
                        onChange={e =>
                          updateOrderItem(index, 'notes', e.target.value)
                        }
                        placeholder="Optional notes for this item"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Total */}
              {formData.items.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(calculateSubtotal())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax (10%):</span>
                        <span>{formatCurrency(calculateSubtotal() * 0.1)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="notes">Customer Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  placeholder="Notes visible to customer"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="internalNotes">Internal Notes</Label>
                <Textarea
                  id="internalNotes"
                  value={formData.internalNotes}
                  onChange={e =>
                    handleInputChange('internalNotes', e.target.value)
                  }
                  placeholder="Internal notes (not visible to customer)"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : mode === 'create' ? (
              'Create Order'
            ) : (
              'Update Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
