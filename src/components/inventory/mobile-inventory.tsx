'use client'

import React, { useState } from 'react'
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
      <div className="flex justify-between items-start mb-3">
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
            <Edit className="h-3 w-3" />
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
            <Trash2 className="h-3 w-3" />
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
              <AlertTriangle className="h-3 w-3 text-red-500" />
            )}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Price:</span>
          <p className="font-medium">${item.unitPrice.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <div className="flex justify-between items-center text-xs">
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
        title={item ? 'Edit Product' : 'Add New Product'}
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
            label="Product Name"
            required
            value={formData.name}
            onChange={e =>
              setFormData(prev => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter product name"
          />

          <ResponsiveInput
            label="SKU"
            required
            value={formData.sku}
            onChange={e =>
              setFormData(prev => ({ ...prev, sku: e.target.value }))
            }
            placeholder="Enter SKU"
          />
        </ResponsiveFormGrid>

        <ResponsiveFormGrid>
          <ResponsiveSelect
            label="Category"
            required
            options={categories}
            value={formData.category}
            onValueChange={value =>
              setFormData(prev => ({ ...prev, category: value }))
            }
            placeholder="Select category"
          />

          <ResponsiveSelect
            label="Status"
            required
            options={statuses}
            value={formData.status}
            onValueChange={value =>
              setFormData(prev => ({
                ...prev,
                status: value as 'active' | 'inactive' | 'discontinued',
              }))
            }
          />
        </ResponsiveFormGrid>

        <ResponsiveFormGrid columns={{ mobile: 1, tablet: 3, desktop: 3 }}>
          <ResponsiveInput
            label="Current Stock"
            type="number"
            required
            value={formData.currentStock.toString()}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                currentStock: parseInt(e.target.value) || 0,
              }))
            }
            placeholder="0"
          />

          <ResponsiveInput
            label="Minimum Stock"
            type="number"
            required
            value={formData.minStock.toString()}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                minStock: parseInt(e.target.value) || 0,
              }))
            }
            placeholder="0"
          />

          <ResponsiveInput
            label="Maximum Stock"
            type="number"
            required
            value={formData.maxStock.toString()}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                maxStock: parseInt(e.target.value) || 0,
              }))
            }
            placeholder="100"
          />
        </ResponsiveFormGrid>

        <ResponsiveFormGrid>
          <ResponsiveInput
            label="Unit Price"
            type="number"
            step="0.01"
            required
            value={formData.unitPrice.toString()}
            onChange={e =>
              setFormData(prev => ({
                ...prev,
                unitPrice: parseFloat(e.target.value) || 0,
              }))
            }
            placeholder="0.00"
          />

          <ResponsiveInput
            label="Location"
            required
            value={formData.location}
            onChange={e =>
              setFormData(prev => ({ ...prev, location: e.target.value }))
            }
            placeholder="Enter storage location"
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
        title="Inventory Management"
        subtitle={`${filteredItems.length} products total${lowStockItems > 0 ? ` • ${lowStockItems} low stock` : ''}`}
        actions={
          <ResponsiveButton
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </ResponsiveButton>
        }
      >
        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
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
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-4">
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
