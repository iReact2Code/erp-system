import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only third-party clients can view orders (for now, returning empty array)
    if (session.user?.role !== 'THIRD_PARTY_CLIENT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // For now, return empty orders since we don't have an orders table
    // In a real implementation, you would query the database for user-specific orders
    const orders: unknown[] = []

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
