import { apiSuccess } from '../api-errors'

describe('apiSuccess helper', () => {
  test('returns json with provided data and headers including x-request-id', async () => {
    const res = apiSuccess({
      status: 201,
      data: { ok: true },
      headers: { 'x-request-id': 'succ-1', 'X-Trace-Id': 'trace-xyz' },
    })
    expect(res.status).toBe(201)
    expect(res.headers.get('x-request-id')).toBe('succ-1')
    const json = await res.json()
    expect(json).toEqual({ ok: true })
  })
})
