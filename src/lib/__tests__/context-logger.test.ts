import { getContextLogger } from '@/lib/logger'
import { runWithRequestContext } from '@/lib/observability/async-context'
import { createRequestContext } from '@/lib/observability/context'

// Capture console output
const origLog = console.log
let logs: unknown[] = []
beforeEach(() => {
  logs = []
  ;(console as unknown as { log: (...args: unknown[]) => void }).log = (
    ...a: unknown[]
  ) => {
    logs.push(a)
  }
})
afterAll(() => {
  console.log = origLog
})

describe('getContextLogger', () => {
  test('enriches log with requestId/traceId', () => {
    const ctx = createRequestContext({
      requestId: 'req123',
      traceId: 'traceABC',
    })
    runWithRequestContext(ctx, () => {
      const log = getContextLogger('test-scope')
      log.info('test_event', { foo: 'bar' })
    })
    const combined = logs.map(x => JSON.stringify(x)).join('\n')
    expect(combined).toContain('req123')
    expect(combined).toContain('traceABC')
  })

  test('logs without context gracefully', () => {
    const log = getContextLogger('no-ctx')
    log.warn('warn_event', { a: 1 })
    const combined = logs.map(x => JSON.stringify(x)).join('\n')
    expect(combined).toContain('warn_event')
  })
})
