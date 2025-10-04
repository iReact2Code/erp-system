import { PrismaClient } from '@/generated/prisma'
import { attachPrismaLogger } from './prisma-logger'
import {
  attachPrismaPerformance,
  PrismaEventClientLike,
} from './prisma-performance'

declare global {
  var cachedPrisma: PrismaClient
}

export let db: PrismaClient
if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient()
  if (process.env.DB_PERF_ENABLE === '1') {
    attachPrismaPerformance(db as unknown as PrismaEventClientLike)
  }
  // In production we avoid verbose Prisma logging by default
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = new PrismaClient()
    if (process.env.DB_PERF_ENABLE !== '0') {
      attachPrismaPerformance(
        global.cachedPrisma as unknown as PrismaEventClientLike
      )
    }
    // Attach optional Prisma query logger in development if requested
    if (process.env.ENABLE_PRISMA_LOG === '1') {
      try {
        attachPrismaLogger(global.cachedPrisma)
      } catch {
        // ignore logger attach issues
      }
    }
  }
  db = global.cachedPrisma
}
