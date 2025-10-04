import { User } from '@/generated/prisma'
import { buildUserWhere } from '@/app/api/users/query'
import { RepositoryContext, BaseRepository } from './base'

export interface UserListParams {
  page?: number
  limit?: number
  q?: string
}

export interface PaginatedUserResult {
  data: Partial<User>[]
  total: number
  page: number
  limit: number
  pages: number
}

export class UserRepository extends BaseRepository {
  constructor(ctx: RepositoryContext) {
    super(ctx)
  }

  private get userSelect() {
    return {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  }

  async list(
    params: UserListParams
  ): Promise<PaginatedUserResult | Partial<User>[]> {
    const { page, limit, q } = params

    if (q || page) {
      const pageNum = Math.max(1, Number(page) || 1)
      const lim = Math.max(1, Math.min(200, Number(limit) || 25))
      const skip = (pageNum - 1) * lim
      const where = buildUserWhere(q) as Record<string, unknown> | undefined

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          select: this.userSelect,
          orderBy: { createdAt: 'desc' },
          skip,
          take: lim,
        }),
        this.prisma.user.count({ where }),
      ])

      return {
        data: users,
        total,
        page: pageNum,
        limit: lim,
        pages: Math.ceil(total / lim),
      }
    }

    return this.prisma.user.findMany({
      select: this.userSelect,
      orderBy: { createdAt: 'desc' },
    })
  }
}
