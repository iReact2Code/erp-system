import { createLogger } from '../logger'

describe('logger traceId enrichment', () => {
  it('includes traceId when active OpenTelemetry span exists', () => {
    // Mock @opentelemetry/api before requiring logger internals
    jest.resetModules()
    jest.doMock('@opentelemetry/api', () => ({
      trace: {
        getActiveSpan: () => ({
          spanContext: () => ({ traceId: 'abc123traceid' }),
        }),
      },
    }))

    const { createLogger: freshCreateLogger } = require('../logger')
    const log = freshCreateLogger('test')

    const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
    log.info('hello', { foo: 'bar' })

    const output = spy.mock.calls.map(c => c.join(' ')).join('\n')
    expect(output).toContain('abc123traceid')
    spy.mockRestore()
  })
})
