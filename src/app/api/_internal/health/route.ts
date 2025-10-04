import { apiSuccess } from '@/lib/api-errors'
import { withApiContext } from '@/lib/observability/context'

// Simple liveness endpoint: process is up and middleware stack functioning.
export const GET = withApiContext(async (_req, ctx) => {
  return apiSuccess({
    data: {
      status: 'ok',
      service: 'erp-api',
      time: new Date().toISOString(),
      requestId: ctx.requestId,
    },
    headers: {
      'Cache-Control': 'no-store',
    },
  })
})

export const runtime = 'nodejs'
