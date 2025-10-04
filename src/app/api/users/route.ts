import {
  getUserFromRequest,
  requireAuth,
  BasicAuthRequest,
} from '@/lib/jwt-auth'
import { db } from '@/lib/db'
// (Not importing NextRequest type directly to keep wrapper generic)
import { UserService } from '@/server/services/user-service'
import { UserRepository } from '@/server/repositories/user-repository'
import { withSpan, withApiContext } from '@/lib/observability/context'
import { createLogger, serializeError } from '@/lib/logger'
import { apiError, unauthorized, forbidden, apiSuccess } from '@/lib/api-errors'
import { requirePermission } from '@/lib/authorization/policies'

const userApiLog = createLogger('api.users')

export const GET = withApiContext(async (request: Request, ctx) => {
  try {
    // Create a lightweight view matching expected shape (headers & cookies) for getUserFromRequest.
    const reqForAuth = request as unknown as BasicAuthRequest
    const user = getUserFromRequest(reqForAuth)
    requireAuth(user)

    // Authorization: user:list (ADMIN, MANAGER, SUPERVISOR per policy mapping)
    try {
      requirePermission(user, 'user:list')
    } catch {
      return forbidden()
    }
    const url = new URL(request.url)
    const q = url.searchParams.get('q') || ''
    const pageParam = url.searchParams.get('page')
    const limitParam = url.searchParams.get('limit')

    const service = new UserService({
      userRepository: new UserRepository({ prisma: db }),
    })

    // If pagination params or query provided, return a paginated response
    if (q || pageParam) {
      const page = Math.max(1, parseInt(pageParam || '1'))
      const limit = Math.max(1, Math.min(200, parseInt(limitParam || '25')))

      const result = await withSpan('users.list.paginated', ctx, () =>
        service.list({ q, page, limit })
      )

      return apiSuccess({
        data: result,
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=60',
        },
      })
    }

    const users = await withSpan('users.list.all', ctx, () => service.list({}))

    return apiSuccess({
      data: users,
      headers: {
        'Cache-Control': 'public, max-age=5, stale-while-revalidate=30',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorized()
    }
    userApiLog.error('get_error', {
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
