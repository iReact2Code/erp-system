'use client'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const LazyReportsInner = dynamic(() => import('./reports-component'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4" data-testid="reports-loading">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-64 w-full" />
    </div>
  ),
})

export function ReportsComponentLazy() {
  if (process.env.NEXT_PUBLIC_LAZY_REPORTS === '0') {
    // Defer to normal import path WITHOUT dynamic: fallback to direct component
    // We wrap in a dynamic import anyway to avoid duplicate logic; but could require directly.
    return <LazyReportsInner />
  }
  return <LazyReportsInner />
}

export default ReportsComponentLazy
