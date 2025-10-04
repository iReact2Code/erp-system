'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import useDebouncedValue from '@/hooks/use-debounced-value'
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
import type { InventoryItem } from '@/types/api'

// Memoized table row component to prevent unnecessary re-renders
const InventoryTableRow = memo(
  ({
    item,
    onDelete,
    onEditSuccess,
    deleteLoading,
    style,
  }: {
    item: InventoryItem
    onDelete: (id: string) => void
    onEditSuccess: () => void
    deleteLoading: boolean
    style?: React.CSSProperties
  }) => {
    const tInventory = useTranslations('inventory')

    const getStockStatus = useCallback(
      (quantity: number) => {
        const qty = quantity ?? 0
        if (qty === 0) {
          return <Badge variant="destructive">{tInventory('outOfStock')}</Badge>
        } else if (qty < 10) {
          return (
            <Badge variant="secondary" className="text-white bg-yellow-500">
              {tInventory('lowStock')}
            </Badge>
          )
        }
        return (
          <Badge variant="default" className="bg-green-500">
            {tInventory('inStock')}
          </Badge>
        )
      },
      [tInventory]
    )

    return (
      <TableRow key={item.id} style={style}>
        <TableCell className="font-medium">{item.name}</TableCell>
        <TableCell>{item.sku}</TableCell>
        <TableCell className="max-w-xs truncate">
          {item.description || '-'}
        </TableCell>
        <TableCell>{item.quantity ?? 0}</TableCell>
        <TableCell>
          ${item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'}
        </TableCell>
        <TableCell>{getStockStatus(item.quantity ?? 0)}</TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <InventoryForm item={item} mode="edit" onSuccess={onEditSuccess} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item.id)}
              disabled={deleteLoading}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    )
  }
)

InventoryTableRow.displayName = 'InventoryTableRow'

export const InventoryTable = memo(() => {
  const [searchTerm, setSearchTerm] = useState('')
  const t = useTranslations('inventory')
  const tCommon = useTranslations('common')

  const { data: items, loading, error, refresh } = useInventory()
  // Normalize items: hook may return raw array or wrapped { data: [...] }
  const itemsArray: InventoryItem[] = useMemo(() => {
    if (Array.isArray(items)) return items as InventoryItem[]
    if (items && typeof items === 'object' && 'data' in items) {
      return (items as { data: InventoryItem[] }).data
    }
    return []
  }, [items])
  const deleteInventory = useDeleteInventory()

  // Memoized delete handler to prevent re-renders
  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm(tCommon('confirmDelete'))) return

      const result = await deleteInventory.mutate(id)
      if (result.success) {
        refresh()
      }
    },
    [deleteInventory, refresh, tCommon]
  )

  // Memoized success handler
  const handleInventoryCreated = useCallback(() => {
    refresh()
  }, [refresh])

  const debouncedSearch = useDebouncedValue(
    searchTerm,
    process.env.NODE_ENV === 'test' ? 0 : 250
  )

  // Memoized filtered items to prevent unnecessary recalculations
  const filteredItems = useMemo(() => {
    const q = debouncedSearch.toLowerCase()
    if (!itemsArray) return []
    if (!q) return itemsArray
    return itemsArray.filter(
      item =>
        (item.name || '').toLowerCase().includes(q) ||
        (item.sku || '').toLowerCase().includes(q)
    )
  }, [itemsArray, debouncedSearch])

  // Virtualization setup ----------------------------------------------------
  const VIRTUALIZATION_THRESHOLD = 100
  const ROW_HEIGHT = 56 // px approximate row height including padding
  const enableVirtualization =
    process.env.NEXT_PUBLIC_ENABLE_VIRTUALIZED_TABLES === '1'
  const useVirtual =
    enableVirtualization && filteredItems.length > VIRTUALIZATION_THRESHOLD

  interface VirtualListData {
    items: InventoryItem[]
    handleDelete: (id: string) => void
    handleInventoryCreated: () => void
    deleteLoading: boolean
  }

  const VirtualRow = useCallback(
    ({ index, style, data }: ListChildComponentProps<VirtualListData>) => {
      const item = data.items[index]
      return (
        <InventoryTableRow
          item={item}
          // style comes from react-window; ensure width stretch
          style={{ ...style, width: '100%' }}
          onDelete={data.handleDelete}
          onEditSuccess={data.handleInventoryCreated}
          deleteLoading={data.deleteLoading}
        />
      )
    },
    []
  )

  // Memoized search handler
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value)
    },
    []
  )

  return (
    <Card className="hover-lift animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{tCommon('inventory')}</CardTitle>
            <CardDescription>{tCommon('manageInventory')}</CardDescription>
          </div>
          <InventoryForm mode="add" onSuccess={handleInventoryCreated} />
        </div>
      </CardHeader>
      <CardContent>
        <ApiErrorDisplay
          error={error || deleteInventory.error}
          onDismiss={() => deleteInventory.reset()}
        />

        <div className="flex items-center mb-4 space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={tCommon('searchInventory')}
            value={searchTerm}
            onChange={handleSearchChange}
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
                <TableHead>{t('itemDescription')}</TableHead>
                <TableHead>{t('quantity')}</TableHead>
                <TableHead>{t('price')}</TableHead>
                <TableHead>{t('status')}</TableHead>
                <TableHead>{tCommon('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            {useVirtual ? (
              <TableBody>
                <tr>
                  <td colSpan={7} className="p-0">
                    <div
                      style={{
                        width: '100%',
                        height: Math.min(
                          600,
                          filteredItems.length * ROW_HEIGHT
                        ),
                      }}
                      data-testid="virtualized-container"
                    >
                      <List
                        height={Math.min(
                          600,
                          filteredItems.length * ROW_HEIGHT
                        )}
                        itemCount={filteredItems.length}
                        itemSize={ROW_HEIGHT}
                        width="100%"
                        itemData={{
                          items: filteredItems,
                          handleDelete,
                          handleInventoryCreated,
                          deleteLoading: deleteInventory.loading,
                        }}
                      >
                        {VirtualRow}
                      </List>
                    </div>
                  </td>
                </tr>
              </TableBody>
            ) : (
              <TableBody>
                {filteredItems.map(item => (
                  <InventoryTableRow
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    onEditSuccess={handleInventoryCreated}
                    deleteLoading={deleteInventory.loading}
                  />
                ))}
                {filteredItems.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      {searchTerm
                        ? tCommon('noItemsFound')
                        : tCommon('noItems')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        )}
      </CardContent>
    </Card>
  )
})

InventoryTable.displayName = 'InventoryTable'
