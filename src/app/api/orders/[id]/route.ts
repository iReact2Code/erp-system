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
import { updateOrderSchema } from '@/types/validation'

const orderIdSchema = z.object({
  id: z.string().min(1, 'Order ID is required'),
})

/**
 * Enhanced order GET endpoint for retrieving a single order
 */
async function getOrderHandler(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const user = getUserFromRequest(req)

  if (!user) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', req, {
      endpoint: `/api/orders/${context.params.id}`,
    })
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  try {
    const { id } = context.params

    // Validate order ID format
    const validatedId = orderIdSchema.parse({ id })

    // Build where clause with role-based filtering
    const where: Record<string, unknown> = { id: validatedId.id }

    if (user.role === 'THIRD_PARTY_CLIENT') {
      // Third-party clients can only see their own orders
      where.customerEmail = user.email
    }

    const order = await db.order.findFirst({
      where,
      include: {
        items: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
                description: true,
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
    })

    if (!order) {
      logSecurityEvent('ORDER_NOT_FOUND', req, {
        userId: user.id,
        orderId: id,
      })
      return createErrorResponse('Order not found', 'NOT_FOUND', 404)
    }

    return createSecureResponse({ data: order })
  } catch (error) {
    console.error('Error fetching order:', error)

    logSecurityEvent('ORDER_GET_ERROR', req, {
      userId: user.id,
      orderId: context.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid order ID', 'VALIDATION_ERROR', 400)
    }

    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}

/**
 * Enhanced order PUT endpoint for updating orders
 */
async function updateOrderHandler(
  req: NextRequest,
  validatedData: z.infer<typeof updateOrderSchema>,
  context: { params: { id: string } }
) {
  const user = getUserFromRequest(req)

  if (!user) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', req, {
      endpoint: `/api/orders/${context.params.id}`,
      method: 'PUT',
    })
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  // Check user permissions
  if (user.role === 'THIRD_PARTY_CLIENT') {
    return createErrorResponse('Insufficient permissions', 'FORBIDDEN', 403)
  }

  try {
    const { id } = context.params

    // Validate order ID format
    const validatedId = orderIdSchema.parse({ id })

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: validatedId.id },
      include: {
        items: true,
      },
    })

    if (!existingOrder) {
      return createErrorResponse('Order not found', 'NOT_FOUND', 404)
    }

    // Check if order can be modified (business logic)
    if (
      existingOrder.status === 'DELIVERED' ||
      existingOrder.status === 'CANCELLED'
    ) {
      return createErrorResponse(
        'Cannot modify order with status: ' + existingOrder.status,
        'INVALID_STATUS',
        400
      )
    }

    // Update order in a transaction
    const updatedOrder = await db.$transaction(async tx => {
      // If items are being updated, handle inventory changes
      if (validatedData.items) {
        // Restore original inventory quantities
        for (const originalItem of existingOrder.items) {
          await tx.inventoryItem.update({
            where: { id: originalItem.inventoryItemId },
            data: {
              quantity: {
                increment: originalItem.quantity,
              },
            },
          })
        }

        // Delete existing order items
        await tx.orderItem.deleteMany({
          where: { orderId: existingOrder.id },
        })

        // Validate new inventory items and calculate totals
        let subtotal = 0
        const newOrderItems: Array<{
          inventoryItemId: string
          quantity: number
          unitPrice: number
          discount: number
          total: number
        }> = []

        for (const item of validatedData.items) {
          const inventoryItem = await tx.inventoryItem.findUnique({
            where: { id: item.inventoryItemId },
          })

          if (!inventoryItem) {
            throw new Error(`Inventory item ${item.inventoryItemId} not found`)
          }

          if (inventoryItem.quantity < item.quantity) {
            throw new Error(
              `Insufficient quantity for item ${inventoryItem.name}. Available: ${inventoryItem.quantity}, Requested: ${item.quantity}`
            )
          }

          const itemTotal = item.quantity * item.unitPrice - item.discount
          subtotal += itemTotal

          newOrderItems.push({
            ...item,
            total: itemTotal,
          })
        }

        // Calculate new totals
        const taxRate = 0.1 // 10% tax
        const taxAmount = subtotal * taxRate
        const totalAmount = subtotal + taxAmount

        // Create new order items
        await tx.orderItem.createMany({
          data: newOrderItems.map(item => ({
            ...item,
            orderId: existingOrder.id,
          })),
        })

        // Reserve new inventory quantities
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

        // Update order with new totals
        return await tx.order.update({
          where: { id: existingOrder.id },
          data: {
            customerName: validatedData.customerName,
            customerEmail: validatedData.customerEmail,
            customerPhone: validatedData.customerPhone,
            customerAddress: validatedData.customerAddress,
            priority: validatedData.priority,
            status: validatedData.status,
            requiredDate: validatedData.requiredDate
              ? new Date(validatedData.requiredDate)
              : undefined,
            notes: validatedData.notes,
            internalNotes: validatedData.internalNotes,
            subtotal,
            taxAmount,
            totalAmount,
            updatedAt: new Date(),
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
      } else {
        // Update order without changing items
        return await tx.order.update({
          where: { id: existingOrder.id },
          data: {
            customerName: validatedData.customerName,
            customerEmail: validatedData.customerEmail,
            customerPhone: validatedData.customerPhone,
            customerAddress: validatedData.customerAddress,
            priority: validatedData.priority,
            status: validatedData.status,
            requiredDate: validatedData.requiredDate
              ? new Date(validatedData.requiredDate)
              : undefined,
            notes: validatedData.notes,
            internalNotes: validatedData.internalNotes,
            updatedAt: new Date(),
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
      }
    })

    logSecurityEvent('ORDER_UPDATED', req, {
      userId: user.id,
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      changes: Object.keys(validatedData),
    })

    return createSecureResponse({ data: updatedOrder })
  } catch (error) {
    console.error('Error updating order:', error)

    logSecurityEvent('ORDER_UPDATE_ERROR', req, {
      userId: user.id,
      orderId: context.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid order ID', 'VALIDATION_ERROR', 400)
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse(error.message, 'ITEM_NOT_FOUND', 400)
    }

    if (
      error instanceof Error &&
      error.message.includes('Insufficient quantity')
    ) {
      return createErrorResponse(error.message, 'INSUFFICIENT_QUANTITY', 400)
    }

    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}

/**
 * Enhanced order DELETE endpoint for cancelling orders
 */
async function deleteOrderHandler(
  req: NextRequest,
  context: { params: { id: string } }
) {
  const user = getUserFromRequest(req)

  if (!user) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', req, {
      endpoint: `/api/orders/${context.params.id}`,
      method: 'DELETE',
    })
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  // Check user permissions
  if (user.role === 'THIRD_PARTY_CLIENT') {
    return createErrorResponse('Insufficient permissions', 'FORBIDDEN', 403)
  }

  try {
    const { id } = context.params

    // Validate order ID format
    const validatedId = orderIdSchema.parse({ id })

    // Check if order exists
    const existingOrder = await db.order.findUnique({
      where: { id: validatedId.id },
      include: {
        items: true,
      },
    })

    if (!existingOrder) {
      return createErrorResponse('Order not found', 'NOT_FOUND', 404)
    }

    // Check if order can be cancelled
    if (existingOrder.status === 'DELIVERED') {
      return createErrorResponse(
        'Cannot cancel delivered order',
        'INVALID_STATUS',
        400
      )
    }

    if (existingOrder.status === 'CANCELLED') {
      return createErrorResponse(
        'Order is already cancelled',
        'ALREADY_CANCELLED',
        400
      )
    }

    // Cancel order and restore inventory in a transaction
    const cancelledOrder = await db.$transaction(async tx => {
      // Restore inventory quantities
      for (const item of existingOrder.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        })
      }

      // Update order status to cancelled
      return await tx.order.update({
        where: { id: existingOrder.id },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
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
    })

    logSecurityEvent('ORDER_CANCELLED', req, {
      userId: user.id,
      orderId: cancelledOrder.id,
      orderNumber: cancelledOrder.orderNumber,
    })

    return createSecureResponse({ data: cancelledOrder })
  } catch (error) {
    console.error('Error cancelling order:', error)

    logSecurityEvent('ORDER_CANCEL_ERROR', req, {
      userId: user.id,
      orderId: context.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    if (error instanceof z.ZodError) {
      return createErrorResponse('Invalid order ID', 'VALIDATION_ERROR', 400)
    }

    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}

// Apply security middleware and validation
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const secureHandler = withSecurity((request: NextRequest) =>
    getOrderHandler(request, { params })
  )
  return secureHandler(req)
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const validationHandler = withRequestValidation(updateOrderSchema, {
    allowedMethods: ['PUT'],
    rateLimit: { requests: 10, windowMs: 60000 }, // 10 updates per minute
    checkContentType: true,
  })((request: NextRequest, validatedData: z.infer<typeof updateOrderSchema>) =>
    updateOrderHandler(request, validatedData, { params })
  )

  const secureHandler = withSecurity(validationHandler)
  return secureHandler(req)
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const secureHandler = withSecurity((request: NextRequest) =>
    deleteOrderHandler(request, { params })
  )
  return secureHandler(req)
}
