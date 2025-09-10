// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Status Types
export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'THIRD_PARTY_CLIENT'

export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

export type PurchaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED'

export type InventoryStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'

// Entity Types
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface InventoryItem {
  id: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  description?: string
  status: InventoryStatus
  createdAt: string
  updatedAt: string
}

export interface SaleItem {
  id: string
  saleId: string
  inventoryItemId: string
  inventoryItem?: InventoryItem
  quantity: number
  unitPrice: number
  total: number
}

export interface Sale {
  id: string
  saleDate: string
  total: number
  status: SaleStatus
  userId: string
  user?: User
  items: SaleItem[]
  createdAt: string
  updatedAt: string
}

export interface PurchaseItem {
  id: string
  purchaseId: string
  inventoryItemId: string
  inventoryItem?: InventoryItem
  quantity: number
  unitPrice: number
  total: number
}

export interface Purchase {
  id: string
  total: number
  status: PurchaseStatus
  userId: string
  user?: User
  items: PurchaseItem[]
  createdAt: string
  updatedAt: string
}

// Form Types
export interface CreateSaleRequest {
  items: {
    inventoryItemId: string
    quantity: number
    unitPrice: number
  }[]
  status: SaleStatus
}

export interface CreatePurchaseRequest {
  items: {
    inventoryItemId: string
    quantity: number
    unitPrice: number
  }[]
}

export interface UpdateInventoryRequest {
  name?: string
  sku?: string
  quantity?: number
  unitPrice?: number
  description?: string
}

export interface CreateInventoryRequest {
  name: string
  sku: string
  quantity: number
  unitPrice: number
  description?: string
}

export interface UpdateInventoryRequest {
  name?: string
  sku?: string
  quantity?: number
  unitPrice?: number
  description?: string
}

// Report Types
export interface ReportMetrics {
  totalInventoryItems: number
  totalSales: number
  totalPurchases: number
  totalRevenue: number
  lowStockItems: number
}

export interface RecentTransaction {
  type: 'sale' | 'purchase'
  amount: number
  date: string
  description: string
}

// Request Types
export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: UserRole
}

export interface ReportData extends ReportMetrics {
  recentTransactions: RecentTransaction[]
}

// Error Types
export interface ValidationError {
  field: string
  message: string
}

export interface ApiError {
  message: string
  statusCode: number
  errors?: ValidationError[]
}
