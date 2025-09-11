import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getUserFromRequest } from '@/lib/jwt-auth'
import { db } from '@/lib/db'
import {
  withRequestValidation,
  createSecureResponse,
  createErrorResponse,
} from '@/lib/request-validation'
import { withSecurity, logSecurityEvent } from '@/lib/security-headers'
import { createOrderSchema, ordersQuerySchema } from '@/types/validation'

/**
 * Enhanced orders GET endpoint with filtering and pagination
 */
async function getOrdersHandler(
  req: NextRequest,
  validatedData: z.infer<typeof ordersQuerySchema>
) {
  const user = getUserFromRequest(req)

  if (!user) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', req, {
      endpoint: '/api/orders',
    })
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  try {
    const {
      page,
      limit,
      search,
      status,
      priority,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
    } = validatedData

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build where clause
    const where = {} as Record<string, unknown>

    // Search across customer fields and order number
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by status
    if (status) {
      where.status = status
    }

    // Filter by priority
    if (priority) {
      where.priority = priority
    }

    // Date range filtering
    if (dateFrom || dateTo) {
      const orderDateFilter: Record<string, Date> = {}
      if (dateFrom) orderDateFilter.gte = new Date(dateFrom)
      if (dateTo) orderDateFilter.lte = new Date(dateTo)
      where.orderDate = orderDateFilter
    }

    // Role-based filtering
    if (user.role === 'THIRD_PARTY_CLIENT') {
      // Third-party clients can only see their own orders
      where.customerEmail = user.email
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {}
    if (sortBy === 'orderDate') orderBy.orderDate = sortOrder
    else if (sortBy === 'customerName') orderBy.customerName = sortOrder
    else if (sortBy === 'totalAmount') orderBy.totalAmount = sortOrder
    else if (sortBy === 'status') orderBy.status = sortOrder
    else if (sortBy === 'priority') orderBy.priority = sortOrder
    else orderBy.orderDate = 'desc' // default    // Fetch orders with pagination and related data
    const [orders, totalCount] = await Promise.all([
      db.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      db.order.count({ where }),
    ])

    const response = {
      data: orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0',
      },
    }

    return createSecureResponse(response)
  } catch (error) {
    console.error('Error fetching orders:', error)

    logSecurityEvent('ORDER_LIST_ERROR', req, {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}

/**
 * Enhanced orders POST endpoint for creating new orders
 */
async function createOrderHandler(
  req: NextRequest,
  validatedData: z.infer<typeof createOrderSchema>
) {
  const user = getUserFromRequest(req)

  if (!user) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', req, {
      endpoint: '/api/orders',
      method: 'POST',
    })
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  // Check user permissions (all authenticated users can create orders)
  try {
    // Generate unique order number
    const now = new Date()
    const orderNumber = `ORD-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

    // Validate inventory items and calculate totals
    let subtotal = 0
    const orderItems: Array<{
      inventoryItemId: string
      quantity: number
      unitPrice: number
      discount: number
      total: number
    }> = []

    for (const item of validatedData.items) {
      // Check if inventory item exists and has sufficient quantity
      const inventoryItem = await db.inventoryItem.findUnique({
        where: { id: item.inventoryItemId },
      })

      if (!inventoryItem) {
        return createErrorResponse(
          `Inventory item ${item.inventoryItemId} not found`,
          'ITEM_NOT_FOUND',
          400
        )
      }

      if (inventoryItem.quantity < item.quantity) {
        return createErrorResponse(
          `Insufficient quantity for item ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`,
          'INSUFFICIENT_QUANTITY',
          400
        )
      }

      const itemTotal = item.quantity * item.unitPrice - item.discount
      subtotal += itemTotal

      orderItems.push({
        ...item,
        total: itemTotal,
      })
    }

    // Calculate taxes and total (simplified tax calculation)
    const taxRate = 0.1 // 10% tax
    const taxAmount = subtotal * taxRate
    const totalAmount = subtotal + taxAmount

    // Create order with items in a transaction
    const order = (await db.$transaction(async tx => {
      // Create the order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerName: validatedData.customerName,
          customerEmail: validatedData.customerEmail,
          customerPhone: validatedData.customerPhone,
          customerAddress: validatedData.customerAddress,
          priority: validatedData.priority || 'NORMAL',
          requiredDate: validatedData.requiredDate
            ? new Date(validatedData.requiredDate)
            : null,
          notes: validatedData.notes,
          internalNotes: validatedData.internalNotes,
          subtotal,
          taxAmount,
          totalAmount,
          userId: user.id,
        },
        include: {
          items: {
            include: {
              inventoryItem: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      })

      // Create order items
      await tx.orderItem.createMany({
        data: orderItems.map(item => ({
          ...item,
          orderId: newOrder.id,
        })),
      })

      // Update inventory quantities (reserve items)
      for (const item of validatedData.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        })
      }

      return newOrder
    })) as any // Type assertion for mock compatibility

    logSecurityEvent('ORDER_CREATED', req, {
      userId: user.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount,
    })

    return createSecureResponse({ data: order }, 201)
  } catch (error) {
    console.error('Error creating order:', error)

    logSecurityEvent('ORDER_CREATE_ERROR', req, {
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}

// Apply security middleware and validation
export const GET = withSecurity(
  withRequestValidation(ordersQuerySchema, {
    allowedMethods: ['GET'],
    rateLimit: { requests: 100, windowMs: 60000 }, // 100 requests per minute
    checkContentType: false,
  })(getOrdersHandler)
)

export const POST = withSecurity(
  withRequestValidation(createOrderSchema, {
    allowedMethods: ['POST'],
    rateLimit: { requests: 5, windowMs: 60000 }, // 5 creates per minute
    checkContentType: true,
  })(createOrderHandler)
)
