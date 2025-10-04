import { isSlowQuery } from '../prisma-performance'

describe('isSlowQuery', () => {
  test('returns false when below threshold', () => {
    expect(isSlowQuery(99, 100)).toBe(false)
  })
  test('returns true when equal to threshold', () => {
    expect(isSlowQuery(100, 100)).toBe(true)
  })
  test('returns true when above threshold', () => {
    expect(isSlowQuery(150, 100)).toBe(true)
  })
})
