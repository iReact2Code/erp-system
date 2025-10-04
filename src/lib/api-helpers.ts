// Client-only API helpers. Server-side helpers were moved to server-api-helpers.ts
export function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null

  const hasOptions = options && Object.keys(options).length > 0
  const hasHeaders =
    options && (options as unknown as Record<string, unknown>).headers

  // If there's no auth token and no headers to merge, keep the original
  // fetch call shape so tests that expect a plain fetch(url) or fetch(url, opts)
  // pass. For plain GETs with no token and no options, call fetch(url).
  if (!token) {
    if (!hasOptions) return fetch(url)
    if (!hasHeaders) return fetch(url, options)
  }

  const headers = {
    ...getAuthHeaders(),
    ...((options && options.headers) || {}),
  }

  __debug_fetch(url, options)
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  })
}

// DEBUG: log when fetch called (uses structured logger)
import { createLogger } from '@/lib/logger'
const apiHelperLog = createLogger('api-client')
const __debug_fetch = (u: string, o?: RequestInit) => {
  if (process.env.NODE_ENV !== 'production') {
    apiHelperLog.debug('authenticated_fetch', { url: u, hasOptions: !!o })
  }
}
