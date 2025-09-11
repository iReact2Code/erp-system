// Shared types for order management
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
export type OrderPriority = 'HIGH' | 'NORMAL' | 'LOW'

export interface InventoryItem {
  id: string
  name: string
  sku: string
  description: string | null
  price: number
  quantity: number
}

export interface OrderItem {
  id: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  notes: string | null
  inventoryItem: {
    id: string
    name: string
    sku: string
    description: string | null
  }
}

export interface OrderWithDetails {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  customerAddress: string | null
  status: OrderStatus
  priority: OrderPriority
  orderDate: Date
  requiredDate: Date | null
  notes: string | null
  internalNotes: string | null
  subtotal: number
  taxAmount: number
  totalAmount: number
  createdAt: Date
  updatedAt: Date
  userId: string
  items: OrderItem[]
  user: {
    id: string
    name: string | null
    email: string | null
  }
}

export interface OrderFormData {
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  priority: OrderPriority
  status?: OrderStatus
  requiredDate: string
  notes: string
  internalNotes: string
  items: Array<{
    inventoryItemId: string
    quantity: number
    unitPrice: number
    discount: number
    notes?: string
    inventoryItem?: {
      id: string
      name: string
      sku: string
      description: string | null
      price: number
      quantity: number
    }
  }>
}

export interface OrderFilters {
  search: string
  status: OrderStatus | ''
  priority: OrderPriority | ''
  dateFrom: string
  dateTo: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}
