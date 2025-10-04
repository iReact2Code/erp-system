import { createRateLimiter } from '@/lib/rate-limit'

jest.useFakeTimers()

describe('rate limiter', () => {
  test('allows requests within limit', async () => {
    const rl = createRateLimiter({ windowMs: 1000, max: 3 })
    const r1 = await rl.check('k')
    const r2 = await rl.check('k')
    const r3 = await rl.check('k')
    expect(r1.limited).toBe(false)
    expect(r2.limited).toBe(false)
    expect(r3.limited).toBe(false)
  })

  test('blocks after exceeding limit', async () => {
    const rl = createRateLimiter({ windowMs: 1000, max: 2 })
    await rl.check('k')
    await rl.check('k')
    const r3 = await rl.check('k')
    expect(r3.limited).toBe(true)
    expect(r3.remaining).toBe(0)
  })

  test('resets after window', async () => {
    const rl = createRateLimiter({ windowMs: 1000, max: 1 })
    const first = await rl.check('k')
    expect(first.limited).toBe(false)
    const second = await rl.check('k')
    expect(second.limited).toBe(true)
    jest.advanceTimersByTime(1000)
    const third = await rl.check('k')
    expect(third.limited).toBe(false)
  })
})
