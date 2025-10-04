import { NextRequest, NextResponse } from 'next/server'
import { getSlowQuerySamples } from '@/lib/prisma-performance'
import { requirePermission } from '@/lib/authorization/policies'
import { createLogger } from '@/lib/logger'
import { getAuthFromRequest } from '@/lib/auth'

const log = createLogger('api.db-perf')

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authResult = await getAuthFromRequest(req)
  const user = authResult?.user || null
  try {
    requirePermission(user, 'diagnostics:read')
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const samples = getSlowQuerySamples()
  log.debug('samples_requested', { count: samples.length, userId: user?.id })
  // Optional lightweight filtering (limit parameter)
  const url = new URL(req.url)
  const limitParam = url.searchParams.get('limit')
  let limit = Number(limitParam || '0')
  if (!Number.isFinite(limit) || limit <= 0) limit = samples.length
  const limited = samples.slice(-limit)
  return NextResponse.json({ samples: limited, total: samples.length })
}
