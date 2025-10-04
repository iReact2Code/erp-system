import { PrismaClient } from '@/generated/prisma'

export interface RepositoryContext {
  prisma: PrismaClient
}

export abstract class BaseRepository {
  protected prisma: PrismaClient
  constructor(ctx: RepositoryContext) {
    this.prisma = ctx.prisma
  }
}
