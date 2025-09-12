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
import { SaleForm } from '@/components/sales/sale-form'
import { useSales, useDeleteSale } from '@/features/sales/hooks'
import { TableLoading } from '@/components/ui/loading'
import { ApiErrorDisplay } from '@/components/ui/error-boundary'

export const SalesTable = memo(function SalesTable() {
  const [searchTerm, setSearchTerm] = useState('')
  const t = useTranslations('common')
  const tSales = useTranslations('sales')

  const { data: sales, loading, error, refresh } = useSales()
  const deleteSale = useDeleteSale()

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(t('confirmDelete'))) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (deleteSale.mutate as any)(id)
      if (result && result.success) {
        refresh()
      }
    },
    [deleteSale, refresh, t]
  )

  const handleSaleCreated = useCallback(() => {
    refresh()
  }, [refresh])

  const filteredSales = useMemo(() => {
    const list = Array.isArray(sales) ? sales : (sales?.data ?? [])
    return (list || []).filter(sale =>
      sale.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [sales, searchTerm])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge variant="default" className="bg-green-500">
            {tSales('completed')}
          </Badge>
        )
      case 'PENDING':
        return (
          <Badge variant="secondary" className="text-white bg-yellow-500">
            {tSales('pending')}
          </Badge>
        )
      case 'CANCELLED':
        return <Badge variant="destructive">{tSales('cancelled')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card className="hover-lift animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{tSales('title')}</CardTitle>
            <CardDescription>{tSales('description')}</CardDescription>
          </div>
          <SaleForm mode="add" onSuccess={handleSaleCreated} />
        </div>
      </CardHeader>
      <CardContent>
        <ApiErrorDisplay
          error={error || deleteSale.error}
          onDismiss={() => deleteSale.reset()}
        />

        <div className="flex items-center mb-4 space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`${t('search')} ${tSales('title')}`}
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
                <TableHead>{tSales('date')}</TableHead>
                <TableHead>{tSales('total')}</TableHead>
                <TableHead>{tSales('status')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">
                    {sale.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>${sale.total.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(sale.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <SaleForm
                        sale={sale}
                        mode="edit"
                        onSuccess={handleSaleCreated}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(sale.id)}
                        disabled={deleteSale.loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSales.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {searchTerm ? tSales('noSales') : tSales('noSales')}
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
