import {
  getUserFromRequest,
  requireAuth,
  BasicAuthRequest,
} from '@/lib/jwt-auth'
import { UserRole } from '@/lib/prisma-mock'
import { db } from '@/lib/db'
import { InventoryRepository } from '@/server/repositories/inventory-repository'
import { InventoryService } from '@/server/services/inventory-service'
import { withSpan, withApiContext } from '@/lib/observability/context'
import { createLogger, serializeError } from '@/lib/logger'
import { requirePermission } from '@/lib/authorization/policies'
import { createRateLimiter, buildRateLimitHeaders } from '@/lib/rate-limit'
import {
  buildValidator,
  validationErrorResponse,
  isHttpError,
} from '@/lib/unified-validation'
import { z } from 'zod'
import {
  apiError,
  unauthorized,
  tooManyRequests,
  validationFailed,
  apiSuccess,
} from '@/lib/api-errors'

const invApiLog = createLogger('api.inventory')
// Basic in-memory rate limiter (future: promote to shared/Redis)
const writeLimiter = createRateLimiter({ windowMs: 60_000, max: 30 })

// GET /api/inventory
export const GET = withApiContext(async (request: Request, ctx) => {
  try {
    const user = getUserFromRequest(request as unknown as BasicAuthRequest)
    requireAuth(user)

    const url = new URL(request.url)
    const pageParam = url.searchParams.get('page')
    const limitParam = url.searchParams.get('limit')
    const page = Math.max(1, parseInt(pageParam || '1'))
    const limit = Math.max(1, Math.min(200, parseInt(limitParam || '25')))
    const q = url.searchParams.get('q') || ''

    const service = new InventoryService({
      inventoryRepository: new InventoryRepository({ prisma: db }),
    })

    const result = await withSpan('inventory.list', ctx, async () =>
      service.list({ page, limit, q })
    )

    return apiSuccess({
      data: result,
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorized()
    }
    invApiLog.error('get_error', {
      error: serializeError(error),
      requestId: ctx.requestId,
      traceId: ctx.traceId,
    })
    return apiError({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    })
  }
})

// POST /api/inventory
export const POST = withApiContext(async (request: Request, ctx) => {
  try {
    const user = getUserFromRequest(request as unknown as BasicAuthRequest)
    requireAuth(user)

    const identity =
      user?.id || request.headers.get('x-forwarded-for') || 'anonymous'
    const rl = await writeLimiter.check(`inv:post:${identity}`)
    if (rl.limited) {
      return tooManyRequests(
        Math.max(1, rl.reset - Math.floor(Date.now() / 1000)),
        {
          ...buildRateLimitHeaders(rl),
        }
      )
    }

    try {
      requirePermission(user, 'inventory:create')
    } catch {
      return apiError({
        status: 403,
        code: 'INVENTORY_DIRECT_CREATE_FORBIDDEN',
        message: 'Direct inventory creation is restricted',
      })
    }

    const validate = buildValidator({
      body: z.object({
        name: z.string().min(1),
        sku: z.string().min(1),
        description: z.string().optional(),
        unitPrice: z.union([z.number(), z.string()]).transform(v => Number(v)),
      }),
    })
    let validated: {
      body?: {
        name: string
        sku: string
        description?: string
        unitPrice: number
      }
    }
    try {
      validated = await validate(
        request as unknown as Request & { nextUrl?: URL }
      )
    } catch (err) {
      if (isHttpError(err)) {
        return validationErrorResponse(err)
      }
      throw err
    }
    const { name, sku, description, unitPrice } = validated.body!

    const service = new InventoryService({
      inventoryRepository: new InventoryRepository({ prisma: db }),
    })
    const inventoryItem = await withSpan('inventory.create', ctx, async () =>
      service.create({
        name,
        sku,
        description,
        unitPrice,
        createdById: user!.id,
        updatedById: user!.id,
      })
    )
    return apiSuccess({
      status: 201,
      data: inventoryItem,
      headers: { ...buildRateLimitHeaders(rl) },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorized()
    }
    invApiLog.error('post_error', {
      error: serializeError(error),
      requestId: ctx.requestId,
      traceId: ctx.traceId,
    })
    return apiError({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    })
  }
})

// PUT /api/inventory
export const PUT = withApiContext(async (request: Request, ctx) => {
  try {
    const user = getUserFromRequest(request as unknown as BasicAuthRequest)
    requireAuth(user)

    const identity =
      user?.id || request.headers.get('x-forwarded-for') || 'anonymous'
    const rl = await writeLimiter.check(`inv:put:${identity}`)
    if (rl.limited) {
      return tooManyRequests(
        Math.max(1, rl.reset - Math.floor(Date.now() / 1000)),
        {
          ...buildRateLimitHeaders(rl),
        }
      )
    }

    // Validation
    const validate = buildValidator({
      body: z.object({
        id: z.string().min(1),
        name: z.string().min(1).optional(),
        sku: z.string().min(1).optional(),
        description: z.string().optional(),
        quantity: z.any().optional(),
        unitPrice: z
          .union([z.number(), z.string()])
          .optional()
          .transform(v => (v === undefined ? undefined : Number(v))),
      }),
    })
    let validated: {
      body?: {
        id: string
        name?: string
        sku?: string
        description?: string
        quantity?: unknown
        unitPrice?: number
      }
    }
    try {
      validated = await validate(
        request as unknown as Request & { nextUrl?: URL }
      )
    } catch (err) {
      if (isHttpError(err)) {
        return validationErrorResponse(err)
      }
      throw err
    }
    const { id, name, sku, description, quantity, unitPrice } = validated.body!

    // Authorization: inventory:update (ADMIN, MANAGER)
    try {
      requirePermission(user, 'inventory:update')
    } catch {
      try {
        const { auditSecurityViolation } = await import('@/lib/audit-logger')
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        auditSecurityViolation(
          'DIRECT_INVENTORY_UPDATE_BLOCKED',
          user?.id,
          user?.email,
          user?.role as unknown as UserRole,
          clientIP,
          userAgent,
          {
            endpoint: '/api/inventory',
            method: 'PUT',
            inventoryId: id,
          }
        )
      } catch {
        // ignore audit errors
      }

      return apiError({
        status: 403,
        code: 'INVENTORY_DIRECT_UPDATE_FORBIDDEN',
        message: 'Direct inventory updates are restricted',
      })
    }

    // Prevent direct quantity modifications via this endpoint. Inventory
    // quantities must only change through purchases/sales endpoints which
    // perform transactional updates and stock checks.
    if (typeof quantity !== 'undefined') {
      try {
        const { auditSecurityViolation } = await import('@/lib/audit-logger')
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        auditSecurityViolation(
          'DIRECT_INVENTORY_QUANTITY_CHANGE_BLOCKED',
          user?.id,
          user?.email,
          user?.role as unknown as UserRole,
          clientIP,
          userAgent,
          {
            endpoint: '/api/inventory',
            method: 'PUT',
            inventoryId: id,
          }
        )
      } catch {
        // ignore audit errors
      }

      return apiError({
        status: 403,
        code: 'INVENTORY_QUANTITY_DIRECT_MODIFY_FORBIDDEN',
        message:
          'Direct modification of inventory quantity is restricted. Use purchases/sales endpoints.',
      })
    }

    const service = new InventoryService({
      inventoryRepository: new InventoryRepository({ prisma: db }),
    })
    const inventoryItem = await withSpan('inventory.update', ctx, async () =>
      service.update(id, {
        name,
        sku,
        description,
        unitPrice,
        updatedById: user!.id,
      })
    )

    return apiSuccess({
      data: inventoryItem,
      headers: { ...buildRateLimitHeaders(rl) },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorized()
    }
    invApiLog.error('put_error', {
      error: serializeError(error),
      requestId: ctx.requestId,
      traceId: ctx.traceId,
    })
    return apiError({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    })
  }
})

// DELETE /api/inventory
export const DELETE = withApiContext(async (request: Request, ctx) => {
  try {
    const user = getUserFromRequest(request as unknown as BasicAuthRequest)
    requireAuth(user)

    const identity =
      user?.id || request.headers.get('x-forwarded-for') || 'anonymous'
    const rl = await writeLimiter.check(`inv:delete:${identity}`)
    if (rl.limited) {
      return tooManyRequests(
        Math.max(1, rl.reset - Math.floor(Date.now() / 1000)),
        {
          ...buildRateLimitHeaders(rl),
        }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return validationFailed([{ path: 'id', message: 'ID is required' }])
    }

    // Restrict deletions to ADMIN role only
    // Authorization: inventory:delete (ADMIN only)
    try {
      requirePermission(user, 'inventory:delete')
    } catch {
      try {
        const { auditSecurityViolation } = await import('@/lib/audit-logger')
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'
        auditSecurityViolation(
          'DIRECT_INVENTORY_DELETE_BLOCKED',
          user?.id,
          user?.email,
          user?.role as unknown as UserRole,
          clientIP,
          userAgent,
          {
            endpoint: '/api/inventory',
            method: 'DELETE',
            inventoryId: id,
          }
        )
      } catch {
        // ignore audit errors
      }

      return apiError({
        status: 403,
        code: 'INVENTORY_DIRECT_DELETE_FORBIDDEN',
        message: 'Direct inventory deletion is restricted',
      })
    }

    const service = new InventoryService({
      inventoryRepository: new InventoryRepository({ prisma: db }),
    })
    await withSpan('inventory.delete', ctx, async () => service.delete(id))

    return apiSuccess({
      data: { message: 'Item deleted successfully' },
      headers: { ...buildRateLimitHeaders(rl) },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorized()
    }
    invApiLog.error('delete_error', {
      error: serializeError(error),
      requestId: ctx.requestId,
      traceId: ctx.traceId,
    })
    return apiError({
      status: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    })
  }
})
