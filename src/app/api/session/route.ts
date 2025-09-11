import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  console.log('Session API - All cookies:', req.cookies.getAll())

  const sessionCookie = req.cookies.get('user-session')
  console.log('Session API - user-session cookie:', sessionCookie)

  if (!sessionCookie) {
    return NextResponse.json({
      authenticated: false,
      message: 'No session cookie found',
    })
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    return NextResponse.json({
      authenticated: true,
      user: session,
      cookieValue: sessionCookie.value,
    })
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      message: 'Invalid session cookie',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
