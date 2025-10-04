import { buildValidator, HttpError } from '../unified-validation'
import { z } from 'zod'
import type { NextRequest } from 'next/server'

interface MockLikeRequest extends Request {
  nextUrl?: URL
  _body?: string
}

function mockRequest(
  url: string,
  method: string,
  body?: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  const raw = body === undefined ? '' : JSON.stringify(body)
  const r = new Request(url, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: raw || undefined,
  }) as MockLikeRequest
  r._body = raw
  // Monkey patch text() so repeated reads work and we control return value.
  r.text = async () => r._body || ''
  return r as unknown as NextRequest
}

describe('buildValidator', () => {
  test('valid body passes', async () => {
    const validate = buildValidator({ body: z.object({ name: z.string() }) })
    const req = mockRequest('http://x.local/test', 'POST', { name: 'Widget' })
    const result = await validate(req)
    expect(result.body?.name).toBe('Widget')
  })

  test('invalid body fails with HttpError', async () => {
    const validate = buildValidator({
      body: z.object({ name: z.string().min(2) }),
    })
    const req = mockRequest('http://x.local/test', 'POST', { name: 'A' })
    await expect(validate(req)).rejects.toBeInstanceOf(HttpError)
  })

  test('query coercion', async () => {
    const validate = buildValidator({
      query: z.object({ page: z.number().int(), flag: z.boolean() }),
    })
    const req = mockRequest('http://x.local/test?page=2&flag=true', 'GET')
    const result = await validate(req)
    expect(result.query?.page).toBe(2)
    expect(result.query?.flag).toBe(true)
  })

  test('trims body strings when trimStrings enabled', async () => {
    const validate = buildValidator(
      {
        body: z.object({
          name: z.string(),
          nested: z.object({ note: z.string() }),
        }),
      },
      { trimStrings: true }
    )
    const req = mockRequest('http://x.local/test', 'POST', {
      name: '  Widget  ',
      nested: { note: '\tHello World  ' },
    })
    const result = await validate(req)
    expect(result.body?.name).toBe('Widget')
    expect(result.body?.nested.note).toBe('Hello World')
  })

  test('custom sanitizer mutates body post-parse', async () => {
    const validate = buildValidator(
      { body: z.object({ sku: z.string() }) },
      {
        sanitize: {
          body: v => {
            const obj = v as { sku: string }
            return { ...obj, sku: obj.sku.toUpperCase() }
          },
        },
      }
    )
    const req = mockRequest('http://x.local/test', 'POST', { sku: 'abc-123' })
    const result = await validate(req)
    expect(result.body?.sku).toBe('ABC-123')
  })

  test('sanitizer failure surfaces SANITIZE_FAILED', async () => {
    const validate = buildValidator(
      { body: z.object({ x: z.number() }) },
      {
        sanitize: {
          body: () => {
            throw new Error('boom')
          },
        },
      }
    )
    const req = mockRequest('http://x.local/test', 'POST', { x: 5 })
    await expect(validate(req)).rejects.toMatchObject({
      code: 'SANITIZE_FAILED',
    })
  })

  test('numeric coercion edge: large integer stays number', async () => {
    const validate = buildValidator({ query: z.object({ big: z.number() }) })
    const big = 2 ** 53 - 1 // MAX_SAFE_INTEGER
    const req = mockRequest(`http://x.local/test?big=${big}`, 'GET')
    const result = await validate(req)
    expect(result.query?.big).toBe(big)
  })

  test('trims strings inside arrays when enabled', async () => {
    const validate = buildValidator(
      { body: z.object({ tags: z.array(z.string()) }) },
      { trimStrings: true }
    )
    const req = mockRequest('http://x.local/test', 'POST', {
      tags: ['  a ', '\tb ', 'c  '],
    })
    const result = await validate(req)
    expect(result.body?.tags).toEqual(['a', 'b', 'c'])
  })

  test('fails when JSON exceeds maxJsonBytes', async () => {
    const validate = buildValidator(
      { body: z.object({ blob: z.string() }) },
      { maxJsonBytes: 20 }
    )
    const large = 'x'.repeat(100)
    const req = mockRequest('http://x.local/test', 'POST', { blob: large })
    await expect(validate(req)).rejects.toMatchObject({
      code: 'JSON_TOO_LARGE',
    })
  })
})
