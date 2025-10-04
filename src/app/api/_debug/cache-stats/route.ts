import { NextResponse } from 'next/server'
import { getCacheStats } from '@/lib/in-memory-cache'

export async function GET() {
  // This debug endpoint is intentionally gated behind an env flag to avoid
  // exposing internal metrics in production.
  if (process.env.ENABLE_CACHE_DEBUG !== '1') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const stats = getCacheStats()
    return NextResponse.json({ success: true, data: stats })
  } catch (e) {
    console.error('Failed to read cache stats', e)
    return NextResponse.json(
      { success: false, error: 'Failed to read stats' },
      { status: 500 }
    )
  }
}
