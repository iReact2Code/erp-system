import { auth } from '@/lib/auth'
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

  const session = await auth()
  const isAuthPage =
    request.nextUrl.pathname.includes('/login') ||
    request.nextUrl.pathname.includes('/register')

  if (isAuthPage) {
    if (session) {
      // Extract locale from the current path for redirect
      const locale = request.nextUrl.pathname.split('/')[1]
      const redirectUrl = locales.includes(locale)
        ? `/${locale}/dashboard`
        : '/en/dashboard'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    return response
  }

  if (!session) {
    let callbackUrl = request.nextUrl.pathname
    if (request.nextUrl.search) {
      callbackUrl += request.nextUrl.search
    }

    // Extract locale for login redirect
    const locale = request.nextUrl.pathname.split('/')[1]
    const loginUrl = locales.includes(locale) ? `/${locale}/login` : '/en/login'
    const encodedCallbackUrl = encodeURIComponent(callbackUrl)
    return NextResponse.redirect(
      new URL(`${loginUrl}?callbackUrl=${encodedCallbackUrl}`, request.url)
    )
  }

  // Add role-based access control here
  const userRole = session.user?.role as string
  const path = request.nextUrl.pathname

  // Define role-based route access (including locale paths)
  const roleAccess = {
    CLERK: ['/dashboard', '/inventory', '/sales'],
    SUPERVISOR: [
      '/dashboard',
      '/inventory',
      '/sales',
      '/purchases',
      '/reports',
      '/users',
    ],
    THIRD_PARTY_CLIENT: ['/dashboard', '/orders', '/profile'],
  }

  const allowedPaths = roleAccess[userRole as keyof typeof roleAccess] || []

  // Check if the path (without locale) is allowed
  const pathSegments = path.split('/')
  const locale = pathSegments[1]
  const pathWithoutLocale = locales.includes(locale)
    ? '/' + pathSegments.slice(2).join('/')
    : path

  const isAllowed = allowedPaths.some(allowedPath =>
    pathWithoutLocale.startsWith(allowedPath)
  )

  if (!isAllowed) {
    const pathSegments = path.split('/')
    const currentLocale = pathSegments[1]
    const dashboardUrl = locales.includes(currentLocale)
      ? `/${currentLocale}/dashboard`
      : '/en/dashboard'
    return NextResponse.redirect(new URL(dashboardUrl, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

export default middleware
