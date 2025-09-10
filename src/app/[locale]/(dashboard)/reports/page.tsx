import { ReportsComponent } from '@/components/reports/reports-component'
import { getTranslations } from 'next-intl/server'

export default async function ReportsPage() {
  const t = await getTranslations('reports')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <ReportsComponent />
    </div>
  )
}
