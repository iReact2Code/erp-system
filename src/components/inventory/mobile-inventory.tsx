'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  useResponsive,
  mobileContainer,
  touchFriendly,
} from '@/lib/responsive-utils'
import {
  ResponsiveDashboardLayout,
  ResponsiveTable,
} from '@/components/layout/responsive-components'
import {
  ResponsiveButton,
  MobileFormDialog,
  ResponsiveForm,
  ResponsiveInput,
  ResponsiveSelect,
  ResponsiveFormGrid,
} from '@/components/layout/responsive-forms'
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  Edit,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  location: string
  status: 'active' | 'inactive' | 'discontinued'
  lastUpdated: string
}

interface MobileInventoryProps {
  items: InventoryItem[]
  onItemUpdate: (item: InventoryItem) => void
  onItemDelete: (id: string) => void
  onItemAdd: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void
}

const getStockStatus = (current: number, min: number, max: number) => {
  if (current <= min * 0.5)
    return { status: 'critical', color: 'bg-red-100 text-red-800' }
  if (current <= min)
    return { status: 'low', color: 'bg-yellow-100 text-yellow-800' }
  if (current >= max)
    return { status: 'high', color: 'bg-blue-100 text-blue-800' }
  return { status: 'normal', color: 'bg-green-100 text-green-800' }
}

const MobileInventoryCard: React.FC<{
  item: InventoryItem
  onEdit: () => void
  onDelete: () => void
}> = ({ item, onEdit, onDelete }) => {
  const { isMobile } = useResponsive()
  const stockStatus = getStockStatus(
    item.currentStock,
    item.minStock,
    item.maxStock
  )

  return (
    <Card
      className={cn('transition-all hover:shadow-md', isMobile ? 'p-3' : 'p-4')}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3
            className={cn('font-semibold', isMobile ? 'text-sm' : 'text-base')}
          >
            {isMobile && item.name.length > 25
              ? item.name.substring(0, 25) + '...'
              : item.name}
          </h3>
          <p className="text-xs text-muted-foreground">{item.sku}</p>
        </div>
        <div className="flex gap-1">
          <ResponsiveButton
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className={cn(isMobile ? 'h-8 w-8 p-0' : 'h-9 w-9 p-0')}
          >
            <Edit className="w-3 h-3" />
          </ResponsiveButton>
          <ResponsiveButton
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className={cn(
              'text-red-600 hover:text-red-700',
              isMobile ? 'h-8 w-8 p-0' : 'h-9 w-9 p-0'
            )}
          >
            <Trash2 className="w-3 h-3" />
          </ResponsiveButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-muted-foreground">Category:</span>
          <p className="font-medium">{item.category}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Location:</span>
          <p className="font-medium">{item.location}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Stock:</span>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs', stockStatus.color)}>
              {item.currentStock}
            </Badge>
            {stockStatus.status === 'critical' && (
              <AlertTriangle className="w-3 h-3 text-red-500" />
            )}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Price:</span>
          <p className="font-medium">${item.unitPrice.toFixed(2)}</p>
        </div>
      </div>

      <div className="pt-3 mt-3 border-t">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Min: {item.minStock} | Max: {item.maxStock}
          </span>
          <Badge
            variant={item.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {item.status}
          </Badge>
        </div>
      </div>
    </Card>
  )
}

type InventoryFormData = {
  name: string
  sku: string
  category: string
  currentStock: number
  minStock: number
  maxStock: number
  unitPrice: number
  location: string
  status: 'active' | 'inactive' | 'discontinued'
}

const InventoryForm: React.FC<{
  item?: InventoryItem
  onSubmit: (data: InventoryFormData) => void
  onCancel: () => void
}> = ({ item, onSubmit, onCancel }) => {
  const t = useTranslations('inventory')
  const [formData, setFormData] = useState({
    name: item?.name || '',
    sku: item?.sku || '',
    category: item?.category || '',
    currentStock: item?.currentStock || 0,
    minStock: item?.minStock || 0,
    maxStock: item?.maxStock || 100,
    unitPrice: item?.unitPrice || 0,
    location: item?.location || '',
    status: item?.status || 'active',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const categories = [
    { value: 'electronics', label: 'Electronics' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'books', label: 'Books' },
    { value: 'home', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports' },
    { value: 'automotive', label: 'Automotive' },
  ]

  const statuses = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'discontinued', label: 'Discontinued' },
  ]

  return (
    <form onSubmit={handleSubmit}>
      <ResponsiveForm
        title={item ? t('editItem') : t('addItem')}
        description={
          item
            ? 'Update product information'
            : 'Enter details for the new product'
        }
        actions={
          <>
            <ResponsiveButton
              type="button"
              variant="outline"
              onClick={onCancel}
              fullWidth
            >
              Cancel
            </ResponsiveButton>
            <ResponsiveButton type="submit" fullWidth>
              {item ? 'Update' : 'Add'} Product
            </ResponsiveButton>
          </>
        }
      >
        <ResponsiveFormGrid>
          <ResponsiveInput
            label={t('name')}
            required
            value={formData.name}
            onChange={e =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            placeholder={t('name')}
          />

          <ResponsiveInput
            label={t('sku')}
            required
            value={formData.sku}
            onChange={e =>
              setFormData(prev => ({ ...prev, sku: e.target.value }))
            }
            placeholder={t('sku')}
          />
        </ResponsiveFormGrid>

        <ResponsiveFormGrid>
          <ResponsiveSelect
            label={t('category')}
            required
            options={categories}
            value={formData.category}
            onValueChange={value =>
              setFormData(prev => ({ ...prev, category: value }))
            }
            placeholder={t('category')}
          />

          <ResponsiveSelect
            label={t('status')}
            required
            options={statuses}
            value={formData.status}
            onValueChange={value =>
              setFormData(prev => ({
                ...prev,
                status: value as 'active' | 'inactive' | 'discontinued',
              }))
            }
            placeholder={t('status')}
          />
        </ResponsiveFormGrid>

        <ResponsiveFormGrid columns={{ mobile: 1, tablet: 3, desktop: 3 }}>
          <ResponsiveInput
            label={t('currentStock')}
            type="number"
            required
            value={formData.currentStock.toString()}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                currentStock: parseInt(e.target.value) || 0,
              }))
            }
            placeholder={t('currentStock')}
          />

          <ResponsiveInput
            label={t('unitPrice')}
            type="number"
            required
            value={formData.unitPrice.toString()}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                unitPrice: parseFloat(e.target.value) || 0,
              }))
            }
            placeholder={t('unitPrice')}
          />

          <ResponsiveInput
            label={t('minStock')}
            type="number"
            required
            value={formData.minStock.toString()}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                minStock: parseInt(e.target.value) || 0,
              }))
            }
            placeholder={t('minStock')}
          />

          <ResponsiveInput
            label={t('maxStock')}
            type="number"
            required
            value={formData.maxStock.toString()}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                maxStock: parseInt(e.target.value) || 0,
              }))
            }
            placeholder={t('maxStock')}
          />
        </ResponsiveFormGrid>

        <ResponsiveFormGrid>
          <ResponsiveInput
            label={t('price')}
            type="number"
            required
            value={formData.price.toString()}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                price: parseFloat(e.target.value) || 0,
              }))
            }
            placeholder={t('price')}
          />

          <ResponsiveInput
            label={t('location')}
            value={formData.location}
            onChange={e =>
              setFormData(prev => ({ ...prev, location: e.target.value }))
            }
            placeholder={t('location')}
          />
        </ResponsiveFormGrid>
      </ResponsiveForm>
    </form>
  )
}

const MobileInventoryManagement: React.FC<MobileInventoryProps> = ({
  items,
  onItemUpdate,
  onItemDelete,
  onItemAdd,
}) => {
  const { isMobile } = useResponsive()
  const t = useTranslations('inventory')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || item.category === categoryFilter
    const matchesStatus = !statusFilter || item.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const lowStockItems = filteredItems.filter(
    item => item.currentStock <= item.minStock
  ).length

  const categories = [...new Set(items.map(item => item.category))]
  const statuses = [...new Set(items.map(item => item.status))]

  const handleFormSubmit = (data: InventoryFormData) => {
    if (editingItem) {
      onItemUpdate({
        ...editingItem,
        ...data,
        lastUpdated: new Date().toISOString(),
      })
      setEditingItem(null)
    } else {
      onItemAdd(data)
      setShowAddForm(false)
    }
  }

  return (
    <div className={mobileContainer}>
      <ResponsiveDashboardLayout
        title={t('title')}
        subtitle={`${filteredItems.length} products total${lowStockItems > 0 ? ` • ${lowStockItems} low stock` : ''}`}
        actions={
          <ResponsiveButton
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('addItem')}
          </ResponsiveButton>
        }
      >
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute w-4 h-4 left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search products or SKU..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={cn('pl-9', touchFriendly.input)}
              />
            </div>

            {!isMobile && (
              <div className="flex gap-3">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
                >
                  <option value="">All Status</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        {lowStockItems > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-semibold text-yellow-800">
                    Low Stock Alert
                  </p>
                  <p className="text-sm text-yellow-700">
                    {lowStockItems}{' '}
                    {lowStockItems === 1 ? 'product needs' : 'products need'}{' '}
                    restocking
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory List */}
        {isMobile ? (
          <div className="space-y-3">
            {filteredItems.map(item => (
              <MobileInventoryCard
                key={item.id}
                item={item}
                onEdit={() => setEditingItem(item)}
                onDelete={() => onItemDelete(item.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <ResponsiveTable
                headers={[
                  'Product',
                  'SKU',
                  'Category',
                  'Stock',
                  'Price',
                  'Status',
                  'Actions',
                ]}
                rows={filteredItems.map(item => ({
                  product: item.name,
                  sku: item.sku,
                  category: item.category,
                  stock: `${item.currentStock}/${item.minStock}-${item.maxStock}`,
                  price: `$${item.unitPrice.toFixed(2)}`,
                  status: item.status,
                  actions: 'Edit | Delete',
                }))}
                onRowClick={row => {
                  const item = filteredItems.find(i => i.sku === row.sku)
                  if (item) setEditingItem(item)
                }}
              />
            </CardContent>
          </Card>
        )}

        {filteredItems.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No products found</h3>
              <p className="mb-4 text-muted-foreground">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first product'}
              </p>
              <ResponsiveButton onClick={() => setShowAddForm(true)}>
                Add First Product
              </ResponsiveButton>
            </CardContent>
          </Card>
        )}
      </ResponsiveDashboardLayout>

      {/* Add/Edit Form Dialog */}
      <MobileFormDialog
        isOpen={showAddForm || editingItem !== null}
        onClose={() => {
          setShowAddForm(false)
          setEditingItem(null)
        }}
        title={editingItem ? 'Edit Product' : 'Add New Product'}
      >
        <InventoryForm
          item={editingItem || undefined}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowAddForm(false)
            setEditingItem(null)
          }}
        />
      </MobileFormDialog>
    </div>
  )
}

export default MobileInventoryManagement
