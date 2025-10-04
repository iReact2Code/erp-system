/**
 * Build a Prisma where filter for inventory items from free-text query `q`.
 * Extracted to allow unit testing without Next runtime.
 */
export function buildInventoryWhere(q?: string): unknown | undefined {
  if (!q || q.trim() === '') return undefined
  const term = q.trim()
  return {
    OR: [
      { name: { contains: term, mode: 'insensitive' } },
      { sku: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ],
  }
}
