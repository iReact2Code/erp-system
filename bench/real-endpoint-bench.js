const fetch = require('node-fetch')

const BASE = process.env.BENCH_BASE || 'http://localhost:3000'
// Allow overriding endpoints via CSV env; default to a few internal, fast endpoints
const ENDPOINTS = process.env.BENCH_ENDPOINTS
  ? process.env.BENCH_ENDPOINTS.split(',')
      .map(s => s.trim())
      .filter(Boolean)
  : ['/api/_internal/ready', '/api/_internal/health']
const CONCURRENCY = parseInt(process.env.BENCH_CONCURRENCY || '10', 10)
const ROUNDS = parseInt(process.env.BENCH_ROUNDS || '5', 10)

async function singleRequest(path) {
  const start = Date.now()
  try {
    const res = await fetch(`${BASE}${path}`)
    const ok = res.ok
    const ms = Date.now() - start
    return { ok, ms }
  } catch {
    return { ok: false, ms: Date.now() - start }
  }
}

async function runEndpoint(path) {
  const samples = []
  for (let r = 0; r < ROUNDS; r++) {
    const promises = []
    for (let i = 0; i < CONCURRENCY; i++) promises.push(singleRequest(path))
    const results = await Promise.all(promises)
    results.forEach(res => samples.push(res.ms))
    // small pause between rounds
    await new Promise(resolve => setTimeout(resolve, 50))
  }

  samples.sort((a, b) => a - b)
  const count = samples.length
  const p50 = samples[Math.floor(count * 0.5)]
  const p95 = samples[Math.floor(count * 0.95)]
  const avg = Math.round(samples.reduce((s, v) => s + v, 0) / count)
  return { path, count, p50, p95, avg }
}

;(async () => {
  const results = []
  for (const ep of ENDPOINTS) {
    const stats = await runEndpoint(ep)
    results.push(stats)
  }
  if (process.env.BENCH_JSON === '1') {
    console.log(
      JSON.stringify({
        base: BASE,
        concurrency: CONCURRENCY,
        rounds: ROUNDS,
        results,
      })
    )
  } else {
    console.log('Bench base:', BASE)
    for (const stats of results) {
      console.log(
        `Endpoint ${stats.path}: count=${stats.count} p50=${stats.p50}ms p95=${stats.p95}ms avg=${stats.avg}ms`
      )
    }
  }

  if (process.env.ENABLE_CACHE_DEBUG === '1') {
    try {
      const res = await fetch(`${BASE}/api/_debug/cache-stats`)
      const data = await res.json()
      console.log('Cache stats:', data)
    } catch {
      console.warn('Failed to fetch cache stats')
    }
  }
})()
