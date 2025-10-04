import { setErrorReporter, reportError } from '@/lib/error-reporter'
import { runWithRequestContext } from '@/lib/observability/async-context'
import { createRequestContext } from '@/lib/observability/context'

describe('error reporter', () => {
  test('captures context fields', () => {
    interface Captured {
      requestId?: string
      traceId?: string
      message: string
    }
    const captured: Captured[] = []
    setErrorReporter({
      report: e => {
        captured.push(e as Captured)
      },
    })
    const ctx = createRequestContext({ requestId: 'r123', traceId: 't456' })
    runWithRequestContext(ctx, () => {
      reportError(new Error('boom'), { foo: 'bar' })
    })
    expect(captured.length).toBe(1)
    const first = captured[0]
    expect(first.requestId).toBe('r123')
    expect(first.traceId).toBe('t456')
    expect(first.message).toBe('boom')
  })

  test('handles non-error values', () => {
    const captured: unknown[] = []
    setErrorReporter({
      report: e => {
        captured.push(e)
      },
    })
    reportError('string failure')
    const first = captured[0] as { message: string }
    expect(first.message).toContain('string failure')
  })
})
