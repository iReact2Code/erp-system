import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { applySecurityHeaders } from '@/lib/security-headers'
import { generateNonce, attachNonceHeader } from '@/lib/csp'

const locales = ['en', 'ug', 'es', 'fr', 'ar', 'he', 'zh']

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
})

export async function middleware(request: NextRequest) {
  // Internationalization first; preserve redirect/rewrite behavior from next-intl
  const response = intlMiddleware(request)
  // Generate CSP nonce and attach header for downstream usage (server components / pages)
  const nonce = generateNonce()
  attachNonceHeader(response.headers, nonce)
  // Apply security headers uniformly (CSP, HSTS, etc.) now nonce-aware
  applySecurityHeaders(response)
  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
  runtime: 'nodejs',
}

export default middleware
