import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { db } from '@/lib/db'
import { issueAccessToken, issueRefreshToken } from '@/lib/jwt-auth'
import {
  recordFailure,
  recordSuccess,
  isLocked,
} from '@/lib/brute-force-tracker'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

type MaybeJsonRequest = Request &
  Partial<{ json: () => Promise<unknown>; text: () => Promise<string> }>
async function safeReadJson(req: Request): Promise<unknown> {
  const r = req as MaybeJsonRequest
  try {
    if (typeof r.json === 'function') return await r.json()
  } catch {
    /* fall through */
  }
  try {
    if (typeof r.text === 'function') {
      const txt = await r.text()
      if (!txt) return null
      return JSON.parse(txt)
    }
  } catch {
    /* ignore */
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await safeReadJson(request)
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const { email, password } = parsed.data

    // Brute force lock check (keyed by email; could also incorporate IP for more granularity)
    if (isLocked(email)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })

    if (!user) {
      recordFailure(email)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword)

    if (!isPasswordValid) {
      recordFailure(email)
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Successful authentication resets failure tracker
    recordSuccess(email)

    const safeName = user.name || ''
    let accessToken: string | null = null
    let refreshToken: string | null = null
    try {
      accessToken = issueAccessToken({
        id: user.id,
        email: user.email,
        name: safeName,
        role: user.role,
      })
      refreshToken = issueRefreshToken({
        id: user.id,
        email: user.email,
        name: safeName,
        role: user.role,
      })
    } catch (e) {
      console.error('[LOGIN_TOKEN_ERROR]', e)
      return NextResponse.json(
        { error: 'Token issuance failed' },
        { status: 500 }
      )
    }

    const res = NextResponse.json({
      success: true,
      token: accessToken,
      accessToken, // maintain backward compatibility with tests expecting this property
      user: {
        id: user.id,
        email: user.email,
        name: safeName,
        role: user.role,
      },
    })
    // Minimal debug (optional) removed for cleaner production route.
    // Set refresh token cookie (httpOnly)
    if (refreshToken) {
      res.cookies.set('refresh-token', refreshToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        // 7d in seconds (align with default TTL); rely on backend rotation policy.
        maxAge: 7 * 24 * 60 * 60,
      })
    }
    return res
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
