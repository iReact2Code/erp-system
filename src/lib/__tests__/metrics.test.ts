import {
  incCounter,
  observeHistogram,
  collectMetrics,
  resetMetrics,
  recordApiMetric,
} from '@/lib/metrics'

describe('metrics primitives', () => {
  beforeEach(() => resetMetrics())

  test('counter increments aggregate', () => {
    incCounter('api_requests_total', {
      route: '/x',
      method: 'GET',
      status: 200,
    })
    incCounter('api_requests_total', {
      route: '/x',
      method: 'GET',
      status: 200,
    })
    const snap = collectMetrics()
    const key = Object.keys(snap.counters).find(k =>
      k.startsWith('api_requests_total')
    )!
    expect(snap.counters[key]).toBe(2)
  })

  test('histogram buckets record durations', () => {
    observeHistogram('api_request_duration_ms', 12, {
      route: '/y',
      method: 'GET',
      status: 200,
    })
    observeHistogram('api_request_duration_ms', 600, {
      route: '/y',
      method: 'GET',
      status: 200,
    })
    const snap = collectMetrics()
    const hKey = Object.keys(snap.histograms).find(k =>
      k.startsWith('api_request_duration_ms')
    )!
    const h = snap.histograms[hKey]
    expect(h.count).toBe(2)
    expect(h.sum).toBeGreaterThanOrEqual(612 - 1)
  })

  test('recordApiMetric aggregates counters & histograms', () => {
    recordApiMetric({
      route: '/z',
      method: 'POST',
      status: 201,
      durationMs: 50,
    })
    recordApiMetric({
      route: '/z',
      method: 'POST',
      status: 500,
      durationMs: 100,
      error: true,
    })
    const snap = collectMetrics()
    const reqKeys = Object.keys(snap.counters).filter(
      k => k.startsWith('api_requests_total') && k.includes('route=/z')
    )
    const totalReq = reqKeys.reduce((acc, k) => acc + snap.counters[k], 0)
    const errKeys = Object.keys(snap.counters).filter(
      k => k.startsWith('api_errors_total') && k.includes('route=/z')
    )
    const totalErr = errKeys.reduce((acc, k) => acc + snap.counters[k], 0)
    expect(totalReq).toBe(2)
    expect(totalErr).toBe(1)
  })
})
