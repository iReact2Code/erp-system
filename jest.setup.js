import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
  useParams() {
    return { locale: 'en' }
  },
}))

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: ns => {
    // Basic namespace->key mapping to return readable strings in tests.
    const map = {
      purchases: {
        title: 'purchases',
        description: 'description',
        total: 'total',
        status: 'status',
        completed: 'Completed',
        pending: 'Pending',
        cancelled: 'Cancelled',
        approved: 'Approved',
        rejected: 'Rejected',
      },
      inventory: {
        title: 'inventory',
        description: 'manageInventory',
        inStock: 'In Stock',
        lowStock: 'Low Stock',
        outOfStock: 'Out of Stock',
        searchInventory: 'searchInventory',
        noItemsFound: 'noItemsFound',
      },
      sales: {
        title: 'sales',
        description: 'description',
      },
      common: {
        search: 'search',
        date: 'date',
        actions: 'actions',
      },
    }

    const nsMap = map[ns] || {}
    return key => nsMap[key] ?? key
  },
  useLocale: () => 'en',
}))

// Mock useToast to avoid requiring ToastProvider in component tests
jest.mock('@/components/ui/use-toast', () => ({
  ToastProvider: ({ children }) => children,
  useToast: () => ({
    toasts: [],
    addToast: jest.fn(),
    removeToast: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  }),
}))

// Mock fetch globally
global.fetch = jest.fn()

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Global test utilities
global.console = {
  ...console,
  // Suppress specific warnings in tests
  warn: jest.fn(),
  error: jest.fn(),
}

// Provide minimal WHATWG fetch classes if not present (Node < 18 or test env shims)
if (typeof global.Request === 'undefined') {
  // Use undici if available (Node 18+ includes fetch implementation)
  try {
    const undici = require('undici')
    if (undici.Request && undici.Response && undici.Headers) {
      // Attach to global
      global.Request = undici.Request
      global.Response = undici.Response
      global.Headers = undici.Headers
      if (!global.fetch) {
        global.fetch = undici.fetch
      }
    }
  } catch {
    // Fallback minimal polyfill just enough for NextRequest construction
    class BasicHeaders {
      constructor(init) {
        this._map = new Map()
        if (init) {
          if (init instanceof Map) {
            for (const [k, v] of init)
              this._map.set(String(k).toLowerCase(), String(v))
          } else if (Array.isArray(init)) {
            for (const [k, v] of init)
              this._map.set(String(k).toLowerCase(), String(v))
          } else if (typeof init === 'object') {
            for (const k of Object.keys(init))
              this._map.set(k.toLowerCase(), init[k])
          }
        }
      }
      get(k) {
        return this._map.get(k.toLowerCase()) || null
      }
      set(k, v) {
        this._map.set(k.toLowerCase(), v)
      }
      has(k) {
        return this._map.has(k.toLowerCase())
      }
      delete(k) {
        this._map.delete(k.toLowerCase())
      }
      forEach(cb) {
        for (const [k, v] of this._map.entries()) cb(v, k, this)
      }
      entries() {
        return this._map.entries()
      }
      keys() {
        return this._map.keys()
      }
      values() {
        return this._map.values()
      }
      [Symbol.iterator]() {
        return this._map[Symbol.iterator]()
      }
    }
    global.Headers = BasicHeaders
    class BasicRequest {
      constructor(input, init) {
        this._url = input
        this.headers = new BasicHeaders(init && init.headers)
      }
      get url() {
        return this._url
      }
    }
    global.Request = BasicRequest
    if (typeof global.Response === 'undefined') {
      class BasicResponse {
        constructor(body, init = {}) {
          this._body = typeof body === 'undefined' ? null : body
          this.status = init.status || 200
          this.statusText = init.statusText || ''
          this.headers = new BasicHeaders(init.headers)
        }
        get body() {
          return this._body
        }
        async json() {
          return JSON.parse(this._body || '{}')
        }
        async text() {
          return this._body || ''
        }
        clone() {
          return new BasicResponse(this._body, {
            status: this.status,
            statusText: this.statusText,
            headers: this.headers,
          })
        }
      }
      global.Response = BasicResponse
    }
  }
}

// Setup cleanup after each test
afterEach(() => {
  jest.clearAllMocks()
  // Clear api cache used by hooks between tests
  try {
    // require here to avoid top-level import in jest config
    const api = require('./src/hooks/use-api')
    if (api && typeof api.clearApiCache === 'function') api.clearApiCache()
  } catch {
    // ignore if module not available in this environment
  }
})
