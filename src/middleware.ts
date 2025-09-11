import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'

const locales = ['en', 'ug', 'es', 'fr', 'ar', 'he', 'zh']

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale: 'en',
})

export async function middleware(request: NextRequest) {
  // Handle internationalization first
  const response = intlMiddleware(request)

  // Auth checks/logging disabled for performance in development

  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
  runtime: 'nodejs',
}

export default middleware
