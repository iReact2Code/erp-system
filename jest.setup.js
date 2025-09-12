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
