import { collectMetrics } from '@/lib/metrics'
import { apiSuccess } from '@/lib/api-errors'
import { withApiContext } from '@/lib/observability/context'

export const GET = withApiContext(async _req => {
  const snapshot = collectMetrics()
  return apiSuccess({
    data: snapshot,
    headers: { 'Cache-Control': 'no-store' },
  })
})

export const runtime = 'nodejs'
