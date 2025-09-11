import { z } from 'zod'

// Base validation schemas
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(3, 'Email must be at least 3 characters')
  .max(255, 'Email must not exceed 255 characters')

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  )

export const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .regex(
    /^[a-zA-Z\s\-']+$/,
    'Name can only contain letters, spaces, hyphens, and apostrophes'
  )

export const skuSchema = z
  .string()
  .min(1, 'SKU is required')
  .max(50, 'SKU must not exceed 50 characters')
  .regex(
    /^[A-Z0-9\-_]+$/,
    'SKU can only contain uppercase letters, numbers, hyphens, and underscores'
  )

export const priceSchema = z
  .number()
  .min(0, 'Price must be non-negative')
  .max(999999.99, 'Price must not exceed 999,999.99')
  .refine(val => Number.isFinite(val), 'Price must be a valid number')
  .refine(
    val => Number(val.toFixed(2)) === val,
    'Price can have at most 2 decimal places'
  )

export const quantitySchema = z
  .number()
  .int('Quantity must be a whole number')
  .min(0, 'Quantity must be non-negative')
  .max(999999, 'Quantity must not exceed 999,999')

export const idSchema = z
  .string()
  .min(1, 'ID is required')
  .regex(/^[a-zA-Z0-9\-_]+$/, 'ID contains invalid characters')

// Enum schemas
export const userRoleSchema = z.enum([
  'ADMIN',
  'MANAGER',
  'EMPLOYEE',
  'THIRD_PARTY_CLIENT',
] as const)
export const orderStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
])

export const orderPrioritySchema = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])

export const saleStatusSchema = z.enum([
  'PENDING',
  'COMPLETED',
  'CANCELLED',
] as const)
export const purchaseStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'COMPLETED',
] as const)
export const inventoryStatusSchema = z.enum([
  'IN_STOCK',
  'LOW_STOCK',
  'OUT_OF_STOCK',
] as const)

// User schemas
export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema.default('EMPLOYEE'),
})

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  role: userRoleSchema.optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = createUserSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// Inventory schemas
export const createInventorySchema = z.object({
  name: nameSchema,
  sku: skuSchema,
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  quantity: quantitySchema,
  unitPrice: priceSchema,
  status: inventoryStatusSchema.optional(),
})

export const updateInventorySchema = createInventorySchema.partial().extend({
  id: idSchema,
})

// Sale schemas
export const saleItemSchema = z.object({
  inventoryId: idSchema,
  quantity: quantitySchema.min(1, 'Quantity must be at least 1'),
  unitPrice: priceSchema,
})

export const createSaleSchema = z.object({
  userId: idSchema,
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  saleDate: z.string().datetime('Invalid date format').optional(),
})

export const updateSaleSchema = z.object({
  id: idSchema,
  status: saleStatusSchema.optional(),
  items: z.array(saleItemSchema).optional(),
})

// Purchase schemas
export const purchaseItemSchema = z.object({
  inventoryId: idSchema,
  quantity: quantitySchema.min(1, 'Quantity must be at least 1'),
  unitPrice: priceSchema,
})

export const createPurchaseSchema = z.object({
  userId: idSchema,
  items: z.array(purchaseItemSchema).min(1, 'At least one item is required'),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
})

export const updatePurchaseSchema = z.object({
  id: idSchema,
  status: purchaseStatusSchema.optional(),
  items: z.array(purchaseItemSchema).optional(),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
})

// API request schemas
export const paginationSchema = z.object({
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must not exceed 100')
    .default(10),
})

export const searchSchema = z.object({
  q: z
    .string()
    .max(100, 'Search query must not exceed 100 characters')
    .optional(),
  sortBy: z
    .string()
    .max(50, 'Sort field must not exceed 50 characters')
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const filterSchema = z.object({
  status: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  userId: idSchema.optional(),
})

// Combined query schemas
export const inventoryQuerySchema = paginationSchema.merge(searchSchema).merge(
  z.object({
    status: inventoryStatusSchema.optional(),
    lowStock: z.boolean().optional(),
  })
)

export const salesQuerySchema = paginationSchema.merge(searchSchema).merge(
  z.object({
    status: saleStatusSchema.optional(),
    userId: idSchema.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  })
)

export const purchasesQuerySchema = paginationSchema.merge(searchSchema).merge(
  z.object({
    status: purchaseStatusSchema.optional(),
    userId: idSchema.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  })
)

export const usersQuerySchema = paginationSchema.merge(searchSchema).merge(
  z.object({
    role: userRoleSchema.optional(),
  })
)

// Password change schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })

// Password reset schemas
export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

// API response validation
export const apiResponseSchema = z.object({
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

export const paginatedResponseSchema = apiResponseSchema.extend({
  pagination: z
    .object({
      page: z.number().int(),
      limit: z.number().int(),
      total: z.number().int(),
      totalPages: z.number().int(),
    })
    .optional(),
})

// Order validation schemas
export const orderItemSchema = z.object({
  inventoryItemId: idSchema,
  quantity: quantitySchema,
  unitPrice: priceSchema,
  discount: z.number().min(0, 'Discount cannot be negative').default(0),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
})

export const createOrderSchema = z.object({
  customerName: nameSchema,
  customerEmail: emailSchema,
  customerPhone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),
  customerAddress: z
    .string()
    .max(500, 'Address must not exceed 500 characters')
    .optional(),
  priority: orderPrioritySchema.default('NORMAL'),
  requiredDate: z.string().datetime('Invalid date format').optional(),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
  internalNotes: z
    .string()
    .max(1000, 'Internal notes must not exceed 1000 characters')
    .optional(),
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Cannot add more than 50 items per order'),
})

export const updateOrderSchema = z.object({
  id: idSchema,
  customerName: nameSchema.optional(),
  customerEmail: emailSchema.optional(),
  customerPhone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format')
    .optional(),
  customerAddress: z
    .string()
    .max(500, 'Address must not exceed 500 characters')
    .optional(),
  status: orderStatusSchema.optional(),
  priority: orderPrioritySchema.optional(),
  requiredDate: z.string().datetime('Invalid date format').optional(),
  shippedDate: z.string().datetime('Invalid date format').optional(),
  deliveredDate: z.string().datetime('Invalid date format').optional(),
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional(),
  internalNotes: z
    .string()
    .max(1000, 'Internal notes must not exceed 1000 characters')
    .optional(),
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required')
    .max(50, 'Cannot add more than 50 items per order')
    .optional(),
})

export const ordersQuerySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  limit: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default(10),
  search: z.string().max(200).optional(),
  status: orderStatusSchema.optional(),
  priority: orderPrioritySchema.optional(),
  dateFrom: z.string().datetime('Invalid date format').optional(),
  dateTo: z.string().datetime('Invalid date format').optional(),
  sortBy: z
    .enum(['orderDate', 'customerName', 'totalAmount', 'status', 'priority'])
    .default('orderDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Export types for TypeScript
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateInventoryInput = z.infer<typeof createInventorySchema>
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>
export type CreateSaleInput = z.infer<typeof createSaleSchema>
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>
export type SalesQueryInput = z.infer<typeof salesQuerySchema>
export type PurchasesQueryInput = z.infer<typeof purchasesQuerySchema>
export type UsersQueryInput = z.infer<typeof usersQuerySchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type OrderItemInput = z.infer<typeof orderItemSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>
export type OrdersQueryInput = z.infer<typeof ordersQuerySchema>
