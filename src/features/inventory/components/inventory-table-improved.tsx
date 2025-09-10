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
import { Search, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { InventoryForm } from '@/components/inventory/inventory-form'
import { useInventory, useDeleteInventory } from '@/features/inventory/hooks'
import { TableLoading } from '@/components/ui/loading'
import { ApiErrorDisplay } from '@/components/ui/error-boundary'

export function InventoryTableImproved() {
  const [searchTerm, setSearchTerm] = useState('')
  const t = useTranslations('common')

  const { data: items, loading, error, refresh } = useInventory()
  const deleteInventory = useDeleteInventory()

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return

    const result = await deleteInventory.mutate(id)
    if (result.success) {
      refresh() // Refresh the list
    }
  }

  const handleInventoryCreated = () => {
    refresh() // Refresh the list when new item is created
  }

  const filteredItems = (items || []).filter(
    item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    } else if (quantity < 10) {
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-white">
          Low Stock
        </Badge>
      )
    }
    return (
      <Badge variant="default" className="bg-green-500">
        In Stock
      </Badge>
    )
  }

  return (
    <Card className="hover-lift animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('inventory')}</CardTitle>
            <CardDescription>{t('manageInventory')}</CardDescription>
          </div>
          <InventoryForm mode="add" onSuccess={handleInventoryCreated} />
        </div>
      </CardHeader>
      <CardContent>
        <ApiErrorDisplay
          error={error || deleteInventory.error}
          onDismiss={() => deleteInventory.reset()}
        />

        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchInventory')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {loading ? (
          <TableLoading rows={5} columns={6} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('name')}</TableHead>
                <TableHead>{t('sku')}</TableHead>
                <TableHead>{t('description')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('price')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.sku}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {item.description || '-'}
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                  <TableCell>{getStockStatus(item.quantity)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <InventoryForm
                        item={item}
                        mode="edit"
                        onSuccess={handleInventoryCreated}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteInventory.loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    {searchTerm ? t('noItemsFound') : t('noItems')}
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
