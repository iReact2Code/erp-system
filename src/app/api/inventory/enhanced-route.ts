import { NextRequest } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  withRequestValidation,
  createSecureResponse,
  createErrorResponse,
} from '@/lib/request-validation'
import { withSecurity, logSecurityEvent } from '@/lib/security-headers'
import { auditAPIAccess } from '@/lib/audit-logger'
import { paginationSchema } from '@/lib/enhanced-validation'
import { createInventorySchema } from '@/types/validation'

/**
 * Enhanced inventory GET endpoint with security and validation
 */
async function getInventoryHandler(
  req: NextRequest,
  validatedData: z.infer<typeof paginationSchema>
) {
  const session = await auth()
  const startTime = Date.now()
  const clientIP =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    'unknown'

  if (!session?.user) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', req, {
      endpoint: '/api/inventory',
    })
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  try {
    const { page, limit, sortBy, sortOrder, search } = validatedData

    // Calculate pagination
    const skip = (page - 1) * limit

    // Build where clause for search
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { sku: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    // Build orderBy clause
    const orderBy = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' as const }

    // Fetch inventory items with pagination
    const [inventoryItems, totalCount] = await Promise.all([
      db.inventoryItem.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          sku: true,
          description: true,
          quantity: true,
          unitPrice: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.inventoryItem.count({ where }),
    ])

    // Log successful access
    await auditAPIAccess(
      '/api/inventory/enhanced',
      'GET',
      session.user.id!,
      session.user.email!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      session.user.role as any,
      clientIP,
      req.headers.get('user-agent') || 'Unknown',
      true,
      200,
      Date.now() - startTime
    )

    const response = {
      data: inventoryItems,
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
    console.error('Error fetching inventory:', error)

    // Log error for monitoring
    logSecurityEvent('INTERNAL_ERROR', req, {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/inventory',
      userId: session.user.id,
    })

    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}

/**
 * Enhanced inventory POST endpoint with security and validation
 */
async function createInventoryHandler(
  req: NextRequest,
  validatedData: z.infer<typeof createInventorySchema>
) {
  const session = await auth()

  if (!session?.user) {
    logSecurityEvent('UNAUTHORIZED_ACCESS_ATTEMPT', req, {
      endpoint: '/api/inventory',
      method: 'POST',
    })
    return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401)
  }

  // Check user permissions (only admin and manager can create inventory)
  if (!['ADMIN', 'MANAGER'].includes(session.user.role || '')) {
    logSecurityEvent('INSUFFICIENT_PERMISSIONS', req, {
      userId: session.user.id,
      role: session.user.role,
      endpoint: '/api/inventory',
      method: 'POST',
    })
    return createErrorResponse('Insufficient permissions', 'FORBIDDEN', 403)
  }

  try {
    // Check for duplicate SKU
    const existingItem = await db.inventoryItem.findUnique({
      where: { sku: validatedData.sku },
    })

    if (existingItem) {
      return createErrorResponse('SKU already exists', 'DUPLICATE_SKU', 400)
    }

    // Create inventory item
    const inventoryItem = await db.inventoryItem.create({
      data: {
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        sku: true,
        description: true,
        quantity: true,
        unitPrice: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Log successful creation
    console.log('Inventory item created successfully')

    return createSecureResponse({ data: inventoryItem }, 201)
  } catch (error) {
    console.error('Error creating inventory item:', error)

    logSecurityEvent('INTERNAL_ERROR', req, {
      error: error instanceof Error ? error.message : 'Unknown error',
      endpoint: '/api/inventory',
      method: 'POST',
      userId: session.user.id,
    })

    return createErrorResponse('Internal server error', 'INTERNAL_ERROR', 500)
  }
}

// Apply security middleware and validation
export const GET = withSecurity(
  withRequestValidation(paginationSchema, {
    allowedMethods: ['GET'],
    rateLimit: { requests: 100, windowMs: 60000 }, // 100 requests per minute
    checkContentType: false,
  })(getInventoryHandler)
)

export const POST = withSecurity(
  withRequestValidation(createInventorySchema, {
    allowedMethods: ['POST'],
    rateLimit: { requests: 10, windowMs: 60000 }, // 10 creates per minute
    checkContentType: true,
  })(createInventoryHandler)
)
