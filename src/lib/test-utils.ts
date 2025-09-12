import { renderHook, waitFor } from '@testing-library/react'
import { ReactNode, createElement } from 'react'
import { UserRole } from '@/lib/prisma-mock'

// Mock API responses
export const mockApiResponse = <T>(data: T, delay = 0) => {
  return new Promise<Response>(resolve => {
    setTimeout(() => {
      resolve({
        ok: true,
        status: 200,
        json: async () => ({ data }),
        text: async () => JSON.stringify({ data }),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic',
        url: '',
        clone: () => mockApiResponse(data, 0) as unknown as Response,
        body: null,
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
      } as Response)
    }, delay)
  })
}

export const mockApiError = (message = 'API Error', status = 500) => {
  return Promise.resolve({
    ok: false,
    status,
    statusText: message,
    json: async () => ({ error: message }),
    text: async () => JSON.stringify({ error: message }),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: () => mockApiError(message, status) as unknown as Response,
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
  } as Response)
}

// Test wrapper for hooks that need providers
export const createTestWrapper = (providers: ReactNode[] = []) => {
  return ({ children }: { children: ReactNode }) => {
    return providers.reduceRight(
      (acc, provider) => createElement('div', {}, provider, acc),
      createElement('div', {}, children)
    )
  }
}

// Helper to test async hooks
export const testAsyncHook = async <T>(
  hook: () => T,
  assertions: (result: T) => void | Promise<void>
) => {
  const { result } = renderHook(hook)

  await waitFor(() => {
    assertions(result.current)
  })

  return result.current
}

// Mock data generators
export const createMockInventoryItem = (overrides = {}) => ({
  id: '1',
  name: 'Test Item',
  sku: 'TEST-001',
  description: 'Test description',
  quantity: 10,
  unitPrice: 29.99,
  status: 'IN_STOCK' as const,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockSale = (overrides = {}) => ({
  id: '1',
  total: 99.99,
  status: 'COMPLETED' as const,
  userId: 'user-1',
  saleDate: '2024-01-01',
  items: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockPurchase = (overrides = {}) => ({
  id: '1',
  total: 199.99,
  status: 'COMPLETED' as const,
  userId: 'user-1',
  items: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockUser = (overrides: Record<string, unknown> = {}) => ({
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: UserRole.EMPLOYEE,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

// Form testing utilities
export const fillForm = async (
  getByLabelText: (text: string) => HTMLElement,
  fields: Record<string, string>
) => {
  const { userEvent } = await import('@testing-library/user-event')
  const user = userEvent.setup()

  for (const [label, value] of Object.entries(fields)) {
    const field = getByLabelText(label)
    await user.clear(field)
    await user.type(field, value)
  }
}

// Table testing utilities
export const expectTableToHaveRows = (
  container: HTMLElement,
  expectedCount: number
) => {
  const rows = container.querySelectorAll('tbody tr')
  expect(rows).toHaveLength(expectedCount)
}

export const expectTableToHaveHeaders = (
  container: HTMLElement,
  expectedHeaders: string[]
) => {
  const headers = Array.from(container.querySelectorAll('thead th')).map(th =>
    th.textContent?.trim()
  )
  expect(headers).toEqual(expectedHeaders)
}

// API testing utilities
export const setupFetchMock = () => {
  const fetchMock = jest.fn()
  global.fetch = fetchMock
  return fetchMock
}

export const expectFetchToHaveBeenCalledWith = (
  fetchMock: jest.Mock,
  url: string,
  options?: RequestInit
) => {
  expect(fetchMock).toHaveBeenCalledWith(url, options)
}

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Accessibility testing utilities
export const expectNoA11yViolations = async (container: HTMLElement) => {
  // This would integrate with @axe-core/react if installed
  // For now, we'll do basic checks
  const elements = container.querySelectorAll('button, input, select, textarea')
  elements.forEach(element => {
    if (element.tagName === 'BUTTON') {
      expect(element).toHaveProperty('type')
    }
    if (element.tagName === 'INPUT') {
      expect(element).toHaveProperty('type')
    }
  })
}
