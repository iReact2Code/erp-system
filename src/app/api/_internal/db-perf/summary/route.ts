import { NextRequest, NextResponse } from 'next/server'
import { getPerfSummary } from '@/lib/prisma-performance'
import { requirePermission } from '@/lib/authorization/policies'
import { getAuthFromRequest } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authResult = await getAuthFromRequest(req)
  const user = authResult?.user || null
  try {
    requirePermission(user, 'diagnostics:read')
  } catch {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }
  const summary = getPerfSummary()
  return NextResponse.json(summary)
}
