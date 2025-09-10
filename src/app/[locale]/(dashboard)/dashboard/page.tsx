import { auth } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { SalesTable } from '@/components/sales/sales-table'
import { PurchasesTable } from '@/components/purchases/purchases-table'
import { ReportsComponent } from '@/components/reports/reports-component'
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const session = await auth()
  const t = await getTranslations('dashboard')

  if (!session) {
    return <div>Please log in to access the dashboard.</div>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="animate-slide-in-left">
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">
          {t('welcome')}, {session.user?.name}! {t('role')}:{' '}
          {session.user?.role}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stats-grid">
        <Card className="rtl:text-right hover-lift animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalSales')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground stat-icon" />
          </CardHeader>
          <CardContent className="card-content">
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              +0% {t('stats.fromLastMonth')}
            </p>
          </CardContent>
        </Card>
        <Card
          className="rtl:text-right hover-lift animate-scale-in"
          style={{ animationDelay: '0.1s' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('stats.inventoryItems')}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground stat-icon" />
          </CardHeader>
          <CardContent className="card-content">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              0 {t('stats.itemsLowStock')}
            </p>
          </CardContent>
        </Card>
        <Card
          className="rtl:text-right hover-lift animate-scale-in"
          style={{ animationDelay: '0.2s' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('stats.activeOrders')}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground stat-icon" />
          </CardHeader>
          <CardContent className="card-content">
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              0 {t('stats.pendingApproval')}
            </p>
          </CardContent>
        </Card>
        <Card
          className="rtl:text-right hover-lift animate-scale-in"
          style={{ animationDelay: '0.3s' }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 rtl:flex-row-reverse">
            <CardTitle className="text-sm font-medium">
              {t('stats.totalUsers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground stat-icon" />
          </CardHeader>
          <CardContent className="card-content">
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              {session?.user?.role?.toLowerCase()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        defaultValue="inventory"
        className="space-y-4 rtl:text-right animate-slide-in-right"
      >
        <TabsList className="hover-glow">
          <TabsTrigger value="inventory" className="hover-scale">
            {t('tabs.inventory')}
          </TabsTrigger>
          <TabsTrigger value="sales" className="hover-scale">
            {t('tabs.sales')}
          </TabsTrigger>
          <TabsTrigger value="purchases" className="hover-scale">
            {t('tabs.purchases')}
          </TabsTrigger>
          <TabsTrigger value="reports" className="hover-scale">
            {t('tabs.reports')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4 animate-fade-in">
          <InventoryTable />
        </TabsContent>

        <TabsContent value="sales" className="space-y-4 animate-fade-in">
          <SalesTable />
        </TabsContent>

        <TabsContent value="purchases" className="space-y-4 animate-fade-in">
          <PurchasesTable />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4 animate-fade-in">
          <ReportsComponent />
        </TabsContent>
      </Tabs>
    </div>
  )
}
