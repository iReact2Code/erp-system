import { withTimeout, TimeoutError } from '@/lib/timeout-guard'

describe('withTimeout', () => {
  beforeAll(() => {
    jest.useFakeTimers()
  })
  afterAll(() => {
    jest.useRealTimers()
  })

  test('resolves before timeout', async () => {
    const promise = withTimeout(async () => 42, { ms: 50 })
    jest.advanceTimersByTime(10)
    await expect(promise).resolves.toBe(42)
  })

  test('times out and throws TimeoutError', async () => {
    const promise = withTimeout(
      () => new Promise(res => setTimeout(() => res(1), 30)),
      { ms: 10 }
    )
    jest.advanceTimersByTime(15)
    await Promise.resolve()
    await expect(promise).rejects.toBeInstanceOf(TimeoutError)
  }, 100)

  test('propagates underlying errors', async () => {
    const promise = withTimeout(
      async () => {
        throw new Error('fail')
      },
      { ms: 50 }
    )
    jest.advanceTimersByTime(5)
    await expect(promise).rejects.toThrow('fail')
  })
})
