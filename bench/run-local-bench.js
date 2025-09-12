const http = require('http')
const fetch = require('node-fetch')

const PORT = 3002
const API_URL = `http://localhost:${PORT}/api/bench`
const CONCURRENCY = 20
const ROUNDS = 20

// Start mock server
const server = http.createServer((req, res) => {
  if (req.url === '/api/bench') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ data: 'ok' }))
    }, 10)
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(PORT, async () => {
  console.log('mock server listening on', PORT)

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

  const start = Date.now()
  for (let r = 0; r < ROUNDS; r++) {
    await runRound()
  }
  const ms = Date.now() - start
  console.log(`Completed ${ROUNDS} rounds, time=${ms}ms`)
  server.close(() => process.exit(0))
})
