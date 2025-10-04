import http from 'http'
import { fetchUsers } from '../service'

// Use node-fetch via require to avoid ESM interop quirks in this test runner
const fetch = require('node-fetch')

describe('users route HTTP integration (minimal)', () => {
  test('GET /api/users returns paginated JSON', async () => {
    const items = [
      {
        id: '1',
        name: 'Alice',
        email: 'a@x',
        role: 'USER',
        createdAt: new Date().toISOString(),
      },
    ]

    const db = {
      user: {
        findMany: jest.fn().mockResolvedValue(items),
        count: jest.fn().mockResolvedValue(1),
      },
    }

    const server = http.createServer(async (req, res) => {
      try {
        const base = `http://${req.headers.host}`
        const url = new URL(req.url || '/', base)
        if (url.pathname !== '/api/users') {
          res.statusCode = 404
          res.end()
          return
        }

        const q = url.searchParams.get('q') || undefined
        const pageParam = url.searchParams.get('page')
        const limitParam = url.searchParams.get('limit')
        const page = pageParam ? parseInt(pageParam, 10) : undefined
        const limit = limitParam ? parseInt(limitParam, 10) : undefined

        const result = await fetchUsers(db, { q, page, limit })
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(result))
      } catch {
        res.statusCode = 500
        res.end(JSON.stringify({ error: 'server error' }))
      }
    })

    await new Promise<void>(resolve => server.listen(0, resolve))
    const port = (server.address() as unknown as { port: number }).port

    const resp = await fetch(
      `http://127.0.0.1:${port}/api/users?page=1&limit=10&q=a`
    )
    expect(resp.status).toBe(200)
    const json = await resp.json()
    expect(json).toHaveProperty('data')
    expect(json).toHaveProperty('pagination')

    await new Promise<void>(resolve => server.close(() => resolve()))
  })
})
