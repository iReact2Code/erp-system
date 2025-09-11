import { LazyReportsComponent } from '@/lib/lazy-components'

export default async function ReportsPage() {
  return (
    <div className="space-y-6">
      <LazyReportsComponent />
    </div>
  )
}
