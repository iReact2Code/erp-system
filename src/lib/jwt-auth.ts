import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface JWTUser {
  id: string
  email: string
  name: string
  role: string
}

export function verifyJWTToken(token: string): JWTUser | null {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTUser
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export function getUserFromRequest(request: NextRequest): JWTUser | null {
  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifyJWTToken(token)
  }

  // Try to get token from cookies
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
