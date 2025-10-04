import { createLogger } from '@/lib/logger'

const perfLog = createLogger('db.perf')

export interface QueryMetric {
  ts: number
  durationMs: number
  query?: string
  params?: string
  target?: string // model or table hint
}

interface PerfState {
  slowSamples: QueryMetric[]
  maxSamples: number
  slowThreshold: number
  totalQueries: number
  totalDurationMs: number
  slowCount: number
  targets: Record<
    string,
    {
      count: number
      slow: number
      totalDurationMs: number
      maxMs: number
      recent: number[] // rolling window raw durations
    }
  >
  sampleWindow: number
  recentDurations: number[] // global rolling window
}

const state: PerfState = {
  slowSamples: [],
  maxSamples: Number(process.env.DB_PERF_MAX_SAMPLES || 50),
  slowThreshold: Number(process.env.SLOW_QUERY_MS || 150),
  totalQueries: 0,
  totalDurationMs: 0,
  slowCount: 0,
  targets: {},
  sampleWindow: Number(process.env.DB_PERF_SAMPLE_WINDOW || 200),
  recentDurations: [],
}

export function isSlowQuery(
  durationMs: number,
  threshold = state.slowThreshold
) {
  return durationMs >= threshold
}

function record(metric: QueryMetric) {
  state.totalQueries += 1
  state.totalDurationMs += metric.durationMs
  const target = metric.target || 'unknown'
  const t = (state.targets[target] ||= {
    count: 0,
    slow: 0,
    totalDurationMs: 0,
    maxMs: 0,
    recent: [],
  })
  t.count += 1
  t.totalDurationMs += metric.durationMs
  if (metric.durationMs > t.maxMs) t.maxMs = metric.durationMs
  // push into rolling windows
  t.recent.push(metric.durationMs)
  if (t.recent.length > state.sampleWindow) t.recent.shift()
  state.recentDurations.push(metric.durationMs)
  if (state.recentDurations.length > state.sampleWindow)
    state.recentDurations.shift()

  if (isSlowQuery(metric.durationMs)) {
    state.slowSamples.push(metric)
    if (state.slowSamples.length > state.maxSamples) state.slowSamples.shift()
    state.slowCount += 1
    t.slow += 1
    perfLog.warn('slow_query', {
      durationMs: metric.durationMs,
      target: metric.target,
    })
  } else if (process.env.DB_PERF_VERBOSE === '1') {
    perfLog.debug('query', {
      durationMs: metric.durationMs,
      target: metric.target,
    })
  }
}

// Test helper (not documented for prod use)
export function __injectTestMetric(target: string, durationMs: number) {
  record({ ts: Date.now(), durationMs, target })
}

export function getSlowQuerySamples() {
  return [...state.slowSamples]
}

export interface PerfSummaryTarget {
  target: string
  count: number
  slow: number
  p95Ms: number | null
  avgMs: number
  maxMs: number
  slowRate: number
}

export interface PerfSummary {
  totalQueries: number
  totalDurationMs: number
  avgMs: number
  slowCount: number
  slowRate: number
  slowThresholdMs: number
  capturedSlowSamples: number
  maxSlowSamples: number
  targets: PerfSummaryTarget[]
  generatedAt: number
  globalP95Ms: number | null
  sampleWindow: number
}

function p95(values: number[]): number | null {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.floor(0.95 * (sorted.length - 1))
  return sorted[idx]
}

export function getPerfSummary(): PerfSummary {
  const avgMs = state.totalQueries
    ? state.totalDurationMs / state.totalQueries
    : 0
  const targets: PerfSummaryTarget[] = Object.entries(state.targets).map(
    ([k, v]) => ({
      target: k,
      count: v.count,
      slow: v.slow,
      avgMs: v.count ? v.totalDurationMs / v.count : 0,
      maxMs: v.maxMs,
      p95Ms: p95(v.recent),
      slowRate: v.count ? v.slow / v.count : 0,
    })
  )
  targets.sort((a, b) => b.count - a.count)
  return {
    totalQueries: state.totalQueries,
    totalDurationMs: state.totalDurationMs,
    avgMs,
    slowCount: state.slowCount,
    slowRate: state.totalQueries ? state.slowCount / state.totalQueries : 0,
    slowThresholdMs: state.slowThreshold,
    capturedSlowSamples: state.slowSamples.length,
    maxSlowSamples: state.maxSamples,
    targets,
    generatedAt: Date.now(),
    globalP95Ms: p95(state.recentDurations),
    sampleWindow: state.sampleWindow,
  }
}

// Attach using Prisma $on('query') events (no middleware typing issues)
interface PrismaQueryEventLike {
  query: string
  params: string
  duration: number
  target?: string
}
export interface PrismaEventClientLike {
  $on?: (event: 'query' | string, cb: (e: PrismaQueryEventLike) => void) => void
}

export function attachPrismaPerformance(client: PrismaEventClientLike) {
  if (!client?.$on) return
  try {
    client.$on('query', (e: PrismaQueryEventLike) => {
      // Prisma QueryEvent: { query, params, duration, target }
      try {
        record({
          ts: Date.now(),
          durationMs: e.duration,
          query: process.env.DB_PERF_CAPTURE_SQL === '1' ? e.query : undefined,
          params:
            process.env.DB_PERF_CAPTURE_PARAMS === '1' ? e.params : undefined,
          target: e.target,
        })
      } catch {
        // swallow metric errors
      }
    })
  } catch {
    // ignore attach errors
  }
}
