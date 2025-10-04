import { buildInventoryWhere } from '../query'

describe('buildInventoryWhere', () => {
  test('returns undefined for empty or blank queries', () => {
    expect(buildInventoryWhere('')).toBeUndefined()
    expect(buildInventoryWhere('   ')).toBeUndefined()
    expect(buildInventoryWhere(undefined)).toBeUndefined()
  })

  test('builds OR contains filters for name, sku and description', () => {
    const where = buildInventoryWhere('widget') as unknown
    expect(where).toBeDefined()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asAny = where as any
    expect(Array.isArray(asAny.OR)).toBe(true)
    expect(asAny.OR.length).toBe(3)
    for (const entry of asAny.OR) {
      const key = Object.keys(entry)[0]
      expect(entry[key].contains).toBeDefined()
      expect(entry[key].mode).toBe('insensitive')
    }
  })
})
