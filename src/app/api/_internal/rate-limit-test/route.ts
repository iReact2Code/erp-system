import { withApiContext } from '@/lib/observability/context'
import { createRateLimiter, buildRateLimitHeaders } from '@/lib/rate-limit'
import { apiSuccess, tooManyRequests } from '@/lib/api-errors'

// Dedicated small limiter for integration testing (low max to trigger quickly)
const testLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 2,
  prefix: 'testrl:',
})

export const GET = withApiContext(async (req: Request) => {
  const identity = req.headers.get('x-test-id') || 'anon'
  const rl = await testLimiter.check(identity)
  if (rl.limited) {
    return tooManyRequests(
      Math.max(1, rl.reset - Math.floor(Date.now() / 1000)),
      { ...buildRateLimitHeaders(rl) }
    )
  }
  return apiSuccess({
    data: { ok: true, remaining: rl.remaining },
    headers: { ...buildRateLimitHeaders(rl) },
  })
})

export const runtime = 'nodejs'
