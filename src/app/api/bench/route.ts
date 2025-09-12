import { NextRequest, NextResponse } from 'next/server'

// Lightweight bench endpoint: returns a small payload after a short delay.
export async function GET(request: NextRequest) {
  // Simulate some work (10ms)
  await new Promise(r => setTimeout(r, 10))
  return NextResponse.json({ data: 'ok' })
}
