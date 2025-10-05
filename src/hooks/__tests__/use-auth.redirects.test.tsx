import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../use-auth'

// Mock next/navigation for useRouter, usePathname, useParams
const push = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/en/dashboard',
  useParams: () => ({ locale: 'en' }),
}))

// Mock logger to avoid noisy console
jest.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() }),
  serializeError: (e: unknown) => String(e),
}))

describe('useAuth redirects', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.resetModules()
    ;(global as unknown as { fetch: unknown }).fetch = jest
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({}) })
  })

  test('unauthenticated user redirects to /en/login', () => {
    renderHook(() => useAuth())

    // Allow effects to run
    act(() => {})

    // Since we mocked useRouter, we need to re-read it to access push
    const { useRouter } = jest.requireMock('next/navigation') as {
      useRouter: () => { push: jest.Mock }
    }
    const router = useRouter()

    expect(router.push).toHaveBeenCalledWith('/en/login')
  })

  test('logout redirects to /en/login', async () => {
    localStorage.setItem('auth-token', 'x')
    localStorage.setItem(
      'user',
      JSON.stringify({ id: '1', email: 'a', name: 'A', role: 'CLERK' })
    )

    const { result } = renderHook(() => useAuth())

    // Allow initial effects
    act(() => {})

    const { useRouter } = jest.requireMock('next/navigation') as {
      useRouter: () => { push: jest.Mock }
    }
    const router = useRouter()

    await act(async () => {
      await result.current.signOut()
    })

    expect(router.push).toHaveBeenCalledWith('/en/login')
  })
})
