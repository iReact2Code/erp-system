/**
 * Optional lightweight Prisma query logger.
 * ENABLE_PRISMA_LOG=1 to enable.
 */
const ENABLED = process.env.ENABLE_PRISMA_LOG === '1'

export function attachPrismaLogger(prisma: unknown) {
  if (!ENABLED || !prisma || typeof (prisma as any).$on !== 'function') return
  try {
    ;(prisma as any).$on('query', (e: unknown) => {
      // e may contain a duration and query string
      const dur = (e as any)?.duration
      const query = (e as any)?.query
      console.debug('[prisma]', dur ? `${dur}ms` : '', query || '')
    })
  } catch {
    // ignore logger attach errors
  }
}
