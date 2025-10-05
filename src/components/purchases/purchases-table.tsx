'use client'

import { memo, useMemo, useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PurchaseForm } from '@/components/purchases/purchase-form'
import { usePurchases, useDeletePurchase } from '@/features/purchases/hooks'
import { TableLoading } from '@/components/ui/loading'
import { ApiErrorDisplay } from '@/components/ui/error-boundary'
import { useParams } from 'next/navigation'
import { formatCurrency as formatCurrencyUtil } from '@/lib/formatters'

export const PurchasesTable = memo(function PurchasesTable() {
  const { locale } = useParams<{ locale: string }>()
  const [searchTerm, setSearchTerm] = useState('')
  const t = useTranslations('common')
  const tPurchases = useTranslations('purchases')

  const { data: purchases, loading, error, refresh } = usePurchases()
  // normalize handled in useMemo below
  const deletePurchase = useDeletePurchase()

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(t('confirmDelete'))) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (deletePurchase.mutate as any)(id)
      if (result && result.success) {
        refresh()
      }
    },
    [deletePurchase, refresh, t]
  )

  const handlePurchaseCreated = useCallback(() => {
    refresh()
  }, [refresh])

  const filteredPurchases = useMemo(() => {
    const list = Array.isArray(purchases) ? purchases : (purchases?.data ?? [])
    return (list || []).filter(purchase =>
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [purchases, searchTerm])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-500">
            {tPurchases('completed')}
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant="secondary" className="text-white bg-yellow-500">
            {tPurchases('pending')}
          </Badge>
        )
      case 'CANCELLED':
        return <Badge variant="destructive">{tPurchases('cancelled')}</Badge>
      case 'APPROVED':
        return (
          <Badge variant="default" className="bg-blue-500">
            {tPurchases('approved')}
          </Badge>
        )
      case 'REJECTED':
        return <Badge variant="destructive">{tPurchases('rejected')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="hover-lift animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{tPurchases('title')}</CardTitle>
            <CardDescription>{tPurchases('description')}</CardDescription>
          </div>
          <PurchaseForm mode="add" onSuccess={handlePurchaseCreated} />
        </div>
      </CardHeader>
      <CardContent>
        <ApiErrorDisplay
          error={error || deletePurchase.error}
          onDismiss={() => deletePurchase.reset()}
        />

        <div className="flex items-center mb-4 space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`${t('search')} ${tPurchases('title')}`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <TableLoading rows={5} columns={5} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{tPurchases('total')}</TableHead>
                <TableHead>{tPurchases('status')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchases.map(purchase => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">
                    {purchase.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {new Date(purchase.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {formatCurrencyUtil(purchase.total, locale)}
                  </TableCell>
                  <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <PurchaseForm
                        purchase={purchase}
                        mode="edit"
                        onSuccess={handlePurchaseCreated}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(purchase.id)}
                        disabled={deletePurchase.loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPurchases.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {searchTerm
                      ? tPurchases('noPurchases')
                      : tPurchases('noPurchases')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
})
