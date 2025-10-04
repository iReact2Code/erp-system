#!/usr/bin/env node
/*
 Compare two benchmark JSON outputs and fail if regression exceeds tolerance.

 Usage:
  node bench/compare-bench.js --baseline baseline.json --current current.json --toleranceP95=20 --toleranceAvg=15
*/

const fs = require('fs')

function parseArgs(argv) {
  const out = {}
  argv.forEach(arg => {
    const m = arg.match(/^--([^=]+)=(.+)$/)
    if (m) out[m[1]] = m[2]
  })
  return out
}

function loadJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'))
}

function indexByPath(arr) {
  const m = new Map()
  for (const r of arr) m.set(r.path, r)
  return m
}

function pctDelta(b, c) {
  if (b === 0) return c === 0 ? 0 : 100
  return ((c - b) / b) * 100
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const baselinePath = args.baseline
  const currentPath = args.current
  const tolP95 = parseFloat(args.toleranceP95 || '20')
  const tolAvg = parseFloat(args.toleranceAvg || '15')
  if (!baselinePath || !currentPath) {
    console.error('Missing --baseline or --current')
    process.exit(2)
  }
  const baseline = loadJson(baselinePath)
  const current = loadJson(currentPath)
  const bIdx = indexByPath(baseline.results)
  const cIdx = indexByPath(current.results)
  let failed = false
  for (const [path, b] of bIdx.entries()) {
    const c = cIdx.get(path)
    if (!c) continue
    const dp95 = pctDelta(b.p95, c.p95)
    const davg = pctDelta(b.avg, c.avg)
    const msg = `endpoint=${path} p95: ${b.p95}->${c.p95} (${dp95.toFixed(1)}%) avg: ${b.avg}->${c.avg} (${davg.toFixed(1)}%)`
    if (dp95 > tolP95 || davg > tolAvg) {
      console.error('[REGRESSION]', msg)
      failed = true
    } else {
      console.log('[OK]', msg)
    }
  }
  if (failed) process.exit(1)
}

main()
