import { buildUserWhere } from '../query'

describe('buildUserWhere', () => {
  test('returns undefined for empty or blank queries', () => {
    expect(buildUserWhere('')).toBeUndefined()
    expect(buildUserWhere('   ')).toBeUndefined()
    expect(buildUserWhere(undefined)).toBeUndefined()
  })

  test('builds OR contains filters for name and email', () => {
    const where = buildUserWhere('alice') as any
    expect(where).toBeDefined()
    expect(Array.isArray(where.OR)).toBe(true)
    expect(where.OR.length).toBe(2)
    // ensure each OR entry has a single key with contains/mode
    for (const entry of where.OR) {
      const key = Object.keys(entry)[0]
      expect(entry[key].contains).toBeDefined()
      expect(entry[key].mode).toBe('insensitive')
    }
  })
})
