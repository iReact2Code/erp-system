import { createLogger } from '@/lib/logger'

const metricsLog = createLogger('metrics')

// Basic in-memory counters & histograms (for dev / initial observability)
// Prometheus style exposition can be added later.

export interface MetricLabels {
  [k: string]: string | number | undefined
}

interface CounterMetric {
  value: number
}
interface HistogramMetric {
  buckets: number[]
  counts: number[]
  sum: number
  count: number
}

const counters = new Map<string, CounterMetric>()
const histograms = new Map<string, HistogramMetric>()

const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2000] // ms

function labelsKey(labels?: MetricLabels): string {
  if (!labels) return ''
  return Object.keys(labels)
    .sort()
    .map(k => `${k}=${labels[k]}`)
    .join(',')
}

function key(name: string, labels?: MetricLabels) {
  const lk = labelsKey(labels)
  return lk ? `${name}{${lk}}` : name
}

export function incCounter(name: string, labels?: MetricLabels, value = 1) {
  const k = key(name, labels)
  let metric = counters.get(k)
  if (!metric) {
    metric = { value: 0 }
    counters.set(k, metric)
  }
  metric.value += value
}

export function observeHistogram(
  name: string,
  ms: number,
  labels?: MetricLabels,
  buckets: number[] = DEFAULT_BUCKETS
) {
  const k = key(name, labels)
  let hist = histograms.get(k)
  if (!hist) {
    hist = {
      buckets: buckets.slice(),
      counts: new Array(buckets.length + 1).fill(0),
      sum: 0,
      count: 0,
    }
    histograms.set(k, hist)
  }
  hist.sum += ms
  hist.count += 1
  // find bucket index
  let idx = hist.buckets.findIndex(b => ms <= b)
  if (idx === -1) idx = hist.buckets.length // overflow bucket
  hist.counts[idx] += 1
}

export interface CollectedMetrics {
  counters: Record<string, number>
  histograms: Record<
    string,
    { buckets: number[]; counts: number[]; sum: number; count: number }
  >
}

export function collectMetrics(): CollectedMetrics {
  const c: Record<string, number> = {}
  counters.forEach((v, k) => (c[k] = v.value))
  const h: Record<
    string,
    { buckets: number[]; counts: number[]; sum: number; count: number }
  > = {}
  histograms.forEach(
    (v, k) =>
      (h[k] = {
        buckets: v.buckets,
        counts: v.counts.slice(),
        sum: v.sum,
        count: v.count,
      })
  )
  return { counters: c, histograms: h }
}

export function resetMetrics() {
  counters.clear()
  histograms.clear()
}

export interface ApiMetricOptions {
  route: string
  method: string
  status: number
  durationMs: number
  error?: boolean
}

export function recordApiMetric(opts: ApiMetricOptions) {
  if (process.env.METRICS_DISABLE === '1') return
  try {
    incCounter('api_requests_total', {
      route: opts.route,
      method: opts.method,
      status: opts.status,
    })
    if (opts.error || opts.status >= 500) {
      incCounter('api_errors_total', {
        route: opts.route,
        method: opts.method,
        status: opts.status,
      })
    }
    observeHistogram('api_request_duration_ms', opts.durationMs, {
      route: opts.route,
      method: opts.method,
      status: opts.status,
    })
  } catch (err) {
    metricsLog.warn('record_failed', { error: (err as Error).message })
  }
}
