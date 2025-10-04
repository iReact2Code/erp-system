import { buildUserWhere } from './query'

export type UsersFetchOptions = {
  q?: string
  page?: number
  limit?: number
}

/**
 * Fetch users using a provided db object. This is extracted so it can be
 * unit-tested by passing a fake db implementation without touching Next runtime.
 */
export async function fetchUsers(db: unknown, opts: UsersFetchOptions = {}) {
  const { q, page = undefined, limit = undefined } = opts

  if (q || page) {
    const pageNum = Math.max(1, Number(page) || 1)
    const lim = Math.max(1, Math.min(200, Number(limit) || 25))
    const skip = (pageNum - 1) * lim

    const where = buildUserWhere(q)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _db = db as any
    const [users, total] = await Promise.all([
      _db.user.findMany({
        where: where as unknown as never,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: lim,
      }),
      _db.user.count({ where: where as unknown as never }),
    ])

    return {
      data: users,
      pagination: {
        page: pageNum,
        limit: lim,
        total,
        pages: Math.ceil(total / lim),
      },
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _db = db as any
  const users = await _db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return users
}
