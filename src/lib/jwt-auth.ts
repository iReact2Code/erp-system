import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface JWTUser {
  id: string
  email: string
  name: string
  role: string
}

interface JWTPayload {
  id: string
  email: string
  name: string
  role: string
  iat: number
  exp: number
}

export function verifyJWTToken(token: string): JWTUser | null {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET is not configured')
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET) as JWTPayload
    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    }
  } catch {
    return null
  }
}

export function getUserFromRequest(request: NextRequest): JWTUser | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifyJWTToken(token)
  }

  // Try cookie as fallback
  const cookieToken = request.cookies.get('auth-token')?.value

  if (cookieToken) {
    return verifyJWTToken(cookieToken)
  }

  return null
}

export function requireAuth(user: JWTUser | null) {
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
