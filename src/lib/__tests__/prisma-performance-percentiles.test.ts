import { __injectTestMetric, getPerfSummary } from '../prisma-performance'

describe('performance percentiles', () => {
  test('computes global and per-target p95', () => {
    // Inject a deterministic ascending series for two targets
    const userDurations = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50]
    const orderDurations = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190]
    userDurations.forEach(d => __injectTestMetric('User', d))
    orderDurations.forEach(d => __injectTestMetric('Order', d))
    const summary = getPerfSummary()
    const user = summary.targets.find(t => t.target === 'User')!
    const order = summary.targets.find(t => t.target === 'Order')!
    // For 10 sorted samples, p95 index = floor(0.95 * 9) = floor(8.55) = 8 (0-based)
    expect(user.p95Ms).toBe(userDurations.sort((a, b) => a - b)[8])
    expect(order.p95Ms).toBe(orderDurations.sort((a, b) => a - b)[8])
    expect(summary.globalP95Ms).toBeDefined()
  })
})
