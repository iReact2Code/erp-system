import OrderManagementPage from '@/components/orders/order-management-page'
import { getTranslations } from 'next-intl/server'

export default async function OrdersPage() {
  const t = await getTranslations('orders')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>
      <OrderManagementPage />
    </div>
  )
}
