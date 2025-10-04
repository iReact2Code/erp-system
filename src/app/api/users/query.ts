/**
 * Build a Prisma where filter for users from a free-text query `q`.
 * Extracted so it can be unit-tested without Next runtime.
 */
export function buildUserWhere(q?: string): unknown | undefined {
  if (!q || q.trim() === '') return undefined
  const term = q.trim()
  return {
    OR: [
      { name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ],
  }
}
