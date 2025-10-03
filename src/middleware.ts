import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { applySecurityHeaders } from '@/lib/security-headers'
import { generateNonce, attachNonceHeader } from '@/lib/csp'
import { NextResponse } from 'next/server'

const locales = ['en', 'ug', 'es', 'fr', 'ar', 'he', 'zh']

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
})

export async function middleware(request: NextRequest) {
  // Internationalization first
  const intlResponse = intlMiddleware(request)
  // Ensure we have a NextResponse instance
  const nextRes = NextResponse.next({
    request: { headers: request.headers },
  })
  // Copy headers from intl middleware result first
  intlResponse.headers.forEach((value, key) => {
    nextRes.headers.set(key, value)
  })
  // Generate CSP nonce and attach header for downstream usage (server components / pages)
  const nonce = generateNonce()
  attachNonceHeader(nextRes.headers, nonce)
  // Apply security headers uniformly (CSP, HSTS, etc.) now nonce-aware
  applySecurityHeaders(nextRes)
  // Expose nonce to client only if explicitly needed through a safer header (omit by default). For SSR inline usage fetch from NONCE_HEADER internally.
  return nextRes
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
  runtime: 'nodejs',
}

export default middleware
