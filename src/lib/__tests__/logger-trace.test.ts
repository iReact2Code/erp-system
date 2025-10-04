import { runWithRequestContext } from '@/lib/observability/async-context'
import { createRequestContext } from '@/lib/observability/context'
import { getContextLogger } from '@/lib/logger'

describe('logger traceId enrichment', () => {
  it('includes traceId in output when present in request context', () => {
    const log = getContextLogger('test')

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    const ctx = createRequestContext({
      requestId: 'r1',
      traceId: 'abc123traceid',
    })
    runWithRequestContext(ctx, () => {
      log.info('hello', { foo: 'bar' })
    })

    const output = spy.mock.calls.map(c => c.join(' ')).join('\n')
    expect(output).toContain('abc123traceid')
    spy.mockRestore()
  })
})
