'use client'

import { useState } from 'react'
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

export function PurchasesTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const t = useTranslations('common')

  const { data: purchases, loading, error, refresh } = usePurchases()
  const deletePurchase = useDeletePurchase()

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return

    const result = await deletePurchase.mutate(id)
    if (result.success) {
      refresh()
    }
  }

  const handlePurchaseCreated = () => {
    refresh()
  }

  const filteredPurchases = (purchases || []).filter(purchase =>
    purchase.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-500">
            Completed
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white">
            Pending
          </Badge>
        )
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="hover-lift animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('purchases')}</CardTitle>
            <CardDescription>{t('managePurchases')}</CardDescription>
          </div>
          <PurchaseForm mode="add" onSuccess={handlePurchaseCreated} />
        </div>
      </CardHeader>
      <CardContent>
        <ApiErrorDisplay
          error={error || deletePurchase.error}
          onDismiss={() => deletePurchase.reset()}
        />

        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPurchases')}
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
                <TableHead>{t('id')}</TableHead>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('total')}</TableHead>
                <TableHead>{t('status')}</TableHead>
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
                  <TableCell>${purchase.total.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
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
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPurchases.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {searchTerm ? t('noPurchasesFound') : t('noPurchases')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
