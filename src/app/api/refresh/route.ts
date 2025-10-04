import { NextRequest, NextResponse } from 'next/server'
import {
  verifyRefreshToken,
  issueAccessToken,
  issueRefreshToken,
} from '@/lib/jwt-auth'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh-token')?.value
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Missing refresh token' },
        { status: 401 }
      )
    }
    const user = verifyRefreshToken(refreshToken)
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid refresh token' },
        { status: 401 }
      )
    }
    const newAccess = issueAccessToken(user)
    const newRefresh = issueRefreshToken(user)
    const res = NextResponse.json({ accessToken: newAccess })
    res.cookies.set('refresh-token', newRefresh, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })
    return res
  } catch (e) {
    console.error('Refresh error', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
