import { apiSuccess } from '../api-errors'

function buildHeaders(map: Record<string, string>) {
  const h = new Headers()
  for (const k of Object.keys(map)) h.set(k, map[k])
  return h
}

describe('apiSuccess ETag support', () => {
  test('auto generates weak ETag and returns body', async () => {
    const res = apiSuccess({ data: { a: 1 }, etag: true })
    expect(res.status).toBe(200)
    const etag = res.headers.get('etag')
    expect(etag).toMatch(/^W/)
    const json = await res.json()
    expect(json).toEqual({ a: 1 })
  })

  test('returns 304 when If-None-Match matches generated ETag', async () => {
    // First response to get ETag
    const first = apiSuccess({ data: { a: 2 }, etag: true })
    const etag = first.headers.get('etag')!
    const conditional = apiSuccess({
      data: { a: 2 },
      etag: etag.replace(/^W\//, '').replace(/"/g, ''), // provide trimmed tag (helper will quote)
      requestHeaders: buildHeaders({ 'if-none-match': etag }),
    })
    expect(conditional.status).toBe(304)
  })
})
