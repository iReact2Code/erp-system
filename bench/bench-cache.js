const fetch = require('node-fetch')

// Simple synthetic benchmark to measure cache dedupe effectiveness.
// Usage: node bench/bench-cache.js

const API_URL = process.env.BENCH_API_URL || 'http://localhost:3000/api/bench'
const CONCURRENCY = parseInt(process.env.BENCH_CONCURRENCY || '50')
const ROUNDS = parseInt(process.env.BENCH_ROUNDS || '100')

async function singleRequest() {
  const res = await fetch(API_URL)
  return res.ok
}

async function runRound() {
  const promises = []
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push(singleRequest())
  }
  const results = await Promise.all(promises)
  return results.filter(Boolean).length
}

;(async () => {
  console.log('Starting bench: url=', API_URL, 'concurrency=', CONCURRENCY)
  const start = Date.now()
  for (let r = 0; r < ROUNDS; r++) {
    await runRound()
  }
  const ms = Date.now() - start
  console.log(`Completed ${ROUNDS} rounds, time=${ms}ms`)

  // Simple exit code behavior: if BENCH_FAIL_ON_SLOW is set and time exceeds
  // threshold, exit non-zero to fail CI.
  const threshold = parseInt(process.env.BENCH_FAIL_THRESHOLD_MS || '5000')
  if (process.env.BENCH_FAIL_ON_SLOW && ms > threshold) {
    console.error(`Benchmark exceeded threshold ${threshold}ms -> ${ms}ms`)
    process.exit(2)
  }
  process.exit(0)
})()
