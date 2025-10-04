import { apiError } from '../api-errors'

describe('apiError helper', () => {
  test('builds standardized payload', async () => {
    const res = apiError({
      status: 422,
      code: 'TEST_ERROR',
      message: 'Test failure',
      details: [{ field: 'x' }],
      headers: { 'x-request-id': 'test-id-123' },
    })
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json).toEqual({
      error: 'TEST_ERROR',
      message: 'Test failure',
      details: [{ field: 'x' }],
    })
    // Check x-request-id header is present
    expect(res.headers.get('x-request-id')).toBe('test-id-123')
  })
})
