import { apiSuccess, apiError } from '@/lib/api-errors'
import { withApiContext } from '@/lib/observability/context'
import { db } from '@/lib/db'
import { createLogger } from '@/lib/logger'

const readyLog = createLogger('ready')

/**
 * Readiness endpoint: verifies core dependencies.
 * - Database (Prisma) basic query
 * - (Future) Redis or other external services
 */
export const GET = withApiContext(async (_req, ctx) => {
  const start = Date.now()
  const checks: Record<
    string,
    { ok: boolean; latencyMs?: number; error?: string }
  > = {}
  let allOk = true

  // Database check
  try {
    const dbStart = Date.now()
    // Lightweight DB query; uses Prisma's built-in metadata query (SELECT 1 via $queryRaw or a trivial findUnique with impossible where)
    await db.$queryRaw`SELECT 1` // dialect-neutral for most supported DBs
    checks.database = { ok: true, latencyMs: Date.now() - dbStart }
  } catch (err: unknown) {
    allOk = false
    checks.database = {
      ok: false,
      error: err instanceof Error ? err.message : 'db_error',
    }
    readyLog.error('db_check_failed', {
      error: err instanceof Error ? err.message : String(err),
    })
  }

  // Placeholder for Redis (not yet implemented)
  if (process.env.READINESS_REDIS_REQUIRED === '1') {
    checks.redis = { ok: false, error: 'not_implemented' }
    allOk = false
  }

  const totalLatency = Date.now() - start

  if (!allOk) {
    return apiError({
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'Not all dependencies are ready',
      details: { checks, totalLatency },
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  return apiSuccess({
    data: {
      status: 'ready',
      service: 'erp-api',
      checks,
      totalLatency,
      requestId: ctx.requestId,
    },
    headers: { 'Cache-Control': 'no-store' },
  })
})

export const runtime = 'nodejs'
