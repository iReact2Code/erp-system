import { PurchasesTable } from '@/components/purchases/purchases-table'
import { getTranslations } from 'next-intl/server'

export default async function PurchasesPage() {
  const t = await getTranslations('purchases')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <PurchasesTable />
    </div>
  )
}
