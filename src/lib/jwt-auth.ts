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
    console.log(
      '🔍 Verifying JWT token:',
      token ? `${token.substring(0, 30)}...` : 'null'
    )
    console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as JWTUser
    console.log('✅ Token verification successful:', decoded.email)
    return decoded
  } catch (error) {
    console.error('❌ JWT verification failed:', error)
    return null
  }
}

export function getUserFromRequest(request: NextRequest): JWTUser | null {
  console.log('🔍 Debug - Getting user from request:')

  // Try to get token from Authorization header
  const authHeader = request.headers.get('authorization')
  console.log('Authorization header:', authHeader)

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    console.log(
      'Token from header:',
      token ? `${token.substring(0, 30)}...` : 'null'
    )
    const user = verifyJWTToken(token)
    console.log(
      'User from token verification:',
      user ? 'Valid user' : 'Invalid token'
    )
    return user
  }

  // Try to get token from cookies
  const cookieToken = request.cookies.get('auth-token')?.value
  console.log(
    'Cookie token:',
    cookieToken ? `${cookieToken.substring(0, 30)}...` : 'null'
  )

  if (cookieToken) {
    const user = verifyJWTToken(cookieToken)
    console.log(
      'User from cookie verification:',
      user ? 'Valid user' : 'Invalid token'
    )
    return user
  }

  console.log('No authentication found')
  return null
}

export function requireAuth(user: JWTUser | null) {
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
