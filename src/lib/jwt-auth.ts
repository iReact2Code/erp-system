import jwt, { SignOptions } from 'jsonwebtoken'

// Token lifetimes (can be overridden via env for flexibility in tests / deployments)
const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m'
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d'

export interface JWTUser {
  id: string
  email: string
  name: string
  role: string
}

interface BaseJWTPayload {
  id: string
  email: string
  name: string
  role: string
  tokenType: 'access' | 'refresh'
  iat: number
  exp: number
}

type AccessPayload = BaseJWTPayload & { tokenType: 'access' }
type RefreshPayload = BaseJWTPayload & { tokenType: 'refresh' }

/**
 * Returns the current (primary) JWT secret used for signing new tokens.
 * Throws if not configured – this is a hard requirement to start the app.
 */
function requireSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured')
  }
  return secret
}

/**
 * Attempt to verify a token with the primary secret, then (if configured) a previous/rotated
 * secret provided via NEXTAUTH_SECRET_PREVIOUS. This enables zero-downtime secret rotation:
 * 1. Deploy with NEXTAUTH_SECRET=new && NEXTAUTH_SECRET_PREVIOUS=old (accept both, sign with new)
 * 2. Wait for max token lifetime window (access + refresh) to elapse
 * 3. Remove NEXTAUTH_SECRET_PREVIOUS (old tokens naturally expire)
 */
function verifyWithRotation<T>(token: string): T | null {
  const primary = requireSecret()
  const previous = process.env.NEXTAUTH_SECRET_PREVIOUS
  try {
    return jwt.verify(token, primary) as T
  } catch (primaryErr) {
    if (previous && previous !== primary) {
      try {
        const decoded = jwt.verify(token, previous) as T
        if (process.env.NODE_ENV === 'test') {
          try {
            // Helpful for asserting fallback path usage during tests.

            console.log('[JWT_ROTATION_DEBUG] verified with previous secret')
          } catch {}
        }
        return decoded
      } catch {
        return null
      }
    }
    return null
  }
}

function signToken(
  user: JWTUser,
  tokenType: 'access' | 'refresh',
  expiresIn: string
): string {
  const payload: Record<string, unknown> = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tokenType,
  }
  const opts: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] }
  const token = jwt.sign(payload, requireSecret(), opts)
  if (process.env.NODE_ENV === 'test') {
    try {
      console.log('[SIGN_TOKEN_DEBUG]', {
        tokenType,
        hasToken: !!token,
        len: token?.length,
      })
    } catch {}
  }
  return token
}

export function issueAccessToken(user: JWTUser): string {
  return signToken(user, 'access', ACCESS_TOKEN_TTL)
}

export function issueRefreshToken(user: JWTUser): string {
  return signToken(user, 'refresh', REFRESH_TOKEN_TTL)
}

function baseVerify<T extends BaseJWTPayload>(token: string): T | null {
  return verifyWithRotation<T>(token)
}

export function verifyAccessToken(token: string): JWTUser | null {
  const decoded = baseVerify<AccessPayload>(token)
  if (!decoded || decoded.tokenType !== 'access') return null
  return {
    id: decoded.id,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role,
  }
}

export function verifyRefreshToken(token: string): JWTUser | null {
  const decoded = baseVerify<RefreshPayload>(token)
  if (!decoded || decoded.tokenType !== 'refresh') return null
  return {
    id: decoded.id,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role,
  }
}

// Backwards compatible alias for existing code/tests; delegates to access token verify.
export function verifyJWTToken(token: string): JWTUser | null {
  return verifyAccessToken(token)
}

export interface BasicAuthRequest {
  headers: Headers
  cookies?: { get(name: string): { value: string } | undefined }
}

export function getUserFromRequest(request: BasicAuthRequest): JWTUser | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization')

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7)
    return verifyAccessToken(token)
  }

  // Try cookie as fallback
  const cookieToken = request.cookies?.get('auth-token')?.value

  if (cookieToken) {
    return verifyAccessToken(cookieToken)
  }

  return null
}

export function requireAuth(user: JWTUser | null) {
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
