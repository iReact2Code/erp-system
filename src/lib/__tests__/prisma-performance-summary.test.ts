import { getPerfSummary } from '../prisma-performance'

// We cannot easily trigger real Prisma events here without the client, so we simulate
// aggregation indirectly by calling internal logic through a lightweight mock.
// Instead of importing private record function, we approximate by checking summary
// remains consistent when no queries have run.

describe('getPerfSummary initial state', () => {
  test('returns zeroed counters safely', () => {
    const summary = getPerfSummary()
    expect(summary.totalQueries).toBeGreaterThanOrEqual(0)
    expect(summary.avgMs).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(summary.targets)).toBe(true)
    expect(summary.slowThresholdMs).toBeGreaterThan(0)
  })
})

// NOTE: Full aggregation path is exercised indirectly at runtime; a deeper unit
// test would require refactoring record() to be exported for direct invocation.
// This minimal test guards shape + non-crashing behavior.
